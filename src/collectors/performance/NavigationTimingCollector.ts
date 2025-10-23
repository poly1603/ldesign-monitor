/**
 * 导航性能收集器
 * 收集页面导航相关的性能指标（DNS、TCP、请求、响应等）
 */

import type { NavigationTiming } from '../../types/performance'

/**
 * 导航性能收集器类
 */
export class NavigationTimingCollector {
  /**
   * 收集导航性能数据
   * 
   * @returns 导航性能指标
   */
  collect(): NavigationTiming | null {
    // 检查 Performance API 是否可用
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      console.warn('[NavigationTimingCollector] Performance API not supported')
      return null
    }

    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]

    if (navigationEntries.length === 0) {
      // 降级到旧的 performance.timing API
      return this.collectFromLegacyAPI()
    }

    const navigation = navigationEntries[0]

    return this.parseNavigationTiming(navigation)
  }

  /**
   * 解析导航性能数据
   * 
   * @param navigation - 导航性能条目
   * @returns 导航性能指标
   */
  private parseNavigationTiming(navigation: PerformanceNavigationTiming): NavigationTiming {
    const {
      domainLookupStart,
      domainLookupEnd,
      connectStart,
      connectEnd,
      secureConnectionStart,
      requestStart,
      responseStart,
      responseEnd,
      domInteractive,
      domContentLoadedEventEnd,
      loadEventEnd,
      fetchStart,
    } = navigation

    return {
      // DNS 解析耗时
      dns: domainLookupEnd - domainLookupStart,

      // TCP 连接耗时
      tcp: connectEnd - connectStart,

      // SSL 握手耗时
      ssl: secureConnectionStart > 0 ? connectEnd - secureConnectionStart : 0,

      // 请求耗时（发送请求到开始接收响应）
      request: responseStart - requestStart,

      // 响应耗时（接收响应数据）
      response: responseEnd - responseStart,

      // DOM 解析耗时
      domParse: domInteractive - responseEnd,

      // 资源加载耗时
      resourceLoad: loadEventEnd - domContentLoadedEventEnd,

      // DOM Content Loaded 时间
      domContentLoaded: domContentLoadedEventEnd - fetchStart,

      // 页面完全加载时间
      loadComplete: loadEventEnd - fetchStart,

      // 首字节时间（TTFB）
      ttfb: responseStart - fetchStart,

      // 白屏时间（如果有 paint timing）
      firstPaint: this.getFirstPaint(),

      // 首次内容绘制时间（FCP）
      firstContentfulPaint: this.getFirstContentfulPaint(),
    }
  }

  /**
   * 从旧的 Performance Timing API 收集数据
   * 
   * @returns 导航性能指标
   */
  private collectFromLegacyAPI(): NavigationTiming | null {
    const timing = (performance as any).timing

    if (!timing) {
      return null
    }

    const {
      domainLookupStart,
      domainLookupEnd,
      connectStart,
      connectEnd,
      secureConnectionStart,
      requestStart,
      responseStart,
      responseEnd,
      domInteractive,
      domContentLoadedEventEnd,
      loadEventEnd,
      fetchStart,
    } = timing

    return {
      dns: domainLookupEnd - domainLookupStart,
      tcp: connectEnd - connectStart,
      ssl: secureConnectionStart > 0 ? connectEnd - secureConnectionStart : 0,
      request: responseStart - requestStart,
      response: responseEnd - responseStart,
      domParse: domInteractive - responseEnd,
      resourceLoad: loadEventEnd - domContentLoadedEventEnd,
      domContentLoaded: domContentLoadedEventEnd - fetchStart,
      loadComplete: loadEventEnd - fetchStart,
      ttfb: responseStart - fetchStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
    }
  }

  /**
   * 获取首次绘制时间
   * 
   * @returns 首次绘制时间（毫秒）
   */
  private getFirstPaint(): number {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return 0
    }

    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')

    return firstPaint ? firstPaint.startTime : 0
  }

  /**
   * 获取首次内容绘制时间
   * 
   * @returns 首次内容绘制时间（毫秒）
   */
  private getFirstContentfulPaint(): number {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return 0
    }

    const paintEntries = performance.getEntriesByType('paint')
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')

    return firstContentfulPaint ? firstContentfulPaint.startTime : 0
  }

  /**
   * 等待页面完全加载后收集数据
   * 
   * @returns Promise 包含导航性能指标
   */
  async collectWhenReady(): Promise<NavigationTiming | null> {
    // 如果页面已经加载完成，直接收集
    if (document.readyState === 'complete') {
      return this.collect()
    }

    // 否则等待 load 事件
    return new Promise((resolve) => {
      window.addEventListener('load', () => {
        // 稍微延迟以确保所有性能数据都已记录
        setTimeout(() => {
          resolve(this.collect())
        }, 0)
      }, { once: true })
    })
  }
}

/**
 * 创建导航性能收集器实例
 * 
 * @returns 导航性能收集器实例
 */
export function createNavigationTimingCollector(): NavigationTimingCollector {
  return new NavigationTimingCollector()
}

