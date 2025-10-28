/**
 * @ldesign/monitor - 自定义性能标记收集器
 * 
 * 支持 performance.mark() 和 performance.measure()
 */

import type { PerformanceMetric } from '../../types'

export interface CustomMarkOptions {
  /**
   * 是否自动收集所有 mark
   */
  autoCollect?: boolean
  
  /**
   * 标记名称过滤器
   */
  markFilter?: (name: string) => boolean
  
  /**
   * 是否收集 measure
   */
  collectMeasures?: boolean
}

export class CustomMarkCollector {
  private options: Required<CustomMarkOptions>
  private marks: Map<string, PerformanceMark> = new Map()
  private measures: Map<string, PerformanceMeasure> = new Map()
  private observer: PerformanceObserver | null = null
  private onMetric?: (metric: PerformanceMetric) => void

  constructor(options: CustomMarkOptions = {}) {
    this.options = {
      autoCollect: options.autoCollect ?? true,
      markFilter: options.markFilter ?? (() => true),
      collectMeasures: options.collectMeasures ?? true,
    }
  }

  /**
   * 启动收集
   */
  start(callback: (metric: PerformanceMetric) => void): void {
    this.onMetric = callback

    if (!this.supportsPerformanceObserver()) {
      console.warn('[CustomMarkCollector] PerformanceObserver not supported')
      return
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'mark') {
            this.handleMark(entry as PerformanceMark)
          } else if (entry.entryType === 'measure') {
            this.handleMeasure(entry as PerformanceMeasure)
          }
        }
      })

      this.observer.observe({ 
        entryTypes: this.options.collectMeasures 
          ? ['mark', 'measure'] 
          : ['mark'] 
      })
    } catch (error) {
      console.error('[CustomMarkCollector] Failed to start observer:', error)
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
   * 创建性能标记
   */
  mark(name: string): void {
    if (typeof performance === 'undefined' || !performance.mark) {
      return
    }

    try {
      performance.mark(name)
    } catch (error) {
      console.error(`[CustomMarkCollector] Failed to create mark "${name}":`, error)
    }
  }

  /**
   * 创建性能测量
   */
  measure(name: string, startMark?: string, endMark?: string): number | null {
    if (typeof performance === 'undefined' || !performance.measure) {
      return null
    }

    try {
      const measure = performance.measure(name, startMark, endMark)
      return measure.duration
    } catch (error) {
      console.error(`[CustomMarkCollector] Failed to measure "${name}":`, error)
      return null
    }
  }

  /**
   * 清除标记
   */
  clearMarks(name?: string): void {
    if (typeof performance === 'undefined' || !performance.clearMarks) {
      return
    }

    performance.clearMarks(name)
    if (name) {
      this.marks.delete(name)
    } else {
      this.marks.clear()
    }
  }

  /**
   * 清除测量
   */
  clearMeasures(name?: string): void {
    if (typeof performance === 'undefined' || !performance.clearMeasures) {
      return
    }

    performance.clearMeasures(name)
    if (name) {
      this.measures.delete(name)
    } else {
      this.measures.clear()
    }
  }

  /**
   * 获取所有标记
   */
  getMarks(): PerformanceMark[] {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return []
    }

    return performance.getEntriesByType('mark') as PerformanceMark[]
  }

  /**
   * 获取所有测量
   */
  getMeasures(): PerformanceMeasure[] {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return []
    }

    return performance.getEntriesByType('measure') as PerformanceMeasure[]
  }

  /**
   * 处理标记
   */
  private handleMark(mark: PerformanceMark): void {
    if (!this.options.markFilter(mark.name)) {
      return
    }

    this.marks.set(mark.name, mark)

    if (this.options.autoCollect && this.onMetric) {
      this.onMetric({
        name: `mark:${mark.name}`,
        value: mark.startTime,
        unit: 'ms',
        rating: 'good',
      })
    }
  }

  /**
   * 处理测量
   */
  private handleMeasure(measure: PerformanceMeasure): void {
    this.measures.set(measure.name, measure)

    if (this.options.autoCollect && this.onMetric) {
      const rating = this.getRating(measure.duration)
      
      this.onMetric({
        name: `measure:${measure.name}`,
        value: measure.duration,
        unit: 'ms',
        rating,
        attribution: {
          startTime: measure.startTime,
          detail: measure.detail,
        },
      })
    }
  }

  /**
   * 获取评分
   */
  private getRating(duration: number): 'good' | 'needs-improvement' | 'poor' {
    if (duration < 100) return 'good'
    if (duration < 300) return 'needs-improvement'
    return 'poor'
  }

  /**
   * 检查是否支持 PerformanceObserver
   */
  private supportsPerformanceObserver(): boolean {
    return (
      typeof PerformanceObserver !== 'undefined' &&
      typeof PerformanceObserver.supportedEntryTypes !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes.includes('mark')
    )
  }
}
