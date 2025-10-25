/**
 * @ldesign/monitor - 配置验证器
 * 
 * 验证和规范化监控配置
 */

import type { MonitorConfig } from '../types'

/**
 * 配置验证错误
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`[Monitor Config] ${message}`)
    this.name = 'ConfigValidationError'
  }
}

/**
 * 配置验证器
 */
export class ConfigValidator {
  /**
   * 验证配置
   * 
   * @param config - 监控配置
   * @throws {ConfigValidationError} 配置无效时抛出错误
   */
  static validate(config: MonitorConfig): void {
    // 验证必填字段
    this.validateRequired(config)

    // 验证 DSN 格式
    this.validateDSN(config.dsn)

    // 验证采样率
    if (config.sampleRate !== undefined) {
      this.validateSampleRate(config.sampleRate)
    }

    // 验证批量配置
    if (config.batch) {
      this.validateBatchConfig(config.batch)
    }

    // 验证重试配置
    if (config.retry) {
      this.validateRetryConfig(config.retry)
    }

    // 验证环境
    if (config.environment) {
      this.validateEnvironment(config.environment)
    }
  }

  /**
   * 验证必填字段
   */
  private static validateRequired(config: MonitorConfig): void {
    if (!config.dsn || typeof config.dsn !== 'string') {
      throw new ConfigValidationError('dsn is required and must be a string')
    }

    if (!config.projectId || typeof config.projectId !== 'string') {
      throw new ConfigValidationError('projectId is required and must be a string')
    }
  }

  /**
   * 验证 DSN 格式
   */
  private static validateDSN(dsn: string): void {
    try {
      const url = new URL(dsn)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new ConfigValidationError('dsn must use http or https protocol')
      }
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw error
      }
      throw new ConfigValidationError('dsn must be a valid URL')
    }
  }

  /**
   * 验证采样率
   */
  private static validateSampleRate(sampleRate: number): void {
    if (typeof sampleRate !== 'number') {
      throw new ConfigValidationError('sampleRate must be a number')
    }

    if (sampleRate < 0 || sampleRate > 1) {
      throw new ConfigValidationError('sampleRate must be between 0 and 1')
    }
  }

  /**
   * 验证批量配置
   */
  private static validateBatchConfig(batch: NonNullable<MonitorConfig['batch']>): void {
    if (batch.size !== undefined) {
      if (typeof batch.size !== 'number' || batch.size < 1) {
        throw new ConfigValidationError('batch.size must be a positive number')
      }
    }

    if (batch.interval !== undefined) {
      if (typeof batch.interval !== 'number' || batch.interval < 0) {
        throw new ConfigValidationError('batch.interval must be a non-negative number')
      }
    }
  }

  /**
   * 验证重试配置
   */
  private static validateRetryConfig(retry: NonNullable<MonitorConfig['retry']>): void {
    if (retry.maxRetries !== undefined) {
      if (typeof retry.maxRetries !== 'number' || retry.maxRetries < 0) {
        throw new ConfigValidationError('retry.maxRetries must be a non-negative number')
      }
    }

    if (retry.delay !== undefined) {
      if (typeof retry.delay !== 'number' || retry.delay < 0) {
        throw new ConfigValidationError('retry.delay must be a non-negative number')
      }
    }
  }

  /**
   * 验证环境
   */
  private static validateEnvironment(environment: string): void {
    const validEnvironments = ['development', 'staging', 'production', 'test']

    if (!validEnvironments.includes(environment) && !environment.match(/^[a-zA-Z0-9-_]+$/)) {
      console.warn(
        `[Monitor Config] environment "${environment}" is not standard. ` +
        `Recommended values: ${validEnvironments.join(', ')}`
      )
    }
  }

  /**
   * 规范化配置
   * 填充默认值并返回完整配置
   * 
   * @param config - 原始配置
   * @returns 规范化后的配置
   */
  static normalize(config: MonitorConfig): Required<MonitorConfig> {
    // 验证配置
    this.validate(config)

    return {
      dsn: config.dsn,
      projectId: config.projectId,
      environment: config.environment || 'production',
      sampleRate: config.sampleRate ?? 1.0,
      enablePerformance: config.enablePerformance ?? true,
      enableError: config.enableError ?? true,
      enableBehavior: config.enableBehavior ?? true,
      enableAPI: config.enableAPI ?? true,
      enableReplay: config.enableReplay ?? false,
      batch: {
        size: config.batch?.size ?? 10,
        interval: config.batch?.interval ?? 5000,
      },
      retry: {
        maxRetries: config.retry?.maxRetries ?? 3,
        delay: config.retry?.delay ?? 1000,
      },
      debug: config.debug ?? false,
      hooks: config.hooks || {},
    }
  }
}

