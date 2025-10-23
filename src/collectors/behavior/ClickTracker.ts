/**
 * 点击追踪器
 * 追踪用户点击行为
 */

import { getElementSelector, now } from '../../utils'

/**
 * 点击数据接口
 */
export interface ClickData {
  /**
   * 元素选择器
   */
  selector: string

  /**
   * 元素标签名
   */
  tagName: string

  /**
   * 元素 ID
   */
  id?: string

  /**
   * 元素类名
   */
  className?: string

  /**
   * 元素文本内容
   */
  text?: string

  /**
   * 点击坐标
   */
  coordinates: {
    x: number
    y: number
  }

  /**
   * 页面路径
   */
  path: string

  /**
   * 时间戳
   */
  timestamp: number
}

/**
 * 点击追踪器配置
 */
export interface ClickTrackerConfig {
  /**
   * 是否追踪所有点击
   * @default true
   */
  trackAll?: boolean

  /**
   * 忽略的选择器列表
   */
  ignoreSelectors?: string[]

  /**
   * 是否捕获元素文本
   * @default true
   */
  captureText?: boolean

  /**
   * 最大文本长度
   * @default 100
   */
  maxTextLength?: number
}

/**
 * 点击追踪器类
 */
export class ClickTracker {
  /**
   * 配置
   */
  private config: Required<ClickTrackerConfig>

  /**
   * 回调函数列表
   */
  private callbacks: Set<(data: ClickData) => void> = new Set()

  /**
   * 是否已启动
   */
  private started = false

  /**
   * 点击处理器
   */
  private handleClick: (event: MouseEvent) => void

  constructor(config: ClickTrackerConfig = {}) {
    this.config = {
      trackAll: config.trackAll ?? true,
      ignoreSelectors: config.ignoreSelectors ?? [],
      captureText: config.captureText ?? true,
      maxTextLength: config.maxTextLength ?? 100,
    }

    this.handleClick = this.onClick.bind(this)
  }

  /**
   * 启动追踪
   */
  start(callback?: (data: ClickData) => void): void {
    if (this.started) {
      return
    }

    if (callback) {
      this.callbacks.add(callback)
    }

    // 监听点击事件（使用捕获阶段）
    document.addEventListener('click', this.handleClick, true)

    this.started = true
  }

  /**
   * 处理点击事件
   */
  private onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement

    if (!target) {
      return
    }

    // 检查是否应该忽略
    if (this.shouldIgnore(target)) {
      return
    }

    const data: ClickData = {
      selector: getElementSelector(target),
      tagName: target.tagName.toLowerCase(),
      id: target.id || undefined,
      className: target.className || undefined,
      text: this.getElementText(target),
      coordinates: {
        x: event.clientX,
        y: event.clientY,
      },
      path: window.location.pathname,
      timestamp: now(),
    }

    this.emit(data)
  }

  /**
   * 获取元素文本
   */
  private getElementText(element: HTMLElement): string | undefined {
    if (!this.config.captureText) {
      return undefined
    }

    let text = element.textContent || element.innerText || ''
    text = text.trim()

    if (text.length > this.config.maxTextLength) {
      text = text.substring(0, this.config.maxTextLength) + '...'
    }

    return text || undefined
  }

  /**
   * 检查是否应该忽略
   */
  private shouldIgnore(element: HTMLElement): boolean {
    // 检查忽略选择器
    for (const selector of this.config.ignoreSelectors) {
      if (element.matches(selector)) {
        return true
      }
    }

    return false
  }

  /**
   * 发射事件
   */
  private emit(data: ClickData): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(data)
      }
      catch (error) {
        console.error('[ClickTracker] Error in callback:', error)
      }
    })
  }

  /**
   * 添加回调
   */
  onClick(callback: (data: ClickData) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * 停止追踪
   */
  stop(): void {
    document.removeEventListener('click', this.handleClick, true)
    this.callbacks.clear()
    this.started = false
  }
}

/**
 * 创建点击追踪器实例
 */
export function createClickTracker(config?: ClickTrackerConfig): ClickTracker {
  return new ClickTracker(config)
}

