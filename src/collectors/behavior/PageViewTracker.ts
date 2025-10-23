/**
 * 页面浏览追踪器
 * 追踪页面浏览（PV/UV）和停留时间
 */

import { now } from '../../utils'

/**
 * 页面浏览数据接口
 */
export interface PageViewData {
  /**
   * 页面路径
   */
  path: string

  /**
   * 页面标题
   */
  title: string

  /**
   * 来源页面
   */
  referrer: string

  /**
   * 停留时长（毫秒）
   */
  duration?: number

  /**
   * 时间戳
   */
  timestamp: number
}

/**
 * 页面浏览追踪器类
 */
export class PageViewTracker {
  /**
   * 当前页面进入时间
   */
  private enterTime: number = now()

  /**
   * 当前页面路径
   */
  private currentPath: string = ''

  /**
   * 回调函数列表
   */
  private callbacks: Set<(data: PageViewData) => void> = new Set()

  /**
   * 是否已启动
   */
  private started = false

  /**
   * 启动追踪
   */
  start(callback?: (data: PageViewData) => void): void {
    if (this.started) {
      return
    }

    if (callback) {
      this.callbacks.add(callback)
    }

    // 追踪初始页面
    this.trackCurrentPage()

    // 监听 History API
    this.interceptHistory()

    // 监听 hash 变化
    window.addEventListener('hashchange', () => {
      this.trackCurrentPage()
    })

    // 监听页面隐藏（用户离开）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackPageLeave()
      }
    })

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.trackPageLeave()
    })

    this.started = true
  }

  /**
   * 追踪当前页面
   */
  private trackCurrentPage(): void {
    const path = window.location.pathname + window.location.search + window.location.hash

    // 如果路径相同，不重复追踪
    if (path === this.currentPath) {
      return
    }

    // 如果有之前的页面，先记录离开
    if (this.currentPath) {
      this.trackPageLeave()
    }

    this.currentPath = path
    this.enterTime = now()

    const data: PageViewData = {
      path,
      title: document.title,
      referrer: document.referrer,
      timestamp: this.enterTime,
    }

    this.emit(data)
  }

  /**
   * 追踪页面离开
   */
  private trackPageLeave(): void {
    if (!this.currentPath) {
      return
    }

    const duration = now() - this.enterTime

    const data: PageViewData = {
      path: this.currentPath,
      title: document.title,
      referrer: document.referrer,
      duration,
      timestamp: this.enterTime,
    }

    this.emit(data)
  }

  /**
   * 拦截 History API
   */
  private interceptHistory(): void {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      this.trackCurrentPage()
    }

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args)
      this.trackCurrentPage()
    }

    // 监听 popstate（浏览器前进后退）
    window.addEventListener('popstate', () => {
      this.trackCurrentPage()
    })
  }

  /**
   * 发射事件
   */
  private emit(data: PageViewData): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(data)
      }
      catch (error) {
        console.error('[PageViewTracker] Error in callback:', error)
      }
    })
  }

  /**
   * 添加回调
   */
  onPageView(callback: (data: PageViewData) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * 停止追踪
   */
  stop(): void {
    this.trackPageLeave()
    this.callbacks.clear()
    this.started = false
  }
}

/**
 * 创建页面浏览追踪器实例
 */
export function createPageViewTracker(): PageViewTracker {
  return new PageViewTracker()
}

