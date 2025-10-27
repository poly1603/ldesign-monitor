/**
 * @ldesign/monitor - Monitor 核心类
 */

import type {
  MonitorConfig,
  ReportData,
  UserInfo,
  PerformanceMetric,
  ErrorInfo,
  Breadcrumb,
  IMonitor,
} from '../types'
import { EventEmitter } from './EventEmitter'
import { generateId, now } from '../utils'
import { ConfigValidator } from '../config/ConfigValidator'

/**
 * Monitor 核心类
 */
export class Monitor extends EventEmitter implements IMonitor {
  private config: Required<MonitorConfig>
  private userId?: string
  private sessionId: string
  private sessionStartTime: number
  private breadcrumbs: Breadcrumb[] = []
  private initialized = false
  private enabled = true

  constructor(config: MonitorConfig) {
    super()

    // 合并默认配置
    this.config = this.normalizeConfig(config)

    // 初始化会话
    this.sessionId = generateId()
    this.sessionStartTime = now()
  }

  /**
   * 初始化监控器
   */
  init(config?: MonitorConfig): void {
    if (this.initialized) {
      console.warn('[Monitor] Already initialized')
      return
    }

    if (config) {
      this.config = this.normalizeConfig(config)
    }

    this.initialized = true
    this.emit('init', this.config)

    if (this.config.debug) {
      console.log('[Monitor] Initialized', {
        projectId: this.config.projectId,
        environment: this.config.environment,
        sessionId: this.sessionId,
      })
    }
  }

  /**
   * 追踪性能指标
   */
  trackPerformance(metric: string, value: number): void {
    if (!this.shouldTrack()) return

    const data: ReportData = {
      type: 'performance',
      data: {
        name: metric,
        value,
        timestamp: now(),
      },
      timestamp: now(),
      session: this.getSessionInfo(),
      context: this.getContextInfo(),
    }

    this.report(data)
    this.emit('performance', data)

    if (this.config.hooks?.afterPerformance) {
      this.config.hooks.afterPerformance(data.data as PerformanceMetric)
    }
  }

  /**
   * 追踪错误
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    if (!this.shouldTrack()) return

    const errorInfo: ErrorInfo = {
      message: error.message,
      type: error.name,
      stack: error.stack,
      level: 'error',
      breadcrumbs: [...this.breadcrumbs],
      ...context,
    }

    const data: ReportData = {
      type: 'error',
      data: errorInfo,
      timestamp: now(),
      session: this.getSessionInfo(),
      context: this.getContextInfo(),
    }

    this.report(data)
    this.emit('error', data)

    if (this.config.hooks?.afterError) {
      this.config.hooks.afterError(errorInfo)
    }
  }

  /**
   * 追踪事件
   */
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (!this.shouldTrack()) return

    const data: ReportData = {
      type: 'behavior',
      data: {
        name,
        properties,
        timestamp: now(),
      },
      timestamp: now(),
      session: this.getSessionInfo(),
      context: this.getContextInfo(),
    }

    this.report(data)
    this.emit('event', data)
  }

  /**
   * 追踪页面浏览
   */
  trackPageView(page: string): void {
    this.trackEvent('pageview', { page })
    this.addBreadcrumb({
      type: 'navigation',
      message: `Navigate to ${page}`,
      timestamp: now(),
    })
  }

  /**
   * 设置用户信息
   */
  setUser(user: UserInfo): void {
    this.userId = user.id
    this.emit('user', user)
  }

  /**
   * 设置上下文
   */
  setContext(context: Record<string, unknown>): void {
    this.emit('context', context)
  }

  /**
   * 添加面包屑
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb)

    // 限制面包屑数量
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift()
    }

    this.emit('breadcrumb', breadcrumb)
  }

  /**
   * 启用监控
   */
  enable(): void {
    this.enabled = true
    this.emit('enable')
  }

  /**
   * 禁用监控
   */
  disable(): void {
    this.enabled = false
    this.emit('disable')
  }

  /**
   * 获取配置
   */
  getConfig(): Required<MonitorConfig> {
    return { ...this.config }
  }

  /**
   * 归一化配置
   */
  private normalizeConfig(config: MonitorConfig): Required<MonitorConfig> {
    // 使用配置验证器验证和规范化配置
    return ConfigValidator.normalize(config)
  }

  /**
   * 检查是否应该追踪
   */
  private shouldTrack(): boolean {
    if (!this.initialized) {
      console.warn('[Monitor] Not initialized')
      return false
    }

    if (!this.enabled) {
      return false
    }

    // 采样检查
    if (Math.random() > this.config.sampleRate) {
      return false
    }

    return true
  }

  /**
   * 上报数据
   */
  private report(data: ReportData): void {
    // 应用 beforeSend hook
    if (this.config.hooks?.beforeSend) {
      const modified = this.config.hooks.beforeSend(data)
      if (!modified) {
        return // 被 hook 拦截
      }
      data = modified
    }

    this.emit('report', data)

    if (this.config.debug) {
      console.log('[Monitor] Report:', data)
    }
  }

  /**
   * 获取会话ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * 获取用户信息
   */
  getUser(): UserInfo | undefined {
    if (!this.userId) {
      return undefined
    }
    return { id: this.userId }
  }

  /**
   * 获取上下文
   */
  getContext() {
    return this.getContextInfo()
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo() {
    return import('../utils').then(utils => utils.getDeviceInfo())
  }

  /**
   * 销毁监控器
   * 清理所有资源，防止内存泄漏
   */
  destroy(): void {
    this.enabled = false
    this.breadcrumbs = []

    // 清理所有事件监听器
    this.removeAllListeners()

    this.emit('destroy')

    if (this.config.debug) {
      console.log('[Monitor] Destroyed')
    }
  }

  /**
   * 获取会话信息
   */
  private getSessionInfo() {
    return {
      id: this.sessionId,
      startTime: this.sessionStartTime,
      duration: now() - this.sessionStartTime,
    }
  }

  /**
   * 获取上下文信息
   */
  private getContextInfo() {
    return {
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      title: typeof document !== 'undefined' ? document.title : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    }
  }
}

/**
 * 创建 Monitor 实例
 */
export function createMonitor(config: MonitorConfig): Monitor {
  return new Monitor(config)
}




















