/**
 * @ldesign/monitor - Long Tasks 检测器
 * 
 * 检测阻塞主线程超过 50ms 的长任务
 */

import type { PerformanceMetric } from '../../types'

export interface LongTaskOptions {
  /**
   * 长任务阈值（毫秒）
   * @default 50
   */
  threshold?: number

  /**
   * 是否收集归因信息
   * @default true
   */
  collectAttribution?: boolean
}

export interface LongTaskInfo extends PerformanceMetric {
  /**
   * 任务开始时间
   */
  startTime: number

  /**
   * 任务持续时间
   */
  duration: number

  /**
   * 归因信息
   */
  attribution?: {
    name: string
    entryType: string
    startTime: number
    duration: number
    containerType?: string
    containerSrc?: string
    containerId?: string
    containerName?: string
  }[]
}

export class LongTaskCollector {
  private options: Required<LongTaskOptions>
  private observer: PerformanceObserver | null = null
  private onMetric?: (metric: LongTaskInfo) => void
  private longTaskCount = 0
  private totalBlockingTime = 0

  constructor(options: LongTaskOptions = {}) {
    this.options = {
      threshold: options.threshold ?? 50,
      collectAttribution: options.collectAttribution ?? true,
    }
  }

  /**
   * 启动收集
   */
  start(callback: (metric: LongTaskInfo) => void): void {
    this.onMetric = callback

    if (!this.supportsLongTasks()) {
      console.warn('[LongTaskCollector] Long Tasks API not supported')
      return
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLongTask(entry as PerformanceEntry)
        }
      })

      this.observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      console.error('[LongTaskCollector] Failed to start observer:', error)
    }
  }

  /**
   * 停止收集
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      longTaskCount: this.longTaskCount,
      totalBlockingTime: this.totalBlockingTime,
      averageBlockingTime: this.longTaskCount > 0 
        ? this.totalBlockingTime / this.longTaskCount 
        : 0,
    }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.longTaskCount = 0
    this.totalBlockingTime = 0
  }

  /**
   * 处理长任务
   */
  private handleLongTask(entry: PerformanceEntry): void {
    const duration = entry.duration
    
    if (duration < this.options.threshold) {
      return
    }

    this.longTaskCount++
    
    // 计算阻塞时间（超过 50ms 的部分）
    const blockingTime = Math.max(0, duration - 50)
    this.totalBlockingTime += blockingTime

    const rating = this.getRating(duration)
    
    const longTaskInfo: LongTaskInfo = {
      name: 'longtask',
      value: duration,
      unit: 'ms',
      rating,
      startTime: entry.startTime,
      duration: entry.duration,
      attribution: {
        blockingTime,
        taskCount: this.longTaskCount,
        totalBlockingTime: this.totalBlockingTime,
      },
    }

    // 收集归因信息
    if (this.options.collectAttribution && 'attribution' in entry) {
      const attribution = (entry as any).attribution
      if (Array.isArray(attribution) && attribution.length > 0) {
        longTaskInfo.attribution = attribution.map((attr: any) => ({
          name: attr.name || 'unknown',
          entryType: attr.entryType || 'unknown',
          startTime: attr.startTime || 0,
          duration: attr.duration || 0,
          containerType: attr.containerType,
          containerSrc: attr.containerSrc,
          containerId: attr.containerId,
          containerName: attr.containerName,
        }))
      }
    }

    if (this.onMetric) {
      this.onMetric(longTaskInfo)
    }
  }

  /**
   * 获取评分
   */
  private getRating(duration: number): 'good' | 'needs-improvement' | 'poor' {
    // 基于 Total Blocking Time (TBT) 的评分标准
    if (duration < 50) return 'good'
    if (duration < 200) return 'needs-improvement'
    return 'poor'
  }

  /**
   * 检查是否支持 Long Tasks API
   */
  private supportsLongTasks(): boolean {
    return (
      typeof PerformanceObserver !== 'undefined' &&
      typeof PerformanceObserver.supportedEntryTypes !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes.includes('longtask')
    )
  }
}

/**
 * 计算 Total Blocking Time (TBT)
 * TBT 是 FCP 和 TTI 之间所有长任务的阻塞时间总和
 */
export function calculateTBT(longTasks: LongTaskInfo[]): number {
  return longTasks.reduce((total, task) => {
    // 只计算超过 50ms 的部分
    const blockingTime = Math.max(0, task.duration - 50)
    return total + blockingTime
  }, 0)
}
