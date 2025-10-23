/**
 * 批量队列
 * 用于聚合数据，减少网络请求次数
 */

import type { BatchQueueConfig, IBatchQueue, ReportData } from '../types/reporter'

/**
 * 批量队列类
 */
export class BatchQueue implements IBatchQueue {
  /**
   * 配置
   */
  private config: Required<BatchQueueConfig>

  /**
   * 队列
   */
  private queue: ReportData[] = []

  /**
   * 定时器
   */
  private timer: ReturnType<typeof setTimeout> | null = null

  /**
   * 刷新回调函数
   */
  private onFlush?: (data: ReportData[]) => void

  constructor(config: BatchQueueConfig = {}, onFlush?: (data: ReportData[]) => void) {
    this.config = {
      batchSize: config.batchSize ?? 10,
      batchInterval: config.batchInterval ?? 5000,
      maxQueueSize: config.maxQueueSize ?? 100,
      overflowStrategy: config.overflowStrategy ?? 'drop-oldest',
    }

    this.onFlush = onFlush

    // 启动定时刷新
    this.startTimer()
  }

  /**
   * 添加数据到队列
   * 
   * @param data - 上报数据
   */
  add(data: ReportData): void {
    // 检查队列是否已满
    if (this.queue.length >= this.config.maxQueueSize) {
      this.handleOverflow(data)
      return
    }

    // 添加到队列
    this.queue.push(data)

    // 检查是否达到批量大小阈值
    if (this.queue.length >= this.config.batchSize) {
      this.flushNow()
    }
  }

  /**
   * 处理队列溢出
   * 
   * @param data - 新数据
   */
  private handleOverflow(data: ReportData): void {
    switch (this.config.overflowStrategy) {
      case 'drop-oldest':
        // 移除最旧的数据，添加新数据
        this.queue.shift()
        this.queue.push(data)
        break
      case 'drop-newest':
        // 丢弃新数据
        break
      case 'reject':
        // 拒绝新数据并警告
        console.warn('[BatchQueue] Queue is full, data rejected')
        break
    }
  }

  /**
   * 获取并清空队列
   * 
   * @returns 队列中的所有数据
   */
  flush(): ReportData[] {
    const data = [...this.queue]
    this.queue = []
    return data
  }

  /**
   * 立即刷新队列
   */
  private flushNow(): void {
    if (this.queue.length === 0) {
      return
    }

    const data = this.flush()

    if (this.onFlush) {
      try {
        this.onFlush(data)
      }
      catch (error) {
        console.error('[BatchQueue] Error in onFlush callback:', error)
      }
    }

    // 重启定时器
    this.restartTimer()
  }

  /**
   * 获取队列大小
   * 
   * @returns 队列中的数据数量
   */
  size(): number {
    return this.queue.length
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = []
  }

  /**
   * 启动定时器
   */
  private startTimer(): void {
    if (this.timer) {
      return
    }

    this.timer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flushNow()
      }
    }, this.config.batchInterval)
  }

  /**
   * 重启定时器
   */
  private restartTimer(): void {
    this.stopTimer()
    this.startTimer()
  }

  /**
   * 停止定时器
   */
  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * 销毁队列
   * 刷新所有数据并停止定时器
   */
  destroy(): void {
    this.flushNow()
    this.stopTimer()
  }
}

/**
 * 创建批量队列实例
 * 
 * @param config - 配置
 * @param onFlush - 刷新回调
 * @returns 批量队列实例
 */
export function createBatchQueue(
  config?: BatchQueueConfig,
  onFlush?: (data: ReportData[]) => void,
): BatchQueue {
  return new BatchQueue(config, onFlush)
}


