/**
 * 上报管理器
 * 整合批量队列、HTTP/Beacon上报、重试、采样等功能
 */

import type { IReporter, ReportData, ReportStats } from '../types/reporter'
import { ReportStatus } from '../types/reporter'
import { BatchQueue } from './BatchQueue'
import { BeaconReporter } from './BeaconReporter'
import { HttpReporter } from './HttpReporter'
import { RetryManager } from './RetryManager'
import { SamplingManager } from './SamplingManager'
import { now } from '../utils'

/**
 * 上报管理器配置
 */
export interface ReporterConfig {
  /**
   * DSN（数据上报地址）
   */
  dsn: string

  /**
   * 是否启用批量上报
   * @default true
   */
  enableBatch?: boolean

  /**
   * 批量配置
   */
  batch?: {
    size?: number
    interval?: number
  }

  /**
   * 是否启用重试
   * @default true
   */
  enableRetry?: boolean

  /**
   * 重试配置
   */
  retry?: {
    maxRetries?: number
    delay?: number
  }

  /**
   * 是否启用采样
   * @default true
   */
  enableSampling?: boolean

  /**
   * 采样配置
   */
  sampling?: {
    sampleRate?: number
    errorSampleRate?: number
    performanceSampleRate?: number
  }

  /**
   * 是否在页面卸载时使用 Beacon
   * @default true
   */
  useBeaconOnUnload?: boolean

  /**
   * 请求超时时间（毫秒）
   * @default 5000
   */
  timeout?: number

  /**
   * 自定义请求头
   */
  headers?: Record<string, string>
}

/**
 * 上报管理器类
 */
export class Reporter implements IReporter {
  /**
   * 配置
   */
  private config: Required<ReporterConfig>

  /**
   * 批量队列
   */
  private batchQueue: BatchQueue | null = null

  /**
   * HTTP 上报器
   */
  private httpReporter: HttpReporter

  /**
   * Beacon 上报器
   */
  private beaconReporter: BeaconReporter

  /**
   * 重试管理器
   */
  private retryManager: RetryManager | null = null

  /**
   * 采样管理器
   */
  private samplingManager: SamplingManager | null = null

  /**
   * 统计信息
   */
  private stats: ReportStats = {
    totalSends: 0,
    successCount: 0,
    failedCount: 0,
    droppedCount: 0,
    totalBytes: 0,
    avgResponseTime: 0,
    successRate: 0,
  }

  /**
   * 响应时间累计（用于计算平均值）
   */
  private totalResponseTime = 0

  constructor(config: ReporterConfig) {
    this.config = {
      dsn: config.dsn,
      enableBatch: config.enableBatch ?? true,
      batch: config.batch ?? {},
      enableRetry: config.enableRetry ?? true,
      retry: config.retry ?? {},
      enableSampling: config.enableSampling ?? true,
      sampling: config.sampling ?? {},
      useBeaconOnUnload: config.useBeaconOnUnload ?? true,
      timeout: config.timeout ?? 5000,
      headers: config.headers ?? {},
    }

    // 创建 HTTP 上报器
    this.httpReporter = new HttpReporter({
      url: this.config.dsn,
      timeout: this.config.timeout,
      headers: this.config.headers,
    })

    // 创建 Beacon 上报器
    this.beaconReporter = new BeaconReporter({
      url: this.config.dsn,
    })

    // 创建批量队列
    if (this.config.enableBatch) {
      this.batchQueue = new BatchQueue(
        this.config.batch,
        (data) => this.sendBatchInternal(data),
      )
    }

    // 创建重试管理器
    if (this.config.enableRetry) {
      this.retryManager = new RetryManager(this.config.retry)
    }

    // 创建采样管理器
    if (this.config.enableSampling) {
      this.samplingManager = new SamplingManager(this.config.sampling)
    }

    // 监听页面卸载事件
    if (this.config.useBeaconOnUnload) {
      this.setupUnloadHandler()
    }
  }

  /**
   * 发送单条数据
   * 
   * @param data - 上报数据
   */
  async send(data: ReportData | ReportData[]): Promise<void> {
    const dataArray = Array.isArray(data) ? data : [data]

    for (const item of dataArray) {
      // 采样检查
      if (this.samplingManager && !this.samplingManager.shouldSample(item)) {
        this.stats.droppedCount++
        continue
      }

      // 添加到批量队列
      if (this.batchQueue) {
        this.batchQueue.add(item)
      }
      else {
        // 直接发送
        await this.sendBatchInternal([item])
      }
    }
  }

  /**
   * 批量发送数据
   * 
   * @param batch - 数据批次
   */
  async sendBatch(batch: ReportData[]): Promise<void> {
    if (batch.length === 0) {
      return
    }

    return this.sendBatchInternal(batch)
  }

  /**
   * 内部批量发送方法
   * 
   * @param batch - 数据批次
   */
  private async sendBatchInternal(batch: ReportData[]): Promise<void> {
    const startTime = now()
    this.stats.totalSends++

    try {
      // 使用重试管理器（如果启用）
      if (this.retryManager) {
        await this.retryManager.execute(() => this.httpReporter.sendBatch(batch))
      }
      else {
        await this.httpReporter.sendBatch(batch)
      }

      // 更新统计
      const duration = now() - startTime
      this.stats.successCount++
      this.totalResponseTime += duration
      this.stats.avgResponseTime = this.totalResponseTime / this.stats.successCount
      this.stats.totalBytes += this.estimateSize(batch)
      this.stats.lastSendTime = now()
    }
    catch (error) {
      console.error('[Reporter] Failed to send data:', error)
      this.stats.failedCount++
      throw error
    }
    finally {
      // 更新成功率
      this.stats.successRate = this.stats.successCount / this.stats.totalSends
    }
  }

  /**
   * 刷新队列
   * 立即发送队列中的所有数据
   */
  async flush(): Promise<void> {
    if (this.batchQueue) {
      this.batchQueue.destroy()
    }
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计信息
   */
  getStats(): ReportStats {
    return { ...this.stats }
  }

  /**
   * 估算数据大小（字节）
   * 
   * @param data - 数据
   * @returns 估算的字节数
   */
  private estimateSize(data: unknown): number {
    const str = JSON.stringify(data)
    return new Blob([str]).size
  }

  /**
   * 卸载处理器引用（用于清理）
   */
  private unloadHandler: (() => void) | null = null

  /**
   * 可见性变化处理器引用（用于清理）
   */
  private visibilityChangeHandler: (() => void) | null = null

  /**
   * 设置页面卸载处理器
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') {
      return
    }

    this.unloadHandler = () => {
      // 刷新批量队列
      if (this.batchQueue) {
        const data = this.batchQueue.flush()
        if (data.length > 0) {
          // 使用 Beacon API 发送
          this.beaconReporter.sendBatch(data).catch((error) => {
            console.error('[Reporter] Failed to send data on unload:', error)
          })
        }
      }
    }

    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.unloadHandler?.()
      }
    }

    // 监听多个卸载事件
    window.addEventListener('beforeunload', this.unloadHandler)
    window.addEventListener('pagehide', this.unloadHandler)

    // 监听页面可见性变化（移动端）
    document.addEventListener('visibilitychange', this.visibilityChangeHandler)
  }

  /**
   * 销毁上报器
   * 清理所有资源，防止内存泄漏
   */
  destroy(): void {
    // 刷新并销毁批量队列
    if (this.batchQueue) {
      this.batchQueue.destroy()
      this.batchQueue = null
    }

    // 移除事件监听器
    if (typeof window !== 'undefined') {
      if (this.unloadHandler) {
        window.removeEventListener('beforeunload', this.unloadHandler)
        window.removeEventListener('pagehide', this.unloadHandler)
        this.unloadHandler = null
      }

      if (this.visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
        this.visibilityChangeHandler = null
      }
    }
  }
}

/**
 * 创建上报管理器实例
 * 
 * @param config - 配置
 * @returns 上报管理器实例
 */
export function createReporter(config: ReporterConfig): Reporter {
  return new Reporter(config)
}




















