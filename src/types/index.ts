/**
 * @ldesign/monitor - 核心类型定义
 * 
 * 本文件包含监控系统的所有核心类型定义
 */

/**
 * 监控配置接口
 */
export interface MonitorConfig {
  /**
   * 数据上报的 DSN（Data Source Name）
   * 格式：https://your-endpoint.com/api/monitor
   */
  dsn: string

  /**
   * 项目 ID
   */
  projectId: string

  /**
   * 环境标识
   * @default 'production'
   */
  environment?: 'development' | 'production' | 'staging' | string

  /**
   * 采样率（0-1）
   * @default 1.0
   */
  sampleRate?: number

  /**
   * 是否启用性能监控
   * @default true
   */
  enablePerformance?: boolean

  /**
   * 是否启用错误追踪
   * @default true
   */
  enableError?: boolean

  /**
   * 是否启用用户行为追踪
   * @default true
   */
  enableBehavior?: boolean

  /**
   * 是否启用 API 监控
   * @default true
   */
  enableAPI?: boolean

  /**
   * 是否启用会话回放
   * @default false
   */
  enableReplay?: boolean

  /**
   * 批量上报配置
   */
  batch?: {
    /**
     * 批量大小
     * @default 10
     */
    size?: number

    /**
     * 批量间隔（毫秒）
     * @default 5000
     */
    interval?: number
  }

  /**
   * 重试配置
   */
  retry?: {
    /**
     * 最大重试次数
     * @default 3
     */
    maxRetries?: number

    /**
     * 重试延迟（毫秒）
     * @default 1000
     */
    delay?: number
  }

  /**
   * 是否在控制台输出调试信息
   * @default false
   */
  debug?: boolean

  /**
   * 自定义钩子
   */
  hooks: {
    /**
     * 数据发送前的钩子
     */
    beforeSend?: (data: ReportData) => ReportData | null

    /**
     * 错误捕获后的钩子
     */
    afterError?: (error: ErrorInfo) => void

    /**
     * 性能数据收集后的钩子
     */
    afterPerformance?: (metric: PerformanceMetric) => void
  }
}

/**
 * 上报数据接口
 */
export interface ReportData {
  /**
   * 数据类型
   */
  type: 'performance' | 'error' | 'behavior' | 'api'

  /**
   * 数据内容
   */
  data: unknown

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 用户信息
   */
  user?: UserInfo

  /**
   * 会话信息
   */
  session?: SessionInfo

  /**
   * 设备信息
   */
  device?: DeviceInfo

  /**
   * 上下文信息
   */
  context?: ContextInfo
}

/**
 * 用户信息接口
 */
export interface UserInfo {
  /**
   * 用户 ID
   */
  id?: string

  /**
   * 用户名
   */
  name?: string

  /**
   * 邮箱
   */
  email?: string

  /**
   * 自定义属性
   */
  attributes?: Record<string, unknown>
}

/**
 * 会话信息接口
 */
export interface SessionInfo {
  /**
   * 会话 ID
   */
  id: string

  /**
   * 会话开始时间
   */
  startTime: number

  /**
   * 会话时长（毫秒）
   */
  duration?: number

  /**
   * 页面浏览数
   */
  pageViews?: number
}

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  /**
   * 操作系统
   */
  os?: string

  /**
   * 操作系统版本
   */
  osVersion?: string

  /**
   * 浏览器
   */
  browser?: string

  /**
   * 浏览器版本
   */
  browserVersion?: string

  /**
   * 设备类型
   */
  deviceType?: 'mobile' | 'tablet' | 'desktop'

  /**
   * 屏幕分辨率
   */
  screenResolution?: string

  /**
   * 视口大小
   */
  viewportSize?: string

  /**
   * User Agent
   */
  userAgent?: string

  /**
   * 网络类型
   */
  networkType?: string

  /**
   * 语言
   */
  language?: string
}

/**
 * 上下文信息接口
 */
export interface ContextInfo {
  /**
   * 当前页面 URL
   */
  url?: string

  /**
   * 页面标题
   */
  title?: string

  /**
   * 来源页面
   */
  referrer?: string

  /**
   * 自定义标签
   */
  tags?: Record<string, string>

  /**
   * 额外数据
   */
  extra?: Record<string, unknown>
}

/**
 * 性能指标接口
 */
export interface PerformanceMetric {
  /**
   * 指标名称
   */
  name: string

  /**
   * 指标值
   */
  value: number

  /**
   * 指标单位
   */
  unit?: string

  /**
   * 评分（good/needs-improvement/poor）
   */
  rating?: 'good' | 'needs-improvement' | 'poor'

  /**
   * 归因信息
   */
  attribution?: Record<string, unknown>
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  /**
   * 错误消息
   */
  message: string

  /**
   * 错误类型
   */
  type: string

  /**
   * 错误堆栈
   */
  stack?: string

  /**
   * 错误级别
   */
  level: 'fatal' | 'error' | 'warning' | 'info'

  /**
   * 解析后的堆栈帧
   */
  stackFrames?: StackFrame[]

  /**
   * 错误指纹（用于去重）
   */
  fingerprint?: string

  /**
   * 面包屑（错误前的操作记录）
   */
  breadcrumbs?: Breadcrumb[]

  /**
   * 错误发生的文件
   */
  filename?: string

  /**
   * 错误发生的行号
   */
  lineno?: number

  /**
   * 错误发生的列号
   */
  colno?: number
}

/**
 * 堆栈帧接口
 */
export interface StackFrame {
  /**
   * 函数名
   */
  functionName?: string

  /**
   * 文件名
   */
  filename: string

  /**
   * 行号
   */
  lineno: number

  /**
   * 列号
   */
  colno: number

  /**
   * 源代码片段
   */
  context?: string[]
}

/**
 * 面包屑接口
 */
export interface Breadcrumb {
  /**
   * 类型
   */
  type: 'navigation' | 'click' | 'console' | 'xhr' | 'fetch' | 'custom'

  /**
   * 消息
   */
  message: string

  /**
   * 级别
   */
  level?: 'info' | 'warning' | 'error'

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 数据
   */
  data?: Record<string, unknown>
}

/**
 * 事件追踪接口
 */
export interface TrackEvent {
  /**
   * 事件名称
   */
  name: string

  /**
   * 事件属性
   */
  properties?: Record<string, unknown>

  /**
   * 时间戳
   */
  timestamp: number
}

/**
 * 监控器接口
 */
export interface IMonitor {
  /**
   * 初始化监控器
   */
  init(config: MonitorConfig): void

  /**
   * 追踪性能指标
   */
  trackPerformance(metric: string, value: number): void

  /**
   * 追踪错误
   */
  trackError(error: Error, context?: Record<string, unknown>): void

  /**
   * 追踪事件
   */
  trackEvent(name: string, properties?: Record<string, unknown>): void

  /**
   * 追踪页面浏览
   */
  trackPageView(page: string): void

  /**
   * 设置用户信息
   */
  setUser(user: UserInfo): void

  /**
   * 设置上下文
   */
  setContext(context: Record<string, unknown>): void

  /**
   * 添加面包屑
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void

  /**
   * 启用监控
   */
  enable(): void

  /**
   * 禁用监控
   */
  disable(): void
}

