/**
 * 资源加载错误收集器
 * 捕获图片、脚本、样式表等资源的加载错误
 */

import type { MonitorErrorEvent } from '../../types/error'
import { ErrorLevel, ErrorType } from '../../types/error'
import { getElementSelector, now } from '../../utils'

/**
 * 资源错误收集器类
 */
export class ResourceErrorCollector {
  /**
   * 是否已启动
   */
  private started = false

  /**
   * 回调函数列表
   */
  private callbacks: Set<(error: MonitorErrorEvent) => void> = new Set()

  /**
   * error 事件处理器
   */
  private handleError: (event: Event) => void

  constructor() {
    this.handleError = this.onError.bind(this)
  }

  /**
   * 启动错误收集
   * 
   * @param callback - 错误收集回调
   */
  start(callback?: (error: MonitorErrorEvent) => void): void {
    if (this.started) {
      console.warn('[ResourceErrorCollector] Already started')
      return
    }

    if (callback) {
      this.callbacks.add(callback)
    }

    // 监听全局 error 事件（捕获资源加载错误）
    // 使用捕获阶段，因为资源加载错误不会冒泡
    window.addEventListener('error', this.handleError, true)

    this.started = true
  }

  /**
   * 处理错误事件
   * 
   * @param event - 错误事件
   */
  private onError(event: Event): void {
    // 只处理资源加载错误
    const target = event.target as HTMLElement

    if (!target || target === window) {
      return
    }

    // 检查是否是资源加载错误
    if (
      target.tagName === 'SCRIPT'
      || target.tagName === 'LINK'
      || target.tagName === 'IMG'
      || target.tagName === 'VIDEO'
      || target.tagName === 'AUDIO'
      || target.tagName === 'IFRAME'
    ) {
      try {
        const errorEvent = this.createErrorEvent(target)

        // 调用所有回调
        this.callbacks.forEach((callback) => {
          try {
            callback(errorEvent)
          }
          catch (err) {
            console.error('[ResourceErrorCollector] Error in callback:', err)
          }
        })
      }
      catch (err) {
        console.error('[ResourceErrorCollector] Error in onError:', err)
      }
    }
  }

  /**
   * 创建错误事件对象
   * 
   * @param element - 错误元素
   * @returns 错误事件
   */
  private createErrorEvent(element: HTMLElement): MonitorErrorEvent {
    const tagName = element.tagName.toLowerCase()
    const url = this.getResourceURL(element)
    const selector = getElementSelector(element)

    return {
      type: ErrorType.RESOURCE_ERROR,
      level: ErrorLevel.ERROR,
      message: `Resource loading failed: ${url}`,
      filename: url,
      context: {
        tags: {
          resourceType: this.getResourceType(tagName),
          tagName,
          selector,
        },
      } as any,
      timestamp: now(),
    }
  }

  /**
   * 获取资源 URL
   * 
   * @param element - 元素
   * @returns 资源 URL
   */
  private getResourceURL(element: HTMLElement): string {
    if (element instanceof HTMLScriptElement) {
      return element.src
    }
    if (element instanceof HTMLLinkElement) {
      return element.href
    }
    if (element instanceof HTMLImageElement) {
      return element.src
    }
    if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) {
      return element.src
    }
    if (element instanceof HTMLIFrameElement) {
      return element.src
    }
    return ''
  }

  /**
   * 获取资源类型
   * 
   * @param tagName - 标签名
   * @returns 资源类型
   */
  private getResourceType(tagName: string): string {
    switch (tagName) {
      case 'script':
        return 'script'
      case 'link':
        return 'stylesheet'
      case 'img':
        return 'image'
      case 'video':
        return 'video'
      case 'audio':
        return 'audio'
      case 'iframe':
        return 'iframe'
      default:
        return 'unknown'
    }
  }

  /**
   * 添加回调
   * 
   * @param callback - 回调函数
   * @returns 取消回调的函数
   */
  onError(callback: (error: MonitorErrorEvent) => void): () => void {
    this.callbacks.add(callback)

    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * 停止收集
   */
  stop(): void {
    if (!this.started) {
      return
    }

    window.removeEventListener('error', this.handleError, true)

    this.started = false
    this.callbacks.clear()
  }
}

/**
 * 创建资源错误收集器实例
 * 
 * @returns 资源错误收集器实例
 */
export function createResourceErrorCollector(): ResourceErrorCollector {
  return new ResourceErrorCollector()
}

