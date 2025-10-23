/**
 * Web Vitals 收集器
 * 集成 web-vitals 库，收集核心 Web Vitals 指标
 */

import type { Metric, ReportCallback } from 'web-vitals'
import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from 'web-vitals'
import type { PerformanceMetric, WebVitalsMetric } from '../../types/performance'

/**
 * Web Vitals 收集器类
 */
export class WebVitalsCollector {
  /**
   * 是否已启动
   */
  private started = false

  /**
   * 收集到的指标
   */
  private metrics: Map<string, WebVitalsMetric> = new Map()

  /**
   * 回调函数列表
   */
  private callbacks: Set<(metric: PerformanceMetric) => void> = new Set()

  /**
   * 启动收集
   * 
   * @param callback - 指标收集回调
   */
  start(callback?: (metric: PerformanceMetric) => void): void {
    if (this.started) {
      console.warn('[WebVitalsCollector] Already started')
      return
    }

    if (callback) {
      this.callbacks.add(callback)
    }

    this.started = true

    // 创建通用的报告回调
    const reportCallback: ReportCallback = (metric: Metric) => {
      this.handleMetric(metric)
    }

    // 收集所有 Web Vitals 指标
    onFCP(reportCallback)
    onLCP(reportCallback)
    onFID(reportCallback)
    onINP(reportCallback)
    onCLS(reportCallback)
    onTTFB(reportCallback)
  }

  /**
   * 处理指标
   * 
   * @param metric - Web Vitals 指标
   */
  private handleMetric(metric: Metric): void {
    // 转换为内部格式
    const webVitalsMetric: WebVitalsMetric = {
      name: metric.name as any,
      value: metric.value,
      id: metric.id,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType as any,
      attribution: metric.attribution as any,
    }

    // 保存指标
    this.metrics.set(metric.name, webVitalsMetric)

    // 转换为通用性能指标格式
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      unit: this.getUnit(metric.name),
      rating: metric.rating,
      attribution: metric.attribution as any,
    }

    // 调用所有回调
    this.callbacks.forEach((callback) => {
      try {
        callback(performanceMetric)
      }
      catch (error) {
        console.error('[WebVitalsCollector] Error in callback:', error)
      }
    })
  }

  /**
   * 获取指标单位
   * 
   * @param name - 指标名称
   * @returns 单位
   */
  private getUnit(name: string): string {
    switch (name) {
      case 'CLS':
        return '' // CLS 无单位
      case 'FCP':
      case 'LCP':
      case 'FID':
      case 'INP':
      case 'TTFB':
        return 'ms'
      default:
        return ''
    }
  }

  /**
   * 添加回调
   * 
   * @param callback - 回调函数
   * @returns 取消回调的函数
   */
  onMetric(callback: (metric: PerformanceMetric) => void): () => void {
    this.callbacks.add(callback)

    // 如果已经收集到指标，立即调用回调
    this.metrics.forEach((metric) => {
      callback({
        name: metric.name,
        value: metric.value,
        unit: this.getUnit(metric.name),
        rating: metric.rating,
        attribution: metric.attribution as any,
      })
    })

    // 返回取消回调的函数
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * 获取指定指标
   * 
   * @param name - 指标名称
   * @returns 指标数据
   */
  getMetric(name: string): WebVitalsMetric | undefined {
    return this.metrics.get(name)
  }

  /**
   * 获取所有指标
   * 
   * @returns 所有指标
   */
  getAllMetrics(): WebVitalsMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * 停止收集
   */
  stop(): void {
    this.started = false
    this.callbacks.clear()
  }

  /**
   * 重置收集器
   */
  reset(): void {
    this.metrics.clear()
    this.callbacks.clear()
    this.started = false
  }
}

/**
 * 创建 Web Vitals 收集器实例
 * 
 * @returns Web Vitals 收集器实例
 */
export function createWebVitalsCollector(): WebVitalsCollector {
  return new WebVitalsCollector()
}

