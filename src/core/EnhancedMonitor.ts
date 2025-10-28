/**
 * @ldesign/monitor - 增强监控中心
 * 
 * 统一管理和协调所有监控功能
 */

import type { MonitorConfig } from '../types'
import { Monitor } from './Monitor'

// 性能监控
import { 
  CustomMarkCollector,
  LongTaskCollector,
  MemoryCollector,
  FPSCollector,
  RenderOptimizationAdvisor,
} from '../collectors/performance'

// 用户行为
import {
  ScrollDepthTracker,
  TimeOnPageTracker,
  SessionTimeManager,
} from '../collectors/behavior'

// API监控
import {
  GraphQLInterceptor,
  WebSocketMonitor,
} from '../collectors/api'

// 存储
import {
  IndexedDBStore,
  OfflineQueueManager,
} from '../storage'

export interface EnhancedMonitorConfig extends MonitorConfig {
  /**
   * 增强功能配置
   */
  enhanced?: {
    /**
     * 性能监控配置
     */
    performance?: {
      customMarks?: boolean
      longTasks?: boolean
      memory?: boolean
      fps?: boolean
      optimization?: boolean
    }

    /**
     * 用户行为配置
     */
    behavior?: {
      scrollDepth?: boolean
      timeOnPage?: boolean
    }

    /**
     * API监控配置
     */
    api?: {
      graphql?: boolean
      websocket?: boolean
    }

    /**
     * 离线缓存配置
     */
    offline?: {
      enabled?: boolean
      maxItems?: number
      ttl?: number
    }
  }
}

/**
 * 增强监控中心
 */
export class EnhancedMonitor extends Monitor {
  // 性能监控
  private customMarkCollector?: CustomMarkCollector
  private longTaskCollector?: LongTaskCollector
  private memoryCollector?: MemoryCollector
  private fpsCollector?: FPSCollector
  private optimizationAdvisor?: RenderOptimizationAdvisor

  // 用户行为
  private scrollDepthTracker?: ScrollDepthTracker
  private timeOnPageTracker?: TimeOnPageTracker
  private sessionTimeManager?: SessionTimeManager

  // API监控
  private graphqlInterceptor?: GraphQLInterceptor
  private websocketMonitor?: WebSocketMonitor

  // 离线存储
  private indexedDBStore?: IndexedDBStore
  private offlineQueueManager?: OfflineQueueManager

  private enhancedConfig: EnhancedMonitorConfig

  constructor(config: EnhancedMonitorConfig) {
    super(config)
    this.enhancedConfig = config
  }

  /**
   * 初始化增强功能
   */
  override init(config?: MonitorConfig): void {
    super.init(config)

    if (config) {
      this.enhancedConfig = { ...this.enhancedConfig, ...config }
    }

    this.initEnhancedFeatures()
  }

  /**
   * 初始化增强功能
   */
  private initEnhancedFeatures(): void {
    const enhanced = this.enhancedConfig.enhanced

    if (!enhanced) return

    // 初始化离线存储（优先）
    if (enhanced.offline?.enabled !== false) {
      this.initOfflineStorage()
    }

    // 初始化性能监控
    if (enhanced.performance?.customMarks !== false) {
      this.initCustomMarks()
    }
    if (enhanced.performance?.longTasks !== false) {
      this.initLongTasks()
    }
    if (enhanced.performance?.memory !== false) {
      this.initMemoryMonitor()
    }
    if (enhanced.performance?.fps) {
      this.initFPSMonitor()
    }
    if (enhanced.performance?.optimization !== false) {
      this.initOptimizationAdvisor()
    }

    // 初始化用户行为
    if (enhanced.behavior?.scrollDepth !== false) {
      this.initScrollDepth()
    }
    if (enhanced.behavior?.timeOnPage !== false) {
      this.initTimeOnPage()
    }

    // 初始化API监控
    if (enhanced.api?.graphql !== false) {
      this.initGraphQLMonitor()
    }
    if (enhanced.api?.websocket !== false) {
      this.initWebSocketMonitor()
    }

    this.emit('enhanced:init')
  }

  /**
   * 初始化离线存储
   */
  private initOfflineStorage(): void {
    this.indexedDBStore = new IndexedDBStore({
      maxItems: this.enhancedConfig.enhanced?.offline?.maxItems,
      ttl: this.enhancedConfig.enhanced?.offline?.ttl,
    })

    this.offlineQueueManager = new OfflineQueueManager(this.indexedDBStore)

    this.offlineQueueManager.start(async (events) => {
      // 批量上报离线数据
      const data = events.map(e => e.data)
      this.emit('report', { type: 'batch', data })
    })
  }

  /**
   * 初始化自定义性能标记
   */
  private initCustomMarks(): void {
    this.customMarkCollector = new CustomMarkCollector({
      autoCollect: true,
      collectMeasures: true,
    })

    this.customMarkCollector.start((metric) => {
      this.trackPerformance(metric.name, metric.value)
      this.emit('performance:mark', metric)
    })
  }

  /**
   * 初始化 Long Tasks 监控
   */
  private initLongTasks(): void {
    this.longTaskCollector = new LongTaskCollector({
      threshold: 50,
      collectAttribution: true,
    })

    this.longTaskCollector.start((taskInfo) => {
      this.trackEvent('longtask', {
        duration: taskInfo.duration,
        blockingTime: taskInfo.attribution?.blockingTime,
        rating: taskInfo.rating,
      })
      this.emit('performance:longtask', taskInfo)
    })
  }

  /**
   * 初始化内存监控
   */
  private initMemoryMonitor(): void {
    this.memoryCollector = new MemoryCollector({
      interval: 30000,
      warningThreshold: 100 * 1024 * 1024,
      dangerThreshold: 200 * 1024 * 1024,
    })

    this.memoryCollector.start((metric) => {
      this.trackPerformance('memory', metric.value)
      this.emit('performance:memory', metric)

      // 检测内存泄漏
      const leakDetection = this.memoryCollector!.detectMemoryLeak()
      if (leakDetection.suspected) {
        this.trackEvent('memory-leak-suspected', {
          reason: leakDetection.reason,
          usage: metric.attribution?.usagePercent,
        })
        this.emit('performance:memory-leak', leakDetection)
      }
    })
  }

  /**
   * 初始化 FPS 监控
   */
  private initFPSMonitor(): void {
    this.fpsCollector = new FPSCollector({
      interval: 1000,
      lowFPSThreshold: 30,
      freezeThreshold: 20,
    })

    this.fpsCollector.start((metric) => {
      // 只在 FPS 过低时上报
      if (metric.value < 30) {
        this.trackEvent('low-fps', {
          fps: metric.value,
          avgFPS: metric.attribution?.avgFPS,
          freezeCount: metric.attribution?.freezeCount,
        })
      }
      this.emit('performance:fps', metric)
    })
  }

  /**
   * 初始化优化建议
   */
  private initOptimizationAdvisor(): void {
    this.optimizationAdvisor = new RenderOptimizationAdvisor()

    // 在页面加载完成后分析
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const analysis = this.optimizationAdvisor!.analyze()
          
          this.trackEvent('performance-analysis', {
            score: analysis.score,
            fcp: analysis.fcp,
            lcp: analysis.lcp,
            cls: analysis.cls,
            suggestionCount: analysis.suggestions.length,
            criticalIssues: analysis.suggestions.filter(s => s.type === 'critical').length,
          })

          this.emit('performance:analysis', analysis)
        }, 3000)
      })
    }
  }

  /**
   * 初始化滚动深度追踪
   */
  private initScrollDepth(): void {
    this.scrollDepthTracker = new ScrollDepthTracker({
      milestones: [25, 50, 75, 100],
      throttle: 300,
      trackElementVisibility: true,
    })

    this.scrollDepthTracker.start(
      (event) => {
        if (event.milestone) {
          this.trackEvent('scroll-depth-milestone', {
            milestone: event.milestone,
            depth: event.depth,
          })
        }
        this.emit('behavior:scroll', event)
      },
      (event) => {
        this.trackEvent('element-visible', {
          selector: event.selector,
          visibility: event.visibility,
        })
        this.emit('behavior:element-visible', event)
      }
    )
  }

  /**
   * 初始化停留时间追踪
   */
  private initTimeOnPage(): void {
    this.timeOnPageTracker = new TimeOnPageTracker({
      checkInterval: 5000,
      inactiveTimeout: 30000,
      trackVisibility: true,
      trackElements: true,
    })

    this.timeOnPageTracker.start(
      (event) => {
        this.trackEvent('time-on-page', {
          totalTime: event.totalTime,
          activeTime: event.activeTime,
          visibleTime: event.visibleTime,
        })
        this.emit('behavior:time', event)
      },
      (event) => {
        this.trackEvent('element-time', {
          selector: event.selector,
          totalVisibleTime: event.totalVisibleTime,
        })
        this.emit('behavior:element-time', event)
      }
    )

    // 会话管理
    this.sessionTimeManager = new SessionTimeManager()
    const sessionId = this.getSessionId()
    this.sessionTimeManager.startSession(sessionId)

    // 定期更新会话时间
    setInterval(() => {
      const stats = this.timeOnPageTracker!.getStats()
      this.sessionTimeManager!.updateActivity(stats.activeTime)
    }, 10000)
  }

  /**
   * 初始化 GraphQL 监控
   */
  private initGraphQLMonitor(): void {
    this.graphqlInterceptor = new GraphQLInterceptor({
      logVariables: false,
      logResponse: false,
      trackFieldUsage: true,
      slowQueryThreshold: 1000,
    })

    this.graphqlInterceptor.start((metrics) => {
      this.trackEvent('graphql-query', {
        operation: metrics.operationName,
        type: metrics.operationType,
        complexity: metrics.complexity,
        duration: metrics.duration,
        success: metrics.success,
      })

      if (metrics.duration > 1000) {
        this.trackEvent('graphql-slow-query', {
          operation: metrics.operationName,
          duration: metrics.duration,
        })
      }

      this.emit('api:graphql', metrics)
    })
  }

  /**
   * 初始化 WebSocket 监控
   */
  private initWebSocketMonitor(): void {
    this.websocketMonitor = new WebSocketMonitor({
      trackHeartbeat: true,
      messageSampleRate: 0.1,
      heartbeatTimeout: 30000,
    })

    this.websocketMonitor.start(
      (conn) => {
        this.trackEvent('websocket-connection', {
          type: conn.type,
          url: conn.url,
          duration: conn.duration,
        })
        this.emit('api:websocket-connection', conn)
      },
      (msg) => {
        this.emit('api:websocket-message', msg)
      },
      (metrics) => {
        this.emit('api:websocket-metrics', metrics)
      }
    )
  }

  /**
   * 创建性能标记
   */
  mark(name: string): void {
    this.customMarkCollector?.mark(name)
  }

  /**
   * 测量性能
   */
  measure(name: string, startMark?: string, endMark?: string): number | null {
    return this.customMarkCollector?.measure(name, startMark, endMark) ?? null
  }

  /**
   * 获取当前内存信息
   */
  getMemoryInfo() {
    return this.memoryCollector?.getCurrentMemory()
  }

  /**
   * 获取 FPS 信息
   */
  getFPSInfo() {
    return this.fpsCollector?.getFPSInfo()
  }

  /**
   * 获取 Long Task 统计
   */
  getLongTaskStats() {
    return this.longTaskCollector?.getStats()
  }

  /**
   * 获取滚动统计
   */
  getScrollStats() {
    return this.scrollDepthTracker?.getStats()
  }

  /**
   * 获取时间统计
   */
  getTimeStats() {
    return this.timeOnPageTracker?.getStats()
  }

  /**
   * 获取优化建议
   */
  getOptimizationSuggestions() {
    return this.optimizationAdvisor?.analyze()
  }

  /**
   * 获取 GraphQL 字段使用统计
   */
  getGraphQLFieldStats() {
    return this.graphqlInterceptor?.getFieldUsageStats()
  }

  /**
   * 获取 WebSocket 指标
   */
  getWebSocketMetrics() {
    return this.websocketMonitor?.getAllMetrics()
  }

  /**
   * 获取离线队列统计
   */
  async getOfflineQueueStats() {
    return this.offlineQueueManager?.getStats()
  }

  /**
   * 手动刷新离线队列
   */
  async flushOfflineQueue() {
    return this.offlineQueueManager?.flush()
  }

  /**
   * 追踪元素滚动
   */
  trackScrollElement(selector: string): void {
    this.scrollDepthTracker?.trackElement(selector)
  }

  /**
   * 追踪元素停留时间
   */
  trackElementTime(selector: string): void {
    this.timeOnPageTracker?.trackElement(selector)
  }

  /**
   * 获取所有增强统计信息
   */
  getEnhancedStats() {
    return {
      performance: {
        memory: this.getMemoryInfo(),
        fps: this.getFPSInfo(),
        longTasks: this.getLongTaskStats(),
      },
      behavior: {
        scroll: this.getScrollStats(),
        time: this.getTimeStats(),
      },
      api: {
        graphql: this.getGraphQLFieldStats(),
        websocket: this.getWebSocketMetrics(),
      },
    }
  }

  /**
   * 销毁增强监控
   */
  override destroy(): void {
    // 停止所有收集器
    this.customMarkCollector?.stop()
    this.longTaskCollector?.stop()
    this.memoryCollector?.stop()
    this.fpsCollector?.stop()
    this.scrollDepthTracker?.stop()
    this.timeOnPageTracker?.stop()
    this.graphqlInterceptor?.stop()
    this.websocketMonitor?.stop()
    this.offlineQueueManager?.stop()
    this.sessionTimeManager?.endSession()
    this.indexedDBStore?.close()

    super.destroy()
  }
}

/**
 * 创建增强监控实例
 */
export function createEnhancedMonitor(config: EnhancedMonitorConfig): EnhancedMonitor {
  return new EnhancedMonitor(config)
}
