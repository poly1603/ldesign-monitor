/**
 * @ldesign/monitor - 自定义错误类
 * @packageDocumentation
 */

/**
 * Monitor 基础错误类
 * 所有 Monitor 相关错误的基类
 */
export class MonitorError extends Error {
  /** 错误代码 */
  readonly code: string
  /** 错误发生时间 */
  readonly timestamp: number
  /** 额外的上下文信息 */
  readonly context?: Record<string, unknown>

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message)
    this.name = 'MonitorError'
    this.code = code
    this.timestamp = Date.now()
    this.context = context

    // 维护正确的原型链
    Object.setPrototypeOf(this, MonitorError.prototype)
  }

  /**
   * 转换为 JSON 对象
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    }
  }
}

/**
 * 配置验证错误
 * 当配置验证失败时抛出
 */
export class ConfigValidationError extends MonitorError {
  /** 无效的配置字段 */
  readonly field?: string
  /** 期望的值类型或范围 */
  readonly expected?: string
  /** 实际接收到的值 */
  readonly received?: unknown

  constructor(
    message: string,
    field?: string,
    expected?: string,
    received?: unknown
  ) {
    super(message, 'CONFIG_VALIDATION_ERROR', { field, expected, received })
    this.name = 'ConfigValidationError'
    this.field = field
    this.expected = expected
    this.received = received
    Object.setPrototypeOf(this, ConfigValidationError.prototype)
  }
}

/**
 * 网络错误
 * 当网络请求失败时抛出
 */
export class NetworkError extends MonitorError {
  /** HTTP 状态码 */
  readonly statusCode?: number
  /** 请求 URL */
  readonly url?: string
  /** 请求方法 */
  readonly method?: string
  /** 是否可重试 */
  readonly retryable: boolean

  constructor(
    message: string,
    options: {
      statusCode?: number
      url?: string
      method?: string
      retryable?: boolean
    } = {}
  ) {
    super(message, 'NETWORK_ERROR', options)
    this.name = 'NetworkError'
    this.statusCode = options.statusCode
    this.url = options.url
    this.method = options.method
    this.retryable = options.retryable ?? this.isRetryable(options.statusCode)
    Object.setPrototypeOf(this, NetworkError.prototype)
  }

  /**
   * 判断是否可重试
   */
  private isRetryable(statusCode?: number): boolean {
    if (!statusCode) return true
    // 5xx 错误和部分 4xx 错误可重试
    return statusCode >= 500 || statusCode === 408 || statusCode === 429
  }
}

/**
 * 超时错误
 * 当操作超时时抛出
 */
export class TimeoutError extends MonitorError {
  /** 超时时间（毫秒） */
  readonly timeout: number
  /** 操作名称 */
  readonly operation?: string

  constructor(message: string, timeout: number, operation?: string) {
    super(message, 'TIMEOUT_ERROR', { timeout, operation })
    this.name = 'TimeoutError'
    this.timeout = timeout
    this.operation = operation
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

/**
 * 初始化错误
 * 当 Monitor 初始化失败时抛出
 */
export class InitializationError extends MonitorError {
  /** 初始化阶段 */
  readonly phase?: string

  constructor(message: string, phase?: string) {
    super(message, 'INITIALIZATION_ERROR', { phase })
    this.name = 'InitializationError'
    this.phase = phase
    Object.setPrototypeOf(this, InitializationError.prototype)
  }
}

/**
 * 插件错误
 * 当插件加载或执行失败时抛出
 */
export class PluginError extends MonitorError {
  /** 插件名称 */
  readonly pluginName: string
  /** 原始错误 */
  readonly originalError?: Error

  constructor(message: string, pluginName: string, originalError?: Error) {
    super(message, 'PLUGIN_ERROR', {
      pluginName,
      originalError: originalError?.message,
    })
    this.name = 'PluginError'
    this.pluginName = pluginName
    this.originalError = originalError
    Object.setPrototypeOf(this, PluginError.prototype)
  }
}

/**
 * 存储错误
 * 当存储操作失败时抛出
 */
export class StorageError extends MonitorError {
  /** 存储类型 */
  readonly storageType: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory'
  /** 操作类型 */
  readonly operation: 'read' | 'write' | 'delete' | 'clear'

  constructor(
    message: string,
    storageType: StorageError['storageType'],
    operation: StorageError['operation']
  ) {
    super(message, 'STORAGE_ERROR', { storageType, operation })
    this.name = 'StorageError'
    this.storageType = storageType
    this.operation = operation
    Object.setPrototypeOf(this, StorageError.prototype)
  }
}

/**
 * 限流错误
 * 当请求被限流时抛出
 */
export class RateLimitError extends MonitorError {
  /** 重试等待时间（毫秒） */
  readonly retryAfter?: number
  /** 当前限制 */
  readonly limit?: number
  /** 剩余配额 */
  readonly remaining?: number

  constructor(
    message: string,
    options: {
      retryAfter?: number
      limit?: number
      remaining?: number
    } = {}
  ) {
    super(message, 'RATE_LIMIT_ERROR', options)
    this.name = 'RateLimitError'
    this.retryAfter = options.retryAfter
    this.limit = options.limit
    this.remaining = options.remaining
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

/**
 * 断路器打开错误
 * 当断路器处于打开状态时抛出
 */
export class CircuitBreakerOpenError extends MonitorError {
  /** 下次重试时间 */
  readonly nextRetryTime: number

  constructor(message: string, nextRetryTime: number) {
    super(message, 'CIRCUIT_BREAKER_OPEN', { nextRetryTime })
    this.name = 'CircuitBreakerOpenError'
    this.nextRetryTime = nextRetryTime
    Object.setPrototypeOf(this, CircuitBreakerOpenError.prototype)
  }
}

/**
 * 数据验证错误
 * 当数据验证失败时抛出
 */
export class DataValidationError extends MonitorError {
  /** 验证失败的字段 */
  readonly fields: string[]
  /** 详细的验证错误 */
  readonly validationErrors: Array<{
    field: string
    message: string
    value?: unknown
  }>

  constructor(
    message: string,
    validationErrors: DataValidationError['validationErrors']
  ) {
    super(message, 'DATA_VALIDATION_ERROR', { validationErrors })
    this.name = 'DataValidationError'
    this.validationErrors = validationErrors
    this.fields = validationErrors.map((e) => e.field)
    Object.setPrototypeOf(this, DataValidationError.prototype)
  }
}

/**
 * 功能不支持错误
 * 当浏览器不支持某功能时抛出
 */
export class FeatureNotSupportedError extends MonitorError {
  /** 不支持的功能名称 */
  readonly feature: string
  /** 备选方案 */
  readonly fallback?: string

  constructor(feature: string, fallback?: string) {
    super(`Feature "${feature}" is not supported in this environment`, 'FEATURE_NOT_SUPPORTED', {
      feature,
      fallback,
    })
    this.name = 'FeatureNotSupportedError'
    this.feature = feature
    this.fallback = fallback
    Object.setPrototypeOf(this, FeatureNotSupportedError.prototype)
  }
}

/**
 * 判断错误是否为 MonitorError
 */
export function isMonitorError(error: unknown): error is MonitorError {
  return error instanceof MonitorError
}

/**
 * 将未知错误转换为 MonitorError
 */
export function toMonitorError(error: unknown): MonitorError {
  if (isMonitorError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new MonitorError(error.message, 'UNKNOWN_ERROR', {
      originalName: error.name,
      originalStack: error.stack,
    })
  }

  return new MonitorError(String(error), 'UNKNOWN_ERROR')
}
