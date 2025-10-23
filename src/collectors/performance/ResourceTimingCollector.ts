/**
 * 资源性能收集器
 * 收集页面资源加载的性能数据
 */

import type { ResourceTiming } from '../../types/performance'

/**
 * 资源性能收集器配置
 */
export interface ResourceTimingCollectorConfig {
  /**
   * 是否收集所有资源
   * @default false
   */
  collectAll?: boolean

  /**
   * 资源类型过滤（如果为空则收集所有类型）
   */
  resourceTypes?: string[]

  /**
   * 最大收集数量
   * @default 100
   */
  maxCount?: number

  /**
   * 最小持续时间阈值（毫秒），小于此值的资源不收集
   * @default 0
   */
  minDuration?: number
}

/**
 * 资源性能收集器类
 */
export class ResourceTimingCollector {
  /**
   * 配置
   */
  private config: Required<ResourceTimingCollectorConfig>

  /**
   * PerformanceObserver 实例
   */
  private observer: PerformanceObserver | null = null

  /**
   * 收集到的资源
   */
  private resources: ResourceTiming[] = []

  /**
   * 回调函数列表
   */
  private callbacks: Set<(resource: ResourceTiming) => void> = new Set()

  constructor(config: ResourceTimingCollectorConfig = {}) {
    this.config = {
      collectAll: config.collectAll ?? false,
      resourceTypes: config.resourceTypes ?? [],
      maxCount: config.maxCount ?? 100,
      minDuration: config.minDuration ?? 0,
    }
  }

  /**
   * 启动收集
   * 
   * @param callback - 资源收集回调
   */
  start(callback?: (resource: ResourceTiming) => void): void {
    if (callback) {
      this.callbacks.add(callback)
    }

    // 检查 PerformanceObserver 是否可用
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('[ResourceTimingCollector] PerformanceObserver not supported')
      return
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[]
        entries.forEach((entry) => {
          this.handleResourceEntry(entry)
        })
      })

      this.observer.observe({ entryTypes: ['resource'] })
    }
    catch (error) {
      console.error('[ResourceTimingCollector] Failed to start observer:', error)
    }
  }

  /**
   * 处理资源条目
   * 
   * @param entry - 性能资源条目
   */
  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    // 过滤资源类型
    if (this.config.resourceTypes.length > 0 && !this.config.resourceTypes.includes(entry.initiatorType)) {
      return
    }

    // 过滤持续时间
    if (entry.duration < this.config.minDuration) {
      return
    }

    const resource = this.parseResourceTiming(entry)

    // 限制收集数量
    if (this.resources.length >= this.config.maxCount) {
      if (!this.config.collectAll) {
        return
      }
      // 移除最旧的资源
      this.resources.shift()
    }

    this.resources.push(resource)

    // 调用回调
    this.callbacks.forEach((callback) => {
      try {
        callback(resource)
      }
      catch (error) {
        console.error('[ResourceTimingCollector] Error in callback:', error)
      }
    })
  }

  /**
   * 解析资源性能数据
   * 
   * @param entry - 性能资源条目
   * @returns 资源性能指标
   */
  private parseResourceTiming(entry: PerformanceResourceTiming): ResourceTiming {
    const {
      name,
      initiatorType,
      startTime,
      duration,
      transferSize,
      encodedBodySize,
      decodedBodySize,
      domainLookupStart,
      domainLookupEnd,
      connectStart,
      connectEnd,
      requestStart,
      responseStart,
      responseEnd,
      nextHopProtocol,
    } = entry

    return {
      name,
      initiatorType,
      startTime,
      duration,
      transferSize,
      encodedBodySize,
      decodedBodySize,
      dnsTime: domainLookupEnd - domainLookupStart,
      tcpTime: connectEnd - connectStart,
      requestTime: responseStart - requestStart,
      responseTime: responseEnd - responseStart,
      cached: transferSize === 0 && encodedBodySize > 0,
      protocol: nextHopProtocol,
    }
  }

  /**
   * 收集当前所有资源
   * 
   * @returns 资源列表
   */
  collectAll(): ResourceTiming[] {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return []
    }

    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    return entries
      .filter((entry) => {
        // 过滤资源类型
        if (this.config.resourceTypes.length > 0 && !this.config.resourceTypes.includes(entry.initiatorType)) {
          return false
        }
        // 过滤持续时间
        if (entry.duration < this.config.minDuration) {
          return false
        }
        return true
      })
      .slice(0, this.config.maxCount)
      .map(entry => this.parseResourceTiming(entry))
  }

  /**
   * 获取慢资源（超过阈值）
   * 
   * @param threshold - 阈值（毫秒）
   * @returns 慢资源列表
   */
  getSlowResources(threshold = 1000): ResourceTiming[] {
    return this.resources.filter(resource => resource.duration > threshold)
  }

  /**
   * 获取按类型分组的资源
   * 
   * @returns 分组的资源
   */
  getResourcesByType(): Record<string, ResourceTiming[]> {
    const grouped: Record<string, ResourceTiming[]> = {}

    this.resources.forEach((resource) => {
      const type = resource.initiatorType
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(resource)
    })

    return grouped
  }

  /**
   * 获取资源统计
   * 
   * @returns 统计信息
   */
  getStats(): {
    total: number
    byType: Record<string, number>
    totalSize: number
    totalDuration: number
    avgDuration: number
    cached: number
  } {
    const byType: Record<string, number> = {}
    let totalSize = 0
    let totalDuration = 0
    let cached = 0

    this.resources.forEach((resource) => {
      const type = resource.initiatorType
      byType[type] = (byType[type] || 0) + 1
      totalSize += resource.transferSize
      totalDuration += resource.duration
      if (resource.cached) {
        cached++
      }
    })

    return {
      total: this.resources.length,
      byType,
      totalSize,
      totalDuration,
      avgDuration: this.resources.length > 0 ? totalDuration / this.resources.length : 0,
      cached,
    }
  }

  /**
   * 清空收集的资源
   */
  clear(): void {
    this.resources = []
  }

  /**
   * 停止收集
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.callbacks.clear()
  }

  /**
   * 获取所有收集的资源
   * 
   * @returns 资源列表
   */
  getResources(): ResourceTiming[] {
    return [...this.resources]
  }
}

/**
 * 创建资源性能收集器实例
 * 
 * @param config - 配置
 * @returns 资源性能收集器实例
 */
export function createResourceTimingCollector(config?: ResourceTimingCollectorConfig): ResourceTimingCollector {
  return new ResourceTimingCollector(config)
}

