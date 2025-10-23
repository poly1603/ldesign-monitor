/**
 * JavaScript 错误收集器
 * 捕获全局 JavaScript 运行时错误
 */

import type { MonitorErrorEvent } from '../../types/error'
import { ErrorLevel, ErrorType } from '../../types/error'
import { now } from '../../utils'
import { StackParser } from './StackParser'

/**
 * JavaScript 错误收集器类
 */
export class JSErrorCollector {
  /**
   * 是否已启动
   */
  private started = false

  /**
   * 原始的 onerror 处理器
   */
  private originalOnError: OnErrorEventHandler | null = null

  /**
   * 堆栈解析器
   */
  private stackParser: StackParser

  /**
   * 回调函数列表
   */
  private callbacks: Set<(error: MonitorErrorEvent) => void> = new Set()

  constructor() {
    this.stackParser = new StackParser()
  }

  /**
   * 启动错误收集
   * 
   * @param callback - 错误收集回调
   */
  start(callback?: (error: MonitorErrorEvent) => void): void {
    if (this.started) {
      console.warn('[JSErrorCollector] Already started')
      return
    }

    if (callback) {
      this.callbacks.add(callback)
    }

    // 保存原始的 onerror 处理器
    this.originalOnError = window.onerror

    // 设置全局错误处理器
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(message, source, lineno, colno, error)

      // 调用原始处理器
      if (this.originalOnError) {
        return this.originalOnError(message, source, lineno, colno, error)
      }

      return false
    }

    this.started = true
  }

  /**
   * 处理错误
   * 
   * @param message - 错误消息
   * @param source - 错误来源文件
   * @param lineno - 行号
   * @param colno - 列号
   * @param error - 错误对象
   */
  private handleError(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): void {
    try {
      const errorMessage = typeof message === 'string' ? message : message.type
      const errorEvent = this.createErrorEvent(errorMessage, source, lineno, colno, error)

      // 调用所有回调
      this.callbacks.forEach((callback) => {
        try {
          callback(errorEvent)
        }
        catch (err) {
          console.error('[JSErrorCollector] Error in callback:', err)
        }
      })
    }
    catch (err) {
      console.error('[JSErrorCollector] Error in handleError:', err)
    }
  }

  /**
   * 创建错误事件对象
   * 
   * @param message - 错误消息
   * @param filename - 文件名
   * @param lineno - 行号
   * @param colno - 列号
   * @param error - 错误对象
   * @returns 错误事件
   */
  private createErrorEvent(
    message: string,
    filename?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): MonitorErrorEvent {
    const stack = error?.stack
    const stackFrames = stack ? this.stackParser.parse(stack) : []

    return {
      type: ErrorType.JS_ERROR,
      level: ErrorLevel.ERROR,
      message: message || error?.message || 'Unknown error',
      error,
      stack,
      stackFrames,
      filename,
      lineno,
      colno,
      timestamp: now(),
    }
  }

  /**
   * 手动捕获错误
   * 
   * @param error - 错误对象
   * @param context - 错误上下文
   */
  captureError(error: Error, context?: Record<string, unknown>): void {
    const errorEvent = this.createErrorEvent(
      error.message,
      undefined,
      undefined,
      undefined,
      error,
    )

    if (context) {
      errorEvent.context = context as any
    }

    this.callbacks.forEach((callback) => {
      try {
        callback(errorEvent)
      }
      catch (err) {
        console.error('[JSErrorCollector] Error in callback:', err)
      }
    })
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

    // 恢复原始的 onerror 处理器
    window.onerror = this.originalOnError
    this.originalOnError = null

    this.started = false
    this.callbacks.clear()
  }
}

/**
 * 创建 JavaScript 错误收集器实例
 * 
 * @returns JavaScript 错误收集器实例
 */
export function createJSErrorCollector(): JSErrorCollector {
  return new JSErrorCollector()
}

