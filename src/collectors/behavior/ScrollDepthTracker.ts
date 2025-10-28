/**
 * @ldesign/monitor - 滚动深度追踪器
 * 
 * 追踪用户的页面滚动深度和行为
 */

export interface ScrollDepthOptions {
  /**
   * 滚动深度里程碑（百分比）
   * @default [25, 50, 75, 100]
   */
  milestones?: number[]

  /**
   * 节流时间（毫秒）
   * @default 300
   */
  throttle?: number

  /**
   * 是否追踪水平滚动
   * @default false
   */
  trackHorizontal?: boolean

  /**
   * 是否追踪元素可见性
   * @default true
   */
  trackElementVisibility?: boolean
}

export interface ScrollDepthEvent {
  /**
   * 滚动深度（百分比）
   */
  depth: number

  /**
   * 垂直滚动位置（像素）
   */
  scrollTop: number

  /**
   * 页面总高度（像素）
   */
  pageHeight: number

  /**
   * 视口高度（像素）
   */
  viewportHeight: number

  /**
   * 水平滚动位置（像素）
   */
  scrollLeft?: number

  /**
   * 页面总宽度（像素）
   */
  pageWidth?: number

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 页面URL
   */
  url: string

  /**
   * 里程碑
   */
  milestone?: number
}

export interface ElementVisibilityEvent {
  /**
   * 元素选择器
   */
  selector: string

  /**
   * 元素ID
   */
  elementId?: string

  /**
   * 可见性百分比
   */
  visibility: number

  /**
   * 是否完全可见
   */
  isFullyVisible: boolean

  /**
   * 时间戳
   */
  timestamp: number
}

export class ScrollDepthTracker {
  private options: Required<ScrollDepthOptions>
  private onScrollDepth?: (event: ScrollDepthEvent) => void
  private onElementVisible?: (event: ElementVisibilityEvent) => void
  
  private reachedMilestones: Set<number> = new Set()
  private maxDepthReached = 0
  private throttleTimer: number | null = null
  private observer: IntersectionObserver | null = null
  private trackedElements: Map<Element, ElementVisibilityEvent> = new Map()

  private startTime = Date.now()
  private totalScrollDistance = 0
  private lastScrollTop = 0
  private scrollCount = 0

  constructor(options: ScrollDepthOptions = {}) {
    this.options = {
      milestones: options.milestones ?? [25, 50, 75, 100],
      throttle: options.throttle ?? 300,
      trackHorizontal: options.trackHorizontal ?? false,
      trackElementVisibility: options.trackElementVisibility ?? true,
    }
  }

  /**
   * 启动追踪
   */
  start(
    onScrollDepth: (event: ScrollDepthEvent) => void,
    onElementVisible?: (event: ElementVisibilityEvent) => void
  ): void {
    this.onScrollDepth = onScrollDepth
    this.onElementVisible = onElementVisible

    // 监听滚动事件
    window.addEventListener('scroll', this.handleScroll, { passive: true })

    // 初始检查
    this.checkScrollDepth()

    // 启动元素可见性追踪
    if (this.options.trackElementVisibility && onElementVisible) {
      this.startElementTracking()
    }
  }

  /**
   * 停止追踪
   */
  stop(): void {
    window.removeEventListener('scroll', this.handleScroll)
    
    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer)
      this.throttleTimer = null
    }

    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    this.trackedElements.clear()
  }

  /**
   * 添加要追踪的元素
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
      this.trackedElements.delete(element)
    })
  }

  /**
   * 获取当前滚动深度
   */
  getCurrentDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const pageHeight = this.getPageHeight()
    const viewportHeight = window.innerHeight

    if (pageHeight <= viewportHeight) {
      return 100
    }

    const scrollableHeight = pageHeight - viewportHeight
    return Math.min(100, Math.round((scrollTop / scrollableHeight) * 100))
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      maxDepthReached: this.maxDepthReached,
      reachedMilestones: Array.from(this.reachedMilestones).sort((a, b) => a - b),
      totalScrollDistance: this.totalScrollDistance,
      scrollCount: this.scrollCount,
      timeOnPage: Date.now() - this.startTime,
      averageScrollSpeed: this.scrollCount > 0 
        ? this.totalScrollDistance / (Date.now() - this.startTime) * 1000 
        : 0, // 像素/秒
    }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.reachedMilestones.clear()
    this.maxDepthReached = 0
    this.totalScrollDistance = 0
    this.lastScrollTop = window.pageYOffset || document.documentElement.scrollTop
    this.scrollCount = 0
    this.startTime = Date.now()
  }

  /**
   * 处理滚动事件
   */
  private handleScroll = (): void => {
    if (this.throttleTimer !== null) {
      return
    }

    this.throttleTimer = window.setTimeout(() => {
      this.checkScrollDepth()
      this.throttleTimer = null
    }, this.options.throttle)

    // 更新滚动统计
    this.updateScrollStats()
  }

  /**
   * 检查滚动深度
   */
  private checkScrollDepth(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const pageHeight = this.getPageHeight()
    const pageWidth = document.documentElement.scrollWidth
    const viewportHeight = window.innerHeight

    const depth = this.getCurrentDepth()

    // 更新最大深度
    if (depth > this.maxDepthReached) {
      this.maxDepthReached = depth
    }

    // 构建事件对象
    const event: ScrollDepthEvent = {
      depth,
      scrollTop,
      pageHeight,
      viewportHeight,
      timestamp: Date.now(),
      url: window.location.href,
    }

    if (this.options.trackHorizontal) {
      event.scrollLeft = scrollLeft
      event.pageWidth = pageWidth
    }

    // 检查是否达到新的里程碑
    for (const milestone of this.options.milestones) {
      if (depth >= milestone && !this.reachedMilestones.has(milestone)) {
        this.reachedMilestones.add(milestone)
        event.milestone = milestone

        if (this.onScrollDepth) {
          this.onScrollDepth({ ...event })
        }
      }
    }

    // 如果没有达到新里程碑，也定期上报当前深度
    if (!event.milestone && this.onScrollDepth) {
      // 可以选择性地上报非里程碑事件
      // this.onScrollDepth(event)
    }
  }

  /**
   * 更新滚动统计
   */
  private updateScrollStats(): void {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollDistance = Math.abs(currentScrollTop - this.lastScrollTop)
    
    this.totalScrollDistance += scrollDistance
    this.scrollCount++
    this.lastScrollTop = currentScrollTop
  }

  /**
   * 获取页面高度
   */
  private getPageHeight(): number {
    const body = document.body
    const html = document.documentElement

    return Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    )
  }

  /**
   * 启动元素可见性追踪
   */
  private startElementTracking(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('[ScrollDepthTracker] IntersectionObserver not supported')
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          this.handleElementVisibility(entry)
        })
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    )
  }

  /**
   * 处理元素可见性
   */
  private handleElementVisibility(entry: IntersectionObserverEntry): void {
    const element = entry.target
    const visibility = Math.round(entry.intersectionRatio * 100)
    const isFullyVisible = entry.intersectionRatio >= 1.0

    const event: ElementVisibilityEvent = {
      selector: this.getElementSelector(element),
      elementId: element.id || undefined,
      visibility,
      isFullyVisible,
      timestamp: Date.now(),
    }

    // 检查是否是新的可见性变化
    const lastEvent = this.trackedElements.get(element)
    if (!lastEvent || lastEvent.visibility !== visibility) {
      this.trackedElements.set(element, event)

      if (this.onElementVisible && visibility > 0) {
        this.onElementVisible(event)
      }
    }
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
}

/**
 * 计算页面滚动速度
 */
export class ScrollSpeedCalculator {
  private scrollPositions: Array<{ position: number; timestamp: number }> = []
  private readonly MAX_HISTORY = 10

  /**
   * 记录滚动位置
   */
  record(position: number): void {
    this.scrollPositions.push({
      position,
      timestamp: Date.now(),
    })

    if (this.scrollPositions.length > this.MAX_HISTORY) {
      this.scrollPositions.shift()
    }
  }

  /**
   * 计算平均速度（像素/秒）
   */
  getAverageSpeed(): number {
    if (this.scrollPositions.length < 2) {
      return 0
    }

    const first = this.scrollPositions[0]
    const last = this.scrollPositions[this.scrollPositions.length - 1]

    const distance = Math.abs(last.position - first.position)
    const time = (last.timestamp - first.timestamp) / 1000 // 转换为秒

    return time > 0 ? distance / time : 0
  }

  /**
   * 检测快速滚动
   */
  isFastScrolling(threshold = 1000): boolean {
    return this.getAverageSpeed() > threshold
  }

  /**
   * 重置
   */
  reset(): void {
    this.scrollPositions = []
  }
}
