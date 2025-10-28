/**
 * @ldesign/monitor - 内存监控收集器
 * 
 * 监控页面内存使用情况
 */

import type { PerformanceMetric } from '../../types'

export interface MemoryOptions {
  /**
   * 采样间隔（毫秒）
   * @default 30000
   */
  interval?: number

  /**
   * 内存警告阈值（字节）
   * @default 100MB
   */
  warningThreshold?: number

  /**
   * 内存危险阈值（字节）
   * @default 200MB
   */
  dangerThreshold?: number
}

export interface MemoryInfo {
  /**
   * 已使用的 JS 堆内存（字节）
   */
  usedJSHeapSize: number

  /**
   * JS 堆内存总大小（字节）
   */
  totalJSHeapSize: number

  /**
   * JS 堆内存限制（字节）
   */
  jsHeapSizeLimit: number

  /**
   * 使用率（0-1）
   */
  usage: number

  /**
   * 时间戳
   */
  timestamp: number
}

export class MemoryCollector {
  private options: Required<MemoryOptions>
  private intervalId: number | null = null
  private onMetric?: (metric: PerformanceMetric) => void
  private memoryHistory: MemoryInfo[] = []
  private readonly MAX_HISTORY = 100

  constructor(options: MemoryOptions = {}) {
    this.options = {
      interval: options.interval ?? 30000,
      warningThreshold: options.warningThreshold ?? 100 * 1024 * 1024, // 100MB
      dangerThreshold: options.dangerThreshold ?? 200 * 1024 * 1024, // 200MB
    }
  }

  /**
   * 启动收集
   */
  start(callback: (metric: PerformanceMetric) => void): void {
    this.onMetric = callback

    if (!this.supportsMemoryAPI()) {
      console.warn('[MemoryCollector] Memory API not supported')
      return
    }

    // 立即收集一次
    this.collectMemory()

    // 定期收集
    this.intervalId = window.setInterval(() => {
      this.collectMemory()
    }, this.options.interval)
  }

  /**
   * 停止收集
   */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * 获取当前内存信息
   */
  getCurrentMemory(): MemoryInfo | null {
    if (!this.supportsMemoryAPI()) {
      return null
    }

    const memory = (performance as any).memory
    const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage,
      timestamp: Date.now(),
    }
  }

  /**
   * 获取内存历史
   */
  getMemoryHistory(): MemoryInfo[] {
    return [...this.memoryHistory]
  }

  /**
   * 获取内存趋势
   */
  getMemoryTrend(): {
    increasing: boolean
    rate: number // 每秒增长字节数
  } | null {
    if (this.memoryHistory.length < 2) {
      return null
    }

    const first = this.memoryHistory[0]
    const last = this.memoryHistory[this.memoryHistory.length - 1]
    
    const timeDiff = (last.timestamp - first.timestamp) / 1000 // 秒
    const memoryDiff = last.usedJSHeapSize - first.usedJSHeapSize
    
    return {
      increasing: memoryDiff > 0,
      rate: memoryDiff / timeDiff,
    }
  }

  /**
   * 检测内存泄漏
   */
  detectMemoryLeak(): {
    suspected: boolean
    reason?: string
  } {
    if (this.memoryHistory.length < 5) {
      return { suspected: false }
    }

    const trend = this.getMemoryTrend()
    if (!trend) {
      return { suspected: false }
    }

    // 如果内存持续增长且增长率超过 1MB/s
    if (trend.increasing && trend.rate > 1024 * 1024) {
      return {
        suspected: true,
        reason: `Memory increasing at ${this.formatBytes(trend.rate)}/s`,
      }
    }

    // 如果内存使用率持续高于 80%
    const recentHighUsage = this.memoryHistory
      .slice(-5)
      .every(info => info.usage > 0.8)

    if (recentHighUsage) {
      return {
        suspected: true,
        reason: 'Memory usage consistently above 80%',
      }
    }

    return { suspected: false }
  }

  /**
   * 收集内存信息
   */
  private collectMemory(): void {
    const memoryInfo = this.getCurrentMemory()
    if (!memoryInfo) {
      return
    }

    // 添加到历史记录
    this.memoryHistory.push(memoryInfo)
    if (this.memoryHistory.length > this.MAX_HISTORY) {
      this.memoryHistory.shift()
    }

    // 计算评分
    const rating = this.getRating(memoryInfo.usedJSHeapSize)

    // 上报指标
    if (this.onMetric) {
      this.onMetric({
        name: 'memory',
        value: memoryInfo.usedJSHeapSize,
        unit: 'bytes',
        rating,
        attribution: {
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          usage: memoryInfo.usage,
          usagePercent: `${(memoryInfo.usage * 100).toFixed(2)}%`,
          formatted: {
            used: this.formatBytes(memoryInfo.usedJSHeapSize),
            total: this.formatBytes(memoryInfo.totalJSHeapSize),
            limit: this.formatBytes(memoryInfo.jsHeapSizeLimit),
          },
        },
      })
    }

    // 检测潜在内存泄漏
    const leakDetection = this.detectMemoryLeak()
    if (leakDetection.suspected && this.onMetric) {
      this.onMetric({
        name: 'memory-leak-suspected',
        value: 1,
        unit: 'count',
        rating: 'poor',
        attribution: {
          reason: leakDetection.reason,
          trend: this.getMemoryTrend(),
        },
      })
    }
  }

  /**
   * 获取评分
   */
  private getRating(usedMemory: number): 'good' | 'needs-improvement' | 'poor' {
    if (usedMemory < this.options.warningThreshold) {
      return 'good'
    }
    if (usedMemory < this.options.dangerThreshold) {
      return 'needs-improvement'
    }
    return 'poor'
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  /**
   * 检查是否支持 Memory API
   */
  private supportsMemoryAPI(): boolean {
    return (
      typeof performance !== 'undefined' &&
      'memory' in performance &&
      typeof (performance as any).memory === 'object'
    )
  }
}
