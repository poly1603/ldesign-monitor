/**
 * 重试管理器
 * 提供带重试机制的操作执行
 */

import type { IRetryManager, RetryConfig } from '../types/reporter'
import { sleep } from '../utils'

/**
 * 重试管理器类
 */
export class RetryManager implements IRetryManager {
  /**
   * 配置
   */
  private config: Required<RetryConfig>

  /**
   * 当前重试次数
   */
  private retryCount = 0

  constructor(config: RetryConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      initialDelay: config.initialDelay ?? 1000,
      backoffFactor: config.backoffFactor ?? 2,
      maxDelay: config.maxDelay ?? 30000,
      jitter: config.jitter ?? true,
      shouldRetry: config.shouldRetry ?? this.defaultShouldRetry,
    }
  }

  /**
   * 执行带重试的操作
   * 
   * @param fn - 要执行的函数
   * @returns 函数执行结果
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.retryCount = 0

    while (true) {
      try {
        const result = await fn()
        // 成功则重置重试计数
        this.retryCount = 0
        return result
      }
      catch (error) {
        // 检查是否应该重试
        if (!this.config.shouldRetry(error as Error, this.retryCount)) {
          throw error
        }

        // 检查是否达到最大重试次数
        if (this.retryCount >= this.config.maxRetries) {
          console.error(`[RetryManager] Max retries (${this.config.maxRetries}) reached`)
          throw error
        }

        // 计算延迟时间
        const delay = this.calculateDelay()
        console.log(`[RetryManager] Retry attempt ${this.retryCount + 1} after ${delay}ms`)

        // 等待后重试
        await sleep(delay)
        this.retryCount++
      }
    }
  }

  /**
   * 计算延迟时间（指数退避）
   * 
   * @returns 延迟时间（毫秒）
   */
  private calculateDelay(): number {
    // 基础延迟 = 初始延迟 * (退避因子 ^ 重试次数)
    let delay = this.config.initialDelay * (this.config.backoffFactor ** this.retryCount)

    // 限制最大延迟
    delay = Math.min(delay, this.config.maxDelay)

    // 添加抖动（避免惊群效应）
    if (this.config.jitter) {
      const jitter = Math.random() * delay * 0.1 // 10% 的抖动
      delay = delay + (Math.random() > 0.5 ? jitter : -jitter)
    }

    return Math.floor(delay)
  }

  /**
   * 默认的重试条件判断
   * 
   * @param error - 错误对象
   * @param attempt - 当前重试次数
   * @returns 是否应该重试
   */
  private defaultShouldRetry(error: Error, attempt: number): boolean {
    // 网络错误应该重试
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true
    }

    // 超时错误应该重试
    if (error.name === 'AbortError') {
      return true
    }

    // HTTP 5xx 错误应该重试
    if (error.message.includes('HTTP 5')) {
      return true
    }

    // HTTP 429（太多请求）应该重试
    if (error.message.includes('HTTP 429')) {
      return true
    }

    return false
  }

  /**
   * 重置重试计数
   */
  reset(): void {
    this.retryCount = 0
  }

  /**
   * 获取当前重试次数
   * 
   * @returns 重试次数
   */
  getRetryCount(): number {
    return this.retryCount
  }
}

/**
 * 创建重试管理器实例
 * 
 * @param config - 配置
 * @returns 重试管理器实例
 */
export function createRetryManager(config?: RetryConfig): RetryManager {
  return new RetryManager(config)
}


















