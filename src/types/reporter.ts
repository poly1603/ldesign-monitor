/**
 * 上报模块类型定义
 */

import type { ReportData } from './index'

/**
 * 上报数据类型
 */
export enum ReportDataType {
  Performance = 'performance',
  Error = 'error',
  Behavior = 'behavior',
  API = 'api',
}

/**
 * 上报状态
 */
export enum ReportStatus {
  Pending = 'pending',
  Sending = 'sending',
  Success = 'success',
  Failed = 'failed',
}

/**
 * 上报结果
 */
export interface ReportResult {
  /**
   * 是否成功
   */
  success: boolean

  /**
   * 错误信息
   */
  error?: string

  /**
   * 响应数据
   */
  response?: any
}

/**
 * 上报统计
 */
export interface ReportStats {
  /**
   * 总上报数
   */
  total: number

  /**
   * 成功数
   */
  success: number

  /**
   * 失败数
   */
  failed: number

  /**
   * 待处理数
   */
  pending: number
}

/**
 * 上报器接口
 */
export interface IReporter {
  /**
   * 发送数据
   */
  send(data: ReportData): Promise<ReportResult>

  /**
   * 批量发送
   */
  sendBatch(data: ReportData[]): Promise<ReportResult>

  /**
   * 获取统计信息
   */
  getStats(): ReportStats
}

/**
 * 批量队列配置
 */
export interface BatchQueueConfig {
  /**
   * 批量大小
   */
  size?: number

  /**
   * 批量间隔（毫秒）
   */
  interval?: number

  /**
   * 最大队列大小
   */
  maxSize?: number
}

/**
 * 批量队列接口
 */
export interface IBatchQueue {
  /**
   * 添加数据
   */
  add(data: ReportData): void

  /**
   * 批量添加
   */
  addBatch(data: ReportData[]): void

  /**
   * 刷新队列
   */
  flush(): ReportData[]

  /**
   * 获取队列大小
   */
  size(): number

  /**
   * 清空队列
   */
  clear(): void
}

/**
 * HTTP 上报器配置
 */
export interface HttpReporterConfig {
  /**
   * DSN
   */
  dsn: string

  /**
   * 超时时间
   */
  timeout?: number

  /**
   * 请求头
   */
  headers?: Record<string, string>
}

/**
 * Beacon 上报器配置
 */
export interface BeaconReporterConfig {
  /**
   * DSN
   */
  dsn: string
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /**
   * 最大重试次数
   */
  maxRetries?: number

  /**
   * 重试延迟
   */
  delay?: number

  /**
   * 退避因子
   */
  backoffFactor?: number

  /**
   * 最大延迟
   */
  maxDelay?: number

  /**
   * 是否应该重试的判断函数
   */
  shouldRetry?: (error: Error, attempt: number) => boolean
}

/**
 * 重试管理器接口
 */
export interface IRetryManager {
  /**
   * 执行带重试的操作
   */
  execute<T>(fn: () => Promise<T>): Promise<T>

  /**
   * 获取重试统计
   */
  getStats(): {
    totalAttempts: number
    successfulRetries: number
    failedRetries: number
  }
}

/**
 * 采样配置
 */
export interface SamplingConfig {
  /**
   * 全局采样率
   */
  globalRate?: number

  /**
   * 性能采样率
   */
  performanceRate?: number

  /**
   * 错误采样率
   */
  errorRate?: number

  /**
   * 行为采样率
   */
  behaviorRate?: number

  /**
   * API 采样率
   */
  apiRate?: number
}

/**
 * 采样管理器接口
 */
export interface ISamplingManager {
  /**
   * 是否应该采样
   */
  shouldSample(data: ReportData): boolean

  /**
   * 更新采样率
   */
  updateRate(config: Partial<SamplingConfig>): void

  /**
   * 获取采样统计
   */
  getStats(): {
    total: number
    sampled: number
    dropped: number
  }
}



















