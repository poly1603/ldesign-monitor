/**
 * @ldesign/monitor - 弹性组件
 * 
 * 提供断路器、限流器等弹性模式实现
 * @packageDocumentation
 */

import { CircuitBreakerOpenError, RateLimitError } from '../errors'

// ============ 断路器 ============

/**
 * 断路器状态
 */
export enum CircuitBreakerState {
  /** 关闭状态 - 正常运行 */
  Closed = 'closed',
  /** 打开状态 - 拒绝所有请求 */
  Open = 'open',
  /** 半开状态 - 允许部分请求通过以测试恢复 */
  HalfOpen = 'half-open',
}

/**
 * 断路器配置
 */
export interface CircuitBreakerConfig {
  /** 失败阈值（触发断路器打开的连续失败次数） */
  failureThreshold?: number
  /** 成功阈值（触发断路器关闭的连续成功次数） */
  successThreshold?: number
  /** 超时时间（毫秒，断路器打开后多久尝试半开） */
  timeout?: number
  /** 是否自动重置统计 */
  autoReset?: boolean
  /** 自动重置间隔（毫秒） */
  resetInterval?: number
  /** 监控窗口大小（用于计算失败率） */
  windowSize?: number
  /** 失败率阈值（0-1，超过此值触发断路器打开） */
  failureRateThreshold?: number
}

/**
 * 断路器统计
 */
export interface CircuitBreakerStats {
  /** 当前状态 */
  state: CircuitBreakerState
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successCount: number
  /** 失败请求数 */
  failureCount: number
  /** 被拒绝的请求数 */
  rejectedCount: number
  /** 最后失败时间 */
  lastFailureTime?: number
  /** 最后成功时间 */
  lastSuccessTime?: number
  /** 下次重试时间（仅在打开状态有效） */
  nextRetryTime?: number
  /** 当前失败率 */
  failureRate: number
}

/**
 * 断路器
 * 实现断路器模式，保护系统免受级联故障
 * 
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({ failureThreshold: 5 })
 * 
 * try {
 *   await breaker.execute(async () => {
 *     return await fetch('/api/data')
 *   })
 * } catch (error) {
 *   if (error instanceof CircuitBreakerOpenError) {
 *     console.log('Circuit breaker is open, try again later')
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.Closed
  private failureCount = 0
  private successCount = 0
  private totalRequests = 0
  private rejectedCount = 0
  private lastFailureTime?: number
  private lastSuccessTime?: number
  private nextRetryTime?: number
  private readonly config: Required<CircuitBreakerConfig>
  private resetTimer?: ReturnType<typeof setInterval>
  private readonly requestHistory: Array<{ success: boolean; timestamp: number }> = []

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 3,
      timeout: config.timeout ?? 30000,
      autoReset: config.autoReset ?? true,
      resetInterval: config.resetInterval ?? 60000,
      windowSize: config.windowSize ?? 10,
      failureRateThreshold: config.failureRateThreshold ?? 0.5,
    }

    if (this.config.autoReset) {
      this.resetTimer = setInterval(() => {
        this.cleanupHistory()
      }, this.config.resetInterval)
    }
  }

  /**
   * 执行受保护的操作
   * 
   * @template T - 返回类型
   * @param fn - 要执行的函数
   * @returns 执行结果
   * @throws {CircuitBreakerOpenError} 断路器打开时抛出
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 检查断路器状态
    if (this.state === CircuitBreakerState.Open) {
      if (Date.now() < (this.nextRetryTime ?? 0)) {
        this.rejectedCount++
        throw new CircuitBreakerOpenError(
          'Circuit breaker is open',
          this.nextRetryTime ?? Date.now() + this.config.timeout
        )
      }
      // 超时后进入半开状态
      this.transitionTo(CircuitBreakerState.HalfOpen)
    }

    this.totalRequests++

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  /**
   * 记录成功
   */
  private recordSuccess(): void {
    this.successCount++
    this.lastSuccessTime = Date.now()
    this.requestHistory.push({ success: true, timestamp: Date.now() })
    this.trimHistory()

    if (this.state === CircuitBreakerState.HalfOpen) {
      // 检查是否达到成功阈值
      const recentSuccesses = this.getRecentSuccessCount()
      if (recentSuccesses >= this.config.successThreshold) {
        this.transitionTo(CircuitBreakerState.Closed)
        this.failureCount = 0
      }
    }
  }

  /**
   * 记录失败
   */
  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    this.requestHistory.push({ success: false, timestamp: Date.now() })
    this.trimHistory()

    // 检查是否应该打开断路器
    if (this.state === CircuitBreakerState.Closed || this.state === CircuitBreakerState.HalfOpen) {
      const failureRate = this.calculateFailureRate()
      
      if (
        this.failureCount >= this.config.failureThreshold ||
        failureRate >= this.config.failureRateThreshold
      ) {
        this.transitionTo(CircuitBreakerState.Open)
      }
    }
  }

  /**
   * 状态转换
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state
    this.state = newState

    if (newState === CircuitBreakerState.Open) {
      this.nextRetryTime = Date.now() + this.config.timeout
    } else {
      this.nextRetryTime = undefined
    }

    if (newState === CircuitBreakerState.Closed) {
      this.failureCount = 0
    }

    console.log(`[CircuitBreaker] State changed from ${oldState} to ${newState}`)
  }

  /**
   * 计算失败率
   */
  private calculateFailureRate(): number {
    if (this.requestHistory.length === 0) return 0
    const failures = this.requestHistory.filter(r => !r.success).length
    return failures / this.requestHistory.length
  }

  /**
   * 获取最近成功次数
   */
  private getRecentSuccessCount(): number {
    const recentRequests = this.requestHistory.slice(-this.config.successThreshold)
    return recentRequests.filter(r => r.success).length
  }

  /**
   * 修剪历史记录
   */
  private trimHistory(): void {
    while (this.requestHistory.length > this.config.windowSize) {
      this.requestHistory.shift()
    }
  }

  /**
   * 清理过期历史
   */
  private cleanupHistory(): void {
    const now = Date.now()
    const cutoff = now - this.config.resetInterval
    
    while (this.requestHistory.length > 0 && this.requestHistory[0].timestamp < cutoff) {
      this.requestHistory.shift()
    }
  }

  /**
   * 获取当前状态
   */
  getState(): CircuitBreakerState {
    return this.state
  }

  /**
   * 获取统计信息
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      failureCount: this.failureCount,
      rejectedCount: this.rejectedCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextRetryTime: this.nextRetryTime,
      failureRate: this.calculateFailureRate(),
    }
  }

  /**
   * 手动重置断路器
   */
  reset(): void {
    this.state = CircuitBreakerState.Closed
    this.failureCount = 0
    this.successCount = 0
    this.nextRetryTime = undefined
    this.requestHistory.length = 0
  }

  /**
   * 销毁断路器
   */
  destroy(): void {
    if (this.resetTimer) {
      clearInterval(this.resetTimer)
      this.resetTimer = undefined
    }
  }
}

// ============ 限流器 ============

/**
 * 限流器配置
 */
export interface RateLimiterConfig {
  /** 时间窗口内最大请求数 */
  maxRequests: number
  /** 时间窗口（毫秒） */
  windowMs?: number
  /** 限流策略 */
  strategy?: 'sliding-window' | 'fixed-window' | 'token-bucket'
  /** 令牌桶策略的令牌生成速率（每秒） */
  tokensPerSecond?: number
  /** 令牌桶策略的最大令牌数 */
  maxTokens?: number
}

/**
 * 限流器统计
 */
export interface RateLimiterStats {
  /** 当前窗口内的请求数 */
  currentRequests: number
  /** 剩余配额 */
  remaining: number
  /** 限制数 */
  limit: number
  /** 重置时间（毫秒时间戳） */
  resetTime: number
  /** 被拒绝的请求数 */
  rejectedCount: number
}

/**
 * 限流器
 * 实现请求限流，防止系统过载
 * 
 * @example
 * ```typescript
 * const limiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 })
 * 
 * if (limiter.tryAcquire()) {
 *   // 执行请求
 * } else {
 *   console.log('Rate limited')
 * }
 * ```
 */
export class RateLimiter {
  private readonly config: Required<RateLimiterConfig>
  private requests: number[] = []
  private rejectedCount = 0
  private windowStart = Date.now()
  
  // 令牌桶相关
  private tokens: number
  private lastRefillTime: number

  constructor(config: RateLimiterConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs ?? 60000,
      strategy: config.strategy ?? 'sliding-window',
      tokensPerSecond: config.tokensPerSecond ?? config.maxRequests / 60,
      maxTokens: config.maxTokens ?? config.maxRequests,
    }

    this.tokens = this.config.maxTokens
    this.lastRefillTime = Date.now()
  }

  /**
   * 尝试获取配额
   * 
   * @param cost - 消耗的配额数量
   * @returns 是否获取成功
   */
  tryAcquire(cost = 1): boolean {
    switch (this.config.strategy) {
      case 'token-bucket':
        return this.tryAcquireTokenBucket(cost)
      case 'fixed-window':
        return this.tryAcquireFixedWindow(cost)
      case 'sliding-window':
      default:
        return this.tryAcquireSlidingWindow(cost)
    }
  }

  /**
   * 获取配额，失败时抛出异常
   * 
   * @param cost - 消耗的配额数量
   * @throws {RateLimitError} 超过限制时抛出
   */
  acquire(cost = 1): void {
    if (!this.tryAcquire(cost)) {
      const stats = this.getStats()
      throw new RateLimitError('Rate limit exceeded', {
        retryAfter: stats.resetTime - Date.now(),
        limit: stats.limit,
        remaining: stats.remaining,
      })
    }
  }

  /**
   * 滑动窗口策略
   */
  private tryAcquireSlidingWindow(cost: number): boolean {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // 清理过期请求
    this.requests = this.requests.filter(time => time > windowStart)

    if (this.requests.length + cost <= this.config.maxRequests) {
      for (let i = 0; i < cost; i++) {
        this.requests.push(now)
      }
      return true
    }

    this.rejectedCount++
    return false
  }

  /**
   * 固定窗口策略
   */
  private tryAcquireFixedWindow(cost: number): boolean {
    const now = Date.now()

    // 检查是否需要重置窗口
    if (now - this.windowStart >= this.config.windowMs) {
      this.windowStart = now
      this.requests = []
    }

    if (this.requests.length + cost <= this.config.maxRequests) {
      for (let i = 0; i < cost; i++) {
        this.requests.push(now)
      }
      return true
    }

    this.rejectedCount++
    return false
  }

  /**
   * 令牌桶策略
   */
  private tryAcquireTokenBucket(cost: number): boolean {
    this.refillTokens()

    if (this.tokens >= cost) {
      this.tokens -= cost
      return true
    }

    this.rejectedCount++
    return false
  }

  /**
   * 补充令牌
   */
  private refillTokens(): void {
    const now = Date.now()
    const elapsed = (now - this.lastRefillTime) / 1000
    const newTokens = elapsed * this.config.tokensPerSecond

    this.tokens = Math.min(this.config.maxTokens, this.tokens + newTokens)
    this.lastRefillTime = now
  }

  /**
   * 获取统计信息
   */
  getStats(): RateLimiterStats {
    const now = Date.now()
    
    if (this.config.strategy === 'token-bucket') {
      this.refillTokens()
      return {
        currentRequests: Math.floor(this.config.maxTokens - this.tokens),
        remaining: Math.floor(this.tokens),
        limit: this.config.maxTokens,
        resetTime: now + (this.config.maxTokens - this.tokens) / this.config.tokensPerSecond * 1000,
        rejectedCount: this.rejectedCount,
      }
    }

    // 清理过期请求
    const windowStart = now - this.config.windowMs
    this.requests = this.requests.filter(time => time > windowStart)

    return {
      currentRequests: this.requests.length,
      remaining: Math.max(0, this.config.maxRequests - this.requests.length),
      limit: this.config.maxRequests,
      resetTime: this.requests.length > 0 ? this.requests[0] + this.config.windowMs : now,
      rejectedCount: this.rejectedCount,
    }
  }

  /**
   * 重置限流器
   */
  reset(): void {
    this.requests = []
    this.tokens = this.config.maxTokens
    this.lastRefillTime = Date.now()
    this.windowStart = Date.now()
    this.rejectedCount = 0
  }
}

// ============ 工厂函数 ============

/**
 * 创建断路器
 */
export function createCircuitBreaker(config?: CircuitBreakerConfig): CircuitBreaker {
  return new CircuitBreaker(config)
}

/**
 * 创建限流器
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config)
}
