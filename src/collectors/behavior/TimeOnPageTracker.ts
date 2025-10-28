/**
 * @ldesign/monitor - 停留时间统计器
 * 
 * 追踪用户在页面/元素上的停留时间
 */

export interface TimeOnPageOptions {
  /**
   * 检查间隔（毫秒）
   * @default 1000
   */
  checkInterval?: number

  /**
   * 不活跃超时时间（毫秒）
   * @default 30000
   */
  inactiveTimeout?: number

  /**
   * 是否追踪可见性
   * @default true
   */
  trackVisibility?: boolean

  /**
   * 是否追踪元素停留时间
   * @default true
   */
  trackElements?: boolean
}

export interface TimeOnPageEvent {
  /**
   * 总停留时间（毫秒）
   */
  totalTime: number

  /**
   * 活跃时间（毫秒）
   */
  activeTime: number

  /**
   * 不活跃时间（毫秒）
   */
  inactiveTime: number

  /**
   * 可见时间（毫秒）
   */
  visibleTime: number

  /**
   * 隐藏时间（毫秒）
   */
  hiddenTime: number

  /**
   * 是否当前活跃
   */
  isActive: boolean

  /**
   * 是否当前可见
   */
  isVisible: boolean

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 页面URL
   */
  url: string
}

export interface ElementTimeEvent {
  /**
   * 元素选择器
   */
  selector: string

  /**
   * 元素ID
   */
  elementId?: string

  /**
   * 停留时间（毫秒）
   */
  duration: number

  /**
   * 首次可见时间
   */
  firstSeenAt: number

  /**
   * 最后可见时间
   */
  lastSeenAt: number

  /**
   * 总可见时间（毫秒）
   */
  totalVisibleTime: number

  /**
   * 时间戳
   */
  timestamp: number
}

export class TimeOnPageTracker {
  private options: Required<TimeOnPageOptions>
  private onTimeUpdate?: (event: TimeOnPageEvent) => void
  private onElementTimeUpdate?: (event: ElementTimeEvent) => void

  // 时间追踪
  private startTime = Date.now()
  private activeTime = 0
  private inactiveTime = 0
  private visibleTime = 0
  private hiddenTime = 0

  // 状态追踪
  private isActive = true
  private isVisible = true
  private lastActivityTime = Date.now()
  private lastVisibilityChangeTime = Date.now()
  private lastCheckTime = Date.now()

  // 定时器和监听器
  private checkInterval: number | null = null
  private inactiveTimer: number | null = null
  private observer: IntersectionObserver | null = null

  // 元素追踪
  private trackedElements: Map<Element, {
    firstSeenAt: number
    lastSeenAt: number
    totalVisibleTime: number
    isCurrentlyVisible: boolean
  }> = new Map()

  constructor(options: TimeOnPageOptions = {}) {
    this.options = {
      checkInterval: options.checkInterval ?? 1000,
      inactiveTimeout: options.inactiveTimeout ?? 30000,
      trackVisibility: options.trackVisibility ?? true,
      trackElements: options.trackElements ?? true,
    }
  }

  /**
   * 启动追踪
   */
  start(
    onTimeUpdate: (event: TimeOnPageEvent) => void,
    onElementTimeUpdate?: (event: ElementTimeEvent) => void
  ): void {
    this.onTimeUpdate = onTimeUpdate
    this.onElementTimeUpdate = onElementTimeUpdate

    // 监听用户活动
    this.startActivityTracking()

    // 监听页面可见性
    if (this.options.trackVisibility) {
      this.startVisibilityTracking()
    }

    // 启动定期检查
    this.checkInterval = window.setInterval(() => {
      this.checkTime()
    }, this.options.checkInterval)

    // 启动元素追踪
    if (this.options.trackElements && onElementTimeUpdate) {
      this.startElementTracking()
    }

    // 在页面卸载时保存数据
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  }

  /**
   * 停止追踪
   */
  stop(): void {
    // 停止定时器
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    if (this.inactiveTimer !== null) {
      clearTimeout(this.inactiveTimer)
      this.inactiveTimer = null
    }

    // 停止监听
    this.stopActivityTracking()
    this.stopVisibilityTracking()

    // 停止元素追踪
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    window.removeEventListener('beforeunload', this.handleBeforeUnload)

    // 最后上报一次
    this.reportTime()
  }

  /**
   * 追踪元素
   */
  trackElement(selector: string): void {
    if (!this.observer) {
      return
    }

    const elements = document.querySelectorAll(selector)
    elements.forEach(element => {
      this.observer!.observe(element)
    })
  }

  /**
   * 取消追踪元素
   */
  untrackElement(selector: string): void {
    if (!this.observer) {
      return
    }

    const elements = document.querySelectorAll(selector)
    elements.forEach(element => {
      this.observer!.unobserve(element)
      
      // 上报最终数据
      const data = this.trackedElements.get(element)
      if (data && this.onElementTimeUpdate) {
        this.reportElementTime(element, data)
      }
      
      this.trackedElements.delete(element)
    })
  }

  /**
   * 获取当前时间统计
   */
  getStats(): TimeOnPageEvent {
    this.updateTimes()

    return {
      totalTime: Date.now() - this.startTime,
      activeTime: this.activeTime,
      inactiveTime: this.inactiveTime,
      visibleTime: this.visibleTime,
      hiddenTime: this.hiddenTime,
      isActive: this.isActive,
      isVisible: this.isVisible,
      timestamp: Date.now(),
      url: window.location.href,
    }
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.startTime = Date.now()
    this.activeTime = 0
    this.inactiveTime = 0
    this.visibleTime = 0
    this.hiddenTime = 0
    this.lastActivityTime = Date.now()
    this.lastVisibilityChangeTime = Date.now()
    this.lastCheckTime = Date.now()
  }

  /**
   * 启动活动追踪
   */
  private startActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true })
    })

    // 设置不活跃定时器
    this.resetInactiveTimer()
  }

  /**
   * 停止活动追踪
   */
  private stopActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity)
    })
  }

  /**
   * 处理用户活动
   */
  private handleActivity = (): void => {
    const now = Date.now()

    if (!this.isActive) {
      this.isActive = true
    }

    this.lastActivityTime = now
    this.resetInactiveTimer()
  }

  /**
   * 重置不活跃定时器
   */
  private resetInactiveTimer(): void {
    if (this.inactiveTimer !== null) {
      clearTimeout(this.inactiveTimer)
    }

    this.inactiveTimer = window.setTimeout(() => {
      this.isActive = false
    }, this.options.inactiveTimeout)
  }

  /**
   * 启动可见性追踪
   */
  private startVisibilityTracking(): void {
    if (typeof document.hidden === 'undefined') {
      return
    }

    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.isVisible = !document.hidden
  }

  /**
   * 停止可见性追踪
   */
  private stopVisibilityTracking(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  }

  /**
   * 处理可见性变化
   */
  private handleVisibilityChange = (): void => {
    const now = Date.now()
    const wasVisible = this.isVisible
    this.isVisible = !document.hidden

    if (wasVisible && !this.isVisible) {
      // 从可见变为隐藏
      const duration = now - this.lastVisibilityChangeTime
      this.visibleTime += duration
    } else if (!wasVisible && this.isVisible) {
      // 从隐藏变为可见
      const duration = now - this.lastVisibilityChangeTime
      this.hiddenTime += duration
    }

    this.lastVisibilityChangeTime = now
  }

  /**
   * 检查时间
   */
  private checkTime(): void {
    this.updateTimes()
    this.reportTime()
  }

  /**
   * 更新时间统计
   */
  private updateTimes(): void {
    const now = Date.now()
    const elapsed = now - this.lastCheckTime

    if (this.isActive) {
      this.activeTime += elapsed
    } else {
      this.inactiveTime += elapsed
    }

    if (this.isVisible) {
      this.visibleTime += elapsed
    } else {
      this.hiddenTime += elapsed
    }

    this.lastCheckTime = now
  }

  /**
   * 上报时间
   */
  private reportTime(): void {
    if (!this.onTimeUpdate) {
      return
    }

    const stats = this.getStats()
    this.onTimeUpdate(stats)
  }

  /**
   * 启动元素追踪
   */
  private startElementTracking(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('[TimeOnPageTracker] IntersectionObserver not supported')
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          this.handleElementVisibility(entry)
        })
      },
      {
        threshold: 0.5, // 元素至少50%可见才算
      }
    )
  }

  /**
   * 处理元素可见性
   */
  private handleElementVisibility(entry: IntersectionObserverEntry): void {
    const element = entry.target
    const isVisible = entry.isIntersecting
    const now = Date.now()

    let data = this.trackedElements.get(element)

    if (!data) {
      // 首次见到元素
      data = {
        firstSeenAt: now,
        lastSeenAt: now,
        totalVisibleTime: 0,
        isCurrentlyVisible: isVisible,
      }
      this.trackedElements.set(element, data)
    }

    if (isVisible && !data.isCurrentlyVisible) {
      // 元素变为可见
      data.isCurrentlyVisible = true
      data.lastSeenAt = now
    } else if (!isVisible && data.isCurrentlyVisible) {
      // 元素变为不可见
      const duration = now - data.lastSeenAt
      data.totalVisibleTime += duration
      data.isCurrentlyVisible = false

      // 上报元素时间
      if (this.onElementTimeUpdate) {
        this.reportElementTime(element, data)
      }
    }

    // 如果元素当前可见，更新可见时间
    if (data.isCurrentlyVisible) {
      const duration = now - data.lastSeenAt
      data.totalVisibleTime += duration
      data.lastSeenAt = now
    }
  }

  /**
   * 上报元素时间
   */
  private reportElementTime(
    element: Element,
    data: {
      firstSeenAt: number
      lastSeenAt: number
      totalVisibleTime: number
      isCurrentlyVisible: boolean
    }
  ): void {
    if (!this.onElementTimeUpdate) {
      return
    }

    const event: ElementTimeEvent = {
      selector: this.getElementSelector(element),
      elementId: element.id || undefined,
      duration: Date.now() - data.firstSeenAt,
      firstSeenAt: data.firstSeenAt,
      lastSeenAt: data.lastSeenAt,
      totalVisibleTime: data.totalVisibleTime,
      timestamp: Date.now(),
    }

    this.onElementTimeUpdate(event)
  }

  /**
   * 获取元素选择器
   */
  private getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.')
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`
      }
    }

    return element.tagName.toLowerCase()
  }

  /**
   * 处理页面卸载
   */
  private handleBeforeUnload = (): void => {
    this.reportTime()
  }
}

/**
 * 会话时间管理器
 * 跨页面追踪用户会话时间
 */
export class SessionTimeManager {
  private readonly STORAGE_KEY = 'monitor_session_time'
  
  /**
   * 开始会话
   */
  startSession(sessionId: string): void {
    const data = {
      sessionId,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      totalActiveTime: 0,
    }
    
    this.saveToStorage(data)
  }

  /**
   * 更新活动时间
   */
  updateActivity(activeTime: number): void {
    const data = this.loadFromStorage()
    if (data) {
      data.lastActivityTime = Date.now()
      data.totalActiveTime += activeTime
      this.saveToStorage(data)
    }
  }

  /**
   * 获取会话时长
   */
  getSessionDuration(): number {
    const data = this.loadFromStorage()
    if (!data) {
      return 0
    }
    
    return Date.now() - data.startTime
  }

  /**
   * 获取总活跃时间
   */
  getTotalActiveTime(): number {
    const data = this.loadFromStorage()
    return data?.totalActiveTime || 0
  }

  /**
   * 结束会话
   */
  endSession(): void {
    this.clearStorage()
  }

  /**
   * 保存到存储
   */
  private saveToStorage(data: any): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('[SessionTimeManager] Failed to save to storage:', error)
    }
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): any {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('[SessionTimeManager] Failed to load from storage:', error)
      return null
    }
  }

  /**
   * 清除存储
   */
  private clearStorage(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('[SessionTimeManager] Failed to clear storage:', error)
    }
  }
}
