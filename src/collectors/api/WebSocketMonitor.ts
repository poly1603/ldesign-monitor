/**
 * @ldesign/monitor - WebSocket 监控器
 * 
 * 监控 WebSocket 连接状态、消息传输和性能
 */

export interface WebSocketMonitorOptions {
  /**
   * 是否记录消息内容
   * @default false
   */
  logMessages?: boolean

  /**
   * 最大消息大小（字节）
   * @default 10240
   */
  maxMessageSize?: number

  /**
   * 消息采样率
   * @default 0.1
   */
  messageSampleRate?: number

  /**
   * 是否追踪心跳
   * @default true
   */
  trackHeartbeat?: boolean

  /**
   * 心跳超时时间（毫秒）
   * @default 30000
   */
  heartbeatTimeout?: number
}

export interface WebSocketConnectionEvent {
  /**
   * 事件类型
   */
  type: 'open' | 'close' | 'error' | 'reconnect'

  /**
   * WebSocket URL
   */
  url: string

  /**
   * 连接时长（毫秒）
   */
  duration?: number

  /**
   * 关闭代码
   */
  closeCode?: number

  /**
   * 关闭原因
   */
  closeReason?: string

  /**
   * 错误信息
   */
  error?: string

  /**
   * 重连次数
   */
  reconnectCount?: number

  /**
   * 时间戳
   */
  timestamp: number
}

export interface WebSocketMessageEvent {
  /**
   * 消息方向
   */
  direction: 'send' | 'receive'

  /**
   * 消息大小（字节）
   */
  size: number

  /**
   * 消息类型
   */
  messageType: 'text' | 'binary' | 'unknown'

  /**
   * 消息内容（可选）
   */
  content?: string | ArrayBuffer

  /**
   * 往返时间（毫秒，仅用于 send）
   */
  rtt?: number

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * WebSocket URL
   */
  url: string
}

export interface WebSocketMetrics {
  /**
   * WebSocket URL
   */
  url: string

  /**
   * 连接状态
   */
  state: 'connecting' | 'open' | 'closing' | 'closed'

  /**
   * 连接开始时间
   */
  connectTime: number

  /**
   * 连接持续时间（毫秒）
   */
  connectionDuration: number

  /**
   * 发送消息数
   */
  messagesSent: number

  /**
   * 接收消息数
   */
  messagesReceived: number

  /**
   * 发送字节数
   */
  bytesSent: number

  /**
   * 接收字节数
   */
  bytesReceived: number

  /**
   * 平均往返时间（毫秒）
   */
  avgRTT?: number

  /**
   * 错误数
   */
  errorCount: number

  /**
   * 重连次数
   */
  reconnectCount: number

  /**
   * 最后活动时间
   */
  lastActivity: number

  /**
   * 是否健康
   */
  isHealthy: boolean
}

export class WebSocketMonitor {
  private options: Required<WebSocketMonitorOptions>
  private onConnection?: (event: WebSocketConnectionEvent) => void
  private onMessage?: (event: WebSocketMessageEvent) => void
  private onMetrics?: (metrics: WebSocketMetrics) => void

  // WebSocket 实例追踪
  private wsMetrics: Map<WebSocket, WebSocketMetrics> = new Map()
  private pendingMessages: Map<WebSocket, Map<string, number>> = new Map()

  // 原始 WebSocket
  private OriginalWebSocket: typeof WebSocket

  constructor(options: WebSocketMonitorOptions = {}) {
    this.options = {
      logMessages: options.logMessages ?? false,
      maxMessageSize: options.maxMessageSize ?? 10240,
      messageSampleRate: options.messageSampleRate ?? 0.1,
      trackHeartbeat: options.trackHeartbeat ?? true,
      heartbeatTimeout: options.heartbeatTimeout ?? 30000,
    }

    this.OriginalWebSocket = WebSocket
  }

  /**
   * 启动监控
   */
  start(
    onConnection: (event: WebSocketConnectionEvent) => void,
    onMessage: (event: WebSocketMessageEvent) => void,
    onMetrics: (metrics: WebSocketMetrics) => void
  ): void {
    this.onConnection = onConnection
    this.onMessage = onMessage
    this.onMetrics = onMetrics

    this.interceptWebSocket()
  }

  /**
   * 停止监控
   */
  stop(): void {
    (window as any).WebSocket = this.OriginalWebSocket
    this.wsMetrics.clear()
    this.pendingMessages.clear()
  }

  /**
   * 获取所有 WebSocket 指标
   */
  getAllMetrics(): WebSocketMetrics[] {
    return Array.from(this.wsMetrics.values())
  }

  /**
   * 拦截 WebSocket
   */
  private interceptWebSocket(): void {
    const self = this
    const OriginalWS = this.OriginalWebSocket

    ;(window as any).WebSocket = function (
      url: string | URL,
      protocols?: string | string[]
    ) {
      const ws = new OriginalWS(url, protocols)
      const wsUrl = typeof url === 'string' ? url : url.toString()

      // 初始化指标
      const metrics: WebSocketMetrics = {
        url: wsUrl,
        state: 'connecting',
        connectTime: Date.now(),
        connectionDuration: 0,
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        errorCount: 0,
        reconnectCount: 0,
        lastActivity: Date.now(),
        isHealthy: true,
      }

      self.wsMetrics.set(ws, metrics)
      self.pendingMessages.set(ws, new Map())

      // 监听 open 事件
      ws.addEventListener('open', (event) => {
        metrics.state = 'open'
        metrics.lastActivity = Date.now()

        if (self.onConnection) {
          self.onConnection({
            type: 'open',
            url: wsUrl,
            timestamp: Date.now(),
          })
        }

        self.updateMetrics(ws)
      })

      // 监听 message 事件
      ws.addEventListener('message', (event) => {
        metrics.messagesReceived++
        metrics.lastActivity = Date.now()

        const size = self.getMessageSize(event.data)
        metrics.bytesReceived += size

        // 检查是否是对之前发送消息的响应
        let rtt: number | undefined
        const pending = self.pendingMessages.get(ws)
        if (pending && pending.size > 0) {
          // 简单假设：第一个待处理消息就是这个响应
          const [messageId, sentTime] = pending.entries().next().value
          rtt = Date.now() - sentTime
          pending.delete(messageId)

          // 更新平均 RTT
          if (metrics.avgRTT) {
            metrics.avgRTT = (metrics.avgRTT + rtt) / 2
          } else {
            metrics.avgRTT = rtt
          }
        }

        // 采样记录消息
        if (Math.random() < self.options.messageSampleRate && self.onMessage) {
          self.onMessage({
            direction: 'receive',
            size,
            messageType: self.getMessageType(event.data),
            content: self.options.logMessages ? self.sanitizeMessage(event.data) : undefined,
            rtt,
            timestamp: Date.now(),
            url: wsUrl,
          })
        }

        self.updateMetrics(ws)
      })

      // 监听 close 事件
      ws.addEventListener('close', (event) => {
        metrics.state = 'closed'
        metrics.connectionDuration = Date.now() - metrics.connectTime

        if (self.onConnection) {
          self.onConnection({
            type: 'close',
            url: wsUrl,
            duration: metrics.connectionDuration,
            closeCode: event.code,
            closeReason: event.reason,
            timestamp: Date.now(),
          })
        }

        self.updateMetrics(ws)

        // 清理
        setTimeout(() => {
          self.wsMetrics.delete(ws)
          self.pendingMessages.delete(ws)
        }, 5000)
      })

      // 监听 error 事件
      ws.addEventListener('error', (event) => {
        metrics.errorCount++
        metrics.isHealthy = false
        metrics.lastActivity = Date.now()

        if (self.onConnection) {
          self.onConnection({
            type: 'error',
            url: wsUrl,
            error: 'WebSocket error',
            timestamp: Date.now(),
          })
        }

        self.updateMetrics(ws)
      })

      // 拦截 send 方法
      const originalSend = ws.send.bind(ws)
      ws.send = function (data: string | ArrayBuffer | Blob | ArrayBufferView) {
        metrics.messagesSent++
        metrics.lastActivity = Date.now()

        const size = self.getMessageSize(data)
        metrics.bytesSent += size

        // 记录待处理消息（用于计算 RTT）
        const messageId = `${Date.now()}-${Math.random()}`
        const pending = self.pendingMessages.get(ws)
        if (pending) {
          pending.set(messageId, Date.now())
        }

        // 采样记录消息
        if (Math.random() < self.options.messageSampleRate && self.onMessage) {
          self.onMessage({
            direction: 'send',
            size,
            messageType: self.getMessageType(data),
            content: self.options.logMessages ? self.sanitizeMessage(data) : undefined,
            timestamp: Date.now(),
            url: wsUrl,
          })
        }

        self.updateMetrics(ws)

        return originalSend(data)
      }

      // 健康检查
      if (self.options.trackHeartbeat) {
        const heartbeatCheck = setInterval(() => {
          const now = Date.now()
          if (now - metrics.lastActivity > self.options.heartbeatTimeout) {
            metrics.isHealthy = false
            self.updateMetrics(ws)
          }

          if (metrics.state === 'closed') {
            clearInterval(heartbeatCheck)
          }
        }, self.options.heartbeatTimeout / 2)
      }

      return ws
    }

    // 保留静态属性
    ;(window as any).WebSocket.CONNECTING = OriginalWS.CONNECTING
    ;(window as any).WebSocket.OPEN = OriginalWS.OPEN
    ;(window as any).WebSocket.CLOSING = OriginalWS.CLOSING
    ;(window as any).WebSocket.CLOSED = OriginalWS.CLOSED
  }

  /**
   * 更新指标
   */
  private updateMetrics(ws: WebSocket): void {
    const metrics = this.wsMetrics.get(ws)
    if (!metrics) return

    metrics.connectionDuration = Date.now() - metrics.connectTime

    if (this.onMetrics) {
      this.onMetrics({ ...metrics })
    }
  }

  /**
   * 获取消息大小
   */
  private getMessageSize(data: any): number {
    if (typeof data === 'string') {
      return new Blob([data]).size
    }
    
    if (data instanceof ArrayBuffer) {
      return data.byteLength
    }
    
    if (data instanceof Blob) {
      return data.size
    }
    
    if (ArrayBuffer.isView(data)) {
      return data.byteLength
    }
    
    return 0
  }

  /**
   * 获取消息类型
   */
  private getMessageType(data: any): 'text' | 'binary' | 'unknown' {
    if (typeof data === 'string') {
      return 'text'
    }
    
    if (data instanceof ArrayBuffer || data instanceof Blob || ArrayBuffer.isView(data)) {
      return 'binary'
    }
    
    return 'unknown'
  }

  /**
   * 清理消息内容（避免记录敏感信息）
   */
  private sanitizeMessage(data: any): string | ArrayBuffer | undefined {
    if (typeof data === 'string') {
      if (data.length > this.options.maxMessageSize) {
        return data.substring(0, this.options.maxMessageSize) + '...'
      }
      return data
    }
    
    if (data instanceof ArrayBuffer) {
      if (data.byteLength > this.options.maxMessageSize) {
        return data.slice(0, this.options.maxMessageSize)
      }
      return data
    }
    
    return undefined
  }
}

/**
 * WebSocket 连接池监控
 */
export class WebSocketPoolMonitor {
  private connections: Map<string, WebSocketMetrics[]> = new Map()

  /**
   * 添加连接指标
   */
  addMetrics(metrics: WebSocketMetrics): void {
    const url = metrics.url
    if (!this.connections.has(url)) {
      this.connections.set(url, [])
    }
    
    this.connections.get(url)!.push(metrics)
  }

  /**
   * 获取连接池统计
   */
  getPoolStats(url: string): {
    totalConnections: number
    activeConnections: number
    avgConnectionDuration: number
    totalMessagesSent: number
    totalMessagesReceived: number
    avgRTT: number
    errorRate: number
  } | null {
    const metrics = this.connections.get(url)
    if (!metrics || metrics.length === 0) {
      return null
    }

    const active = metrics.filter(m => m.state === 'open').length
    const avgDuration = metrics.reduce((sum, m) => sum + m.connectionDuration, 0) / metrics.length
    const totalSent = metrics.reduce((sum, m) => sum + m.messagesSent, 0)
    const totalReceived = metrics.reduce((sum, m) => sum + m.messagesReceived, 0)
    
    const rtts = metrics.filter(m => m.avgRTT !== undefined).map(m => m.avgRTT!)
    const avgRTT = rtts.length > 0 ? rtts.reduce((a, b) => a + b, 0) / rtts.length : 0
    
    const errors = metrics.reduce((sum, m) => sum + m.errorCount, 0)
    const errorRate = totalSent + totalReceived > 0 ? errors / (totalSent + totalReceived) : 0

    return {
      totalConnections: metrics.length,
      activeConnections: active,
      avgConnectionDuration: avgDuration,
      totalMessagesSent: totalSent,
      totalMessagesReceived: totalReceived,
      avgRTT,
      errorRate,
    }
  }

  /**
   * 检测连接泄漏
   */
  detectConnectionLeak(url: string, threshold = 10): boolean {
    const metrics = this.connections.get(url)
    if (!metrics) return false

    const openConnections = metrics.filter(m => m.state === 'open')
    return openConnections.length > threshold
  }

  /**
   * 清理旧连接记录
   */
  cleanup(maxAge = 3600000): void {
    const now = Date.now()
    
    for (const [url, metrics] of this.connections.entries()) {
      const filtered = metrics.filter(m => 
        m.state === 'open' || (now - m.connectTime < maxAge)
      )
      
      if (filtered.length === 0) {
        this.connections.delete(url)
      } else {
        this.connections.set(url, filtered)
      }
    }
  }
}
