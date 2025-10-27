/**
 * 采样管理器
 * 用于控制数据采样率，减少数据量
 */

import type { ISamplingManager, ReportData, SamplingConfig } from '../types/reporter'
import { ReportDataType } from '../types/reporter'

/**
 * 采样管理器类
 */
export class SamplingManager implements ISamplingManager {
  /**
   * 配置
   */
  private config: Required<SamplingConfig>

  constructor(config: SamplingConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 1.0,
      sampleRateByType: config.sampleRateByType ?? {},
      errorSampleRate: config.errorSampleRate ?? 1.0,
      performanceSampleRate: config.performanceSampleRate ?? 0.1,
      shouldSample: config.shouldSample ?? this.defaultShouldSample.bind(this),
    }

    // 验证采样率
    this.validateSampleRates()
  }

  /**
   * 判断是否应该采样
   * 
   * @param data - 上报数据（可选，用于更精细的采样控制）
   * @returns 是否应该采样
   */
  shouldSample(data?: ReportData): boolean {
    // 如果提供了数据，使用自定义采样逻辑
    if (data && this.config.shouldSample) {
      return this.config.shouldSample(data)
    }

    // 使用全局采样率
    return Math.random() < this.config.sampleRate
  }

  /**
   * 默认的采样判断逻辑
   * 
   * @param data - 上报数据
   * @returns 是否应该采样
   */
  private defaultShouldSample(data: ReportData): boolean {
    // 根据数据类型使用不同的采样率
    let sampleRate: number

    // 优先使用类型特定的采样率
    if (this.config.sampleRateByType[data.type]) {
      sampleRate = this.config.sampleRateByType[data.type]!
    }
    else if (data.type === ReportDataType.ERROR) {
      // 错误数据使用错误采样率
      sampleRate = this.config.errorSampleRate
    }
    else if (data.type === ReportDataType.PERFORMANCE) {
      // 性能数据使用性能采样率
      sampleRate = this.config.performanceSampleRate
    }
    else {
      // 其他数据使用全局采样率
      sampleRate = this.config.sampleRate
    }

    return Math.random() < sampleRate
  }

  /**
   * 设置采样率
   * 
   * @param rate - 采样率（0-1）
   */
  setSampleRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Sample rate must be between 0 and 1')
    }
    this.config.sampleRate = rate
  }

  /**
   * 获取当前采样率
   * 
   * @returns 采样率
   */
  getSampleRate(): number {
    return this.config.sampleRate
  }

  /**
   * 设置特定类型的采样率
   * 
   * @param type - 数据类型
   * @param rate - 采样率（0-1）
   */
  setSampleRateForType(type: ReportDataType, rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Sample rate must be between 0 and 1')
    }
    this.config.sampleRateByType[type] = rate
  }

  /**
   * 获取特定类型的采样率
   * 
   * @param type - 数据类型
   * @returns 采样率
   */
  getSampleRateForType(type: ReportDataType): number {
    return this.config.sampleRateByType[type] ?? this.config.sampleRate
  }

  /**
   * 验证采样率配置
   */
  private validateSampleRates(): void {
    const rates = [
      this.config.sampleRate,
      this.config.errorSampleRate,
      this.config.performanceSampleRate,
      ...Object.values(this.config.sampleRateByType),
    ]

    for (const rate of rates) {
      if (rate < 0 || rate > 1) {
        throw new Error('Sample rate must be between 0 and 1')
      }
    }
  }
}

/**
 * 创建采样管理器实例
 * 
 * @param config - 配置
 * @returns 采样管理器实例
 */
export function createSamplingManager(config?: SamplingConfig): SamplingManager {
  return new SamplingManager(config)
}




















