/**
 * @ldesign/monitor - 错误处理工具
 * 
 * 提供统一的错误处理、降级方案和错误恢复机制
 */

/**
 * 错误级别
 */
export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * 错误上下文
 */
export interface ErrorContext {
  /**
   * 错误发生的模块
   */
  module?: string

  /**
   * 错误发生的函数
   */
  function?: string

  /**
   * 额外的上下文信息
   */
  extra?: Record<string, unknown>
}

/**
 * 错误处理器选项
 */
export interface ErrorHandlerOptions {
  /**
   * 是否在控制台输出错误
   * @default true
   */
  logToConsole?: boolean

  /**
   * 错误回调函数
   */
  onError?: (error: Error, context?: ErrorContext) => void

  /**
   * 是否重新抛出错误
   * @default false
   */
  rethrow?: boolean
}

/**
 * 全局错误处理器
 */
class GlobalErrorHandler {
  private options: Required<ErrorHandlerOptions>
  private errorCount: Map<string, number> = new Map()
  private readonly MAX_ERROR_COUNT = 10

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      logToConsole: options.logToConsole ?? true,
      onError: options.onError ?? (() => { }),
      rethrow: options.rethrow ?? false,
    }
  }

  /**
   * 处理错误
   * 
   * @param error - 错误对象
   * @param context - 错误上下文
   * @param level - 错误级别
   */
  handle(error: Error, context?: ErrorContext, level: ErrorLevel = ErrorLevel.ERROR): void {
    // 生成错误 key（用于去重和计数）
    const errorKey = this.getErrorKey(error, context)

    // 更新错误计数
    const count = (this.errorCount.get(errorKey) || 0) + 1
    this.errorCount.set(errorKey, count)

    // 如果错误频繁出现，降级处理
    if (count > this.MAX_ERROR_COUNT) {
      if (this.options.logToConsole) {
        console.warn(
          `[Monitor] Error suppressed due to high frequency: ${error.message}`,
          context
        )
      }
      return
    }

    // 输出到控制台
    if (this.options.logToConsole) {
      this.logError(error, context, level)
    }

    // 调用错误回调
    try {
      this.options.onError(error, context)
    } catch (callbackError) {
      console.error('[Monitor] Error in error callback:', callbackError)
    }

    // 重新抛出错误
    if (this.options.rethrow) {
      throw error
    }
  }

  /**
   * 输出错误到控制台
   */
  private logError(error: Error, context?: ErrorContext, level: ErrorLevel = ErrorLevel.ERROR): void {
    const logMethod = level === ErrorLevel.FATAL || level === ErrorLevel.ERROR
      ? console.error
      : level === ErrorLevel.WARNING
        ? console.warn
        : console.log

    const prefix = `[Monitor ${level.toUpperCase()}]`

    if (context) {
      logMethod(
        prefix,
        context.module ? `[${context.module}]` : '',
        context.function ? `${context.function}:` : '',
        error.message,
        context.extra
      )
    } else {
      logMethod(prefix, error.message)
    }

    if (error.stack) {
      logMethod(error.stack)
    }
  }

  /**
   * 获取错误 key（用于去重）
   */
  private getErrorKey(error: Error, context?: ErrorContext): string {
    const module = context?.module || 'unknown'
    const func = context?.function || 'unknown'
    const message = error.message || 'unknown'
    return `${module}:${func}:${message}`
  }

  /**
   * 重置错误计数
   */
  reset(): void {
    this.errorCount.clear()
  }

  /**
   * 更新选项
   */
  updateOptions(options: Partial<ErrorHandlerOptions>): void {
    Object.assign(this.options, options)
  }
}

/**
 * 默认错误处理器实例
 */
export const errorHandler = new GlobalErrorHandler()

/**
 * 安全执行函数，捕获并处理错误
 * 
 * @param fn - 要执行的函数
 * @param context - 错误上下文
 * @param fallback - 发生错误时的降级值
 * @returns 函数执行结果或降级值
 */
export function safeExecute<T>(
  fn: () => T,
  context?: ErrorContext,
  fallback?: T
): T | undefined {
  try {
    return fn()
  } catch (error) {
    errorHandler.handle(error as Error, context)
    return fallback
  }
}

/**
 * 安全执行异步函数，捕获并处理错误
 * 
 * @param fn - 要执行的异步函数
 * @param context - 错误上下文
 * @param fallback - 发生错误时的降级值
 * @returns Promise<函数执行结果或降级值>
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  context?: ErrorContext,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    errorHandler.handle(error as Error, context)
    return fallback
  }
}

/**
 * 创建带重试的函数包装器
 * 
 * @param fn - 要包装的函数
 * @param maxRetries - 最大重试次数
 * @param delay - 重试延迟（毫秒）
 * @param context - 错误上下文
 * @returns 包装后的函数
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: ErrorContext
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: Error | null = null

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn(...args) as ReturnType<T>
      } catch (error) {
        lastError = error as Error

        if (i < maxRetries) {
          errorHandler.handle(
            new Error(`Retry ${i + 1}/${maxRetries}: ${lastError.message}`),
            context,
            ErrorLevel.WARNING
          )

          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }

    // 所有重试都失败
    const finalError = new Error(
      `Failed after ${maxRetries} retries: ${lastError?.message || 'Unknown error'}`
    )
    errorHandler.handle(finalError, context, ErrorLevel.ERROR)
    throw finalError
  }
}

/**
 * 创建带超时的函数包装器
 * 
 * @param fn - 要包装的函数
 * @param timeout - 超时时间（毫秒）
 * @param context - 错误上下文
 * @returns 包装后的函数
 */
export function withTimeout<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  timeout: number,
  context?: ErrorContext
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return Promise.race([
      fn(...args) as Promise<ReturnType<T>>,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Operation timed out after ${timeout}ms`)
          errorHandler.handle(error, context, ErrorLevel.ERROR)
          reject(error)
        }, timeout)
      }),
    ])
  }
}

/**
 * 创建带降级的函数包装器
 * 
 * @param fn - 要包装的函数
 * @param fallbackFn - 降级函数
 * @param context - 错误上下文
 * @returns 包装后的函数
 */
export function withFallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  fallbackFn: (...args: Parameters<T>) => ReturnType<T>,
  context?: ErrorContext
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args) as ReturnType<T>
    } catch (error) {
      errorHandler.handle(
        error as Error,
        { ...context, extra: { ...context?.extra, fallbackUsed: true } },
        ErrorLevel.WARNING
      )
      return fallbackFn(...args)
    }
  }
}

/**
 * 断路器状态
 */
enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * 断路器配置
 */
export interface CircuitBreakerOptions {
  /**
   * 失败阈值
   * @default 5
   */
  failureThreshold?: number

  /**
   * 重置超时时间（毫秒）
   * @default 60000
   */
  resetTimeout?: number

  /**
   * 成功阈值（半开状态）
   * @default 2
   */
  successThreshold?: number
}

/**
 * 断路器（Circuit Breaker）
 * 用于防止级联故障
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount = 0
  private successCount = 0
  private lastFailureTime: number | null = null
  private options: Required<CircuitBreakerOptions>

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 60000,
      successThreshold: options.successThreshold ?? 2,
    }
  }

  /**
   * 执行函数（带断路保护）
   * 
   * @param fn - 要执行的函数
   * @returns 函数执行结果
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 检查是否应该尝试重置
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN
        this.successCount = 0
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * 成功回调
   */
  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++

      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitBreakerState.CLOSED
        this.successCount = 0
      }
    }
  }

  /**
   * 失败回调
   */
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN
    }
  }

  /**
   * 检查是否应该尝试重置
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return false
    }

    return Date.now() - this.lastFailureTime >= this.options.resetTimeout
  }

  /**
   * 获取当前状态
   */
  getState(): CircuitBreakerState {
    return this.state
  }

  /**
   * 重置断路器
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
  }
}

