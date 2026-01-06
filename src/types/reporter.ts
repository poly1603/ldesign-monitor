/**
 * @ldesign/monitor - 上报模块类型定义
 * @packageDocumentation
 */

import type { ReportData } from './index'

/**
 * 上报数据类型枚举
 * @enum {string}
 */
export enum ReportDataType {
  /** 性能数据 */
  Performance = 'performance',
  /** 错误数据 */
  Error = 'error',
  /** 行为数据 */
  Behavior = 'behavior',
  /** API 数据 */
  API = 'api',
}

/**
 * 上报状态枚举
 * @enum {string}
 */
export enum ReportStatus {
  /** 等待发送 */
  Pending = 'pending',
  /** 发送中 */
  Sending = 'sending',
  /** 发送成功 */
  Success = 'success',
  /** 发送失败 */
  Failed = 'failed',
}

/**
 * 上报结果接口
 */
export interface ReportResult {
  /** 是否成功 */
  readonly success: boolean
  /** 错误信息 */
  readonly error?: string
  /** 响应数据 */
  readonly response?: unknown
}

/**
 * 上报统计接口
 * 用于跟踪上报器的运行状态和性能指标
 */
export interface ReportStats {
  /** 总发送次数 */
  readonly totalSends: number
  /** 成功次数 */
  readonly successCount: number
  /** 失败次数 */
  readonly failedCount: number
  /** 被丢弃的数据数量（采样或队列溢出） */
  readonly droppedCount: number
  /** 总发送字节数 */
  readonly totalBytes: number
  /** 平均响应时间（毫秒） */
  readonly avgResponseTime: number
  /** 成功率（0-1） */
  readonly successRate: number
  /** 最后发送时间戳 */
  readonly lastSendTime?: number
}

/**
 * 上报器接口
 * 定义了上报器必须实现的方法
 */
export interface IReporter {
  /**
   * 发送数据
   * @param data - 要发送的数据，可以是单条或数组
   * @returns Promise，完成时 resolve
   */
  send(data: ReportData | ReportData[]): Promise<void>

  /**
   * 批量发送数据
   * @param data - 数据数组
   * @returns Promise，完成时 resolve
   */
  sendBatch(data: ReportData[]): Promise<void>

  /**
   * 刷新队列，立即发送所有待发送数据
   * @returns Promise，完成时 resolve
   */
  flush(): Promise<void>

  /**
   * 获取统计信息
   * @returns 上报统计数据
   */
  getStats(): ReportStats
}

/**
 * 队列溢出策略
 */
export type OverflowStrategy = 'drop-oldest' | 'drop-newest' | 'reject'

/**
 * 批量队列配置接口
 * 用于配置数据批量发送行为
 */
export interface BatchQueueConfig {
  /**
   * 批量大小 - 达到此数量时触发发送
   * @default 10
   */
  batchSize?: number

  /**
   * 批量间隔（毫秒）- 超过此时间触发发送
   * @default 5000
   */
  batchInterval?: number

  /**
   * 最大队列大小 - 超过此数量触发溢出策略
   * @default 100
   */
  maxQueueSize?: number

  /**
   * 队列溢出策略
   * - 'drop-oldest': 丢弃最旧的数据
   * - 'drop-newest': 丢弃新数据
   * - 'reject': 拒绝并警告
   * @default 'drop-oldest'
   */
  overflowStrategy?: OverflowStrategy
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
 * HTTP 请求方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH'

/**
 * HTTP 上报器配置接口
 */
export interface HttpReporterConfig {
  /**
   * 上报 URL
   */
  url: string

  /**
   * HTTP 方法
   * @default 'POST'
   */
  method?: HttpMethod

  /**
   * 超时时间（毫秒）
   * @default 5000
   */
  timeout?: number

  /**
   * 自定义请求头
   */
  headers?: Record<string, string>

  /**
   * 是否压缩数据
   * @default true
   */
  compress?: boolean

  /**
   * 是否使用 JSON 格式
   * @default true
   */
  json?: boolean
}

/**
 * Beacon 上报器配置接口
 */
export interface BeaconReporterConfig {
  /**
   * 上报 URL
   */
  url: string
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






























