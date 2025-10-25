/**
 * 错误追踪类型定义
 */

import type { ErrorInfo, StackFrame } from './index'

/**
 * 错误级别
 */
export enum ErrorLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

/**
 * 错误类型
 */
export enum ErrorType {
  JSError = 'js-error',
  PromiseRejection = 'promise-rejection',
  ResourceError = 'resource-error',
  ApiError = 'api-error',
  Custom = 'custom',
}

/**
 * 监控错误事件
 */
export interface MonitorErrorEvent {
  /**
   * 错误类型
   */
  type: ErrorType

  /**
   * 错误消息
   */
  message: string

  /**
   * 错误堆栈
   */
  stack?: string

  /**
   * 堆栈帧
   */
  stackFrames?: StackFrame[]

  /**
   * 文件名
   */
  filename?: string

  /**
   * 行号
   */
  lineno?: number

  /**
   * 列号
   */
  colno?: number

  /**
   * 错误级别
   */
  level: ErrorLevel

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 错误指纹
   */
  fingerprint?: string

  /**
   * 额外数据
   */
  extra?: Record<string, unknown>
}

/**
 * 错误分组
 */
export interface ErrorGroup {
  /**
   * 错误指纹
   */
  fingerprint: string

  /**
   * 错误数量
   */
  count: number

  /**
   * 首次出现时间
   */
  firstSeen: number

  /**
   * 最后出现时间
   */
  lastSeen: number

  /**
   * 最后一次错误
   */
  lastError: MonitorErrorEvent
}

/**
 * Source 信息
 */
export interface SourceInfo {
  /**
   * 源文件名
   */
  source: string

  /**
   * 源代码行号
   */
  line: number

  /**
   * 源代码列号
   */
  column: number

  /**
   * 函数名
   */
  name?: string

  /**
   * 源代码片段
   */
  context?: string[]
}



















