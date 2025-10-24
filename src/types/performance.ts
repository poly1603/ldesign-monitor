/**
 * 性能监控类型定义
 */

import type { PerformanceMetric } from './index'

/**
 * Web Vitals 指标
 */
export interface WebVitalsMetric extends PerformanceMetric {
  /**
   * 指标 ID
   */
  id: string

  /**
   * 导航类型
   */
  navigationType?: 'navigate' | 'reload' | 'back-forward' | 'prerender'

  /**
   * Delta 值
   */
  delta?: number
}

/**
 * 导航时序
 */
export interface NavigationTiming {
  /**
   * DNS 查询时间
   */
  dns: number

  /**
   * TCP 连接时间
   */
  tcp: number

  /**
   * TLS 握手时间
   */
  tls?: number

  /**
   * 请求时间
   */
  request: number

  /**
   * 响应时间
   */
  response: number

  /**
   * DOM 处理时间
   */
  domProcessing: number

  /**
   * 总加载时间
   */
  totalLoad: number
}

/**
 * 资源时序
 */
export interface ResourceTiming {
  /**
   * 资源 URL
   */
  url: string

  /**
   * 资源类型
   */
  type: string

  /**
   * 加载时长
   */
  duration: number

  /**
   * 资源大小
   */
  size: number

  /**
   * 协议
   */
  protocol?: string
}





