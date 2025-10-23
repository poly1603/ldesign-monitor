/**
 * Promise Rejection 错误收集器
 * 捕获未处理的 Promise rejection
 */

import type { MonitorErrorEvent } from '../../types/error'
import { ErrorLevel, ErrorType } from '../../types/error'
import { now } from '../../utils'
import { StackParser } from './StackParser'

/**
 * Promise 错误收集器类
 */
export class PromiseErrorCollector {
  /**
   * 是否已启动
   */
  private started = false

  /**
   * 堆栈解析器
   */
  private stackParser: StackParser

  /**
   * 回调函数列表
   */
  private callbacks: Set<(error: MonitorErrorEvent) => void> = new Set()

  /**
   * unhandledrejection 事件处理器
   */
  private handleUnhandledRejection: (event: PromiseRejectionEvent) => void

  constructor() {
    this.stackParser = new StackParser()
    this.handleUnhandledRejection = this.onUnhandledRejection.bind(this)
  }

  /**
   * 启动错误收集
   * 
   * @param callback - 错误收集回调
   */
  start(callback?: (error: MonitorErrorEvent) => void): void {
    if (this.started) {
      console.warn('[PromiseErrorCollector] Already started')
      return
    }

    if (callback) {
      this.callbacks.add(callback)
    }

    // 监听 unhandledrejection 事件
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)

    this.started = true
  }

  /**
   * 处理未处理的 Promise rejection
   * 
   * @param event - Promise rejection 事件
   */
  private onUnhandledRejection(event: PromiseRejectionEvent): void {
    try {
      const errorEvent = this.createErrorEvent(event)

      // 调用所有回调
      this.callbacks.forEach((callback) => {
        try {
          callback(errorEvent)
        }
        catch (err) {
          console.error('[PromiseErrorCollector] Error in callback:', err)
        }
      })
    }
    catch (err) {
      console.error('[PromiseErrorCollector] Error in onUnhandledRejection:', err)
    }
  }

  /**
   * 创建错误事件对象
   * 
   * @param event - Promise rejection 事件
   * @returns 错误事件
   */
  private createErrorEvent(event: PromiseRejectionEvent): MonitorErrorEvent {
    const { reason } = event

    let message: string
    let error: Error | undefined
    let stack: string | undefined
    let stackFrames: any[] = []

    // 处理不同类型的 rejection 原因
    if (reason instanceof Error) {
      message = reason.message
      error = reason
      stack = reason.stack
      if (stack) {
        stackFrames = this.stackParser.parse(stack)
      }
    }
    else if (typeof reason === 'string') {
      message = reason
    }
    else if (typeof reason === 'object' && reason !== null) {
      message = JSON.stringify(reason)
    }
    else {
      message = String(reason)
    }

    return {
      type: ErrorType.PROMISE_REJECTION,
      level: ErrorLevel.ERROR,
      message: `Unhandled Promise Rejection: ${message}`,
      error,
      stack,
      stackFrames,
      timestamp: now(),
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

    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)

    this.started = false
    this.callbacks.clear()
  }
}

/**
 * 创建 Promise 错误收集器实例
 * 
 * @returns Promise 错误收集器实例
 */
export function createPromiseErrorCollector(): PromiseErrorCollector {
  return new PromiseErrorCollector()
}

