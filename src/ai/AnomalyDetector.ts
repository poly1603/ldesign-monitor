/**
 * AI 异常检测器
 * 使用统计方法检测异常模式
 */

/**
 * 时间序列数据点
 */
export interface DataPoint {
  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 值
   */
  value: number
}

/**
 * 异常检测结果
 */
export interface AnomalyResult {
  /**
   * 是否异常
   */
  isAnomaly: boolean

  /**
   * 异常分数（0-1）
   */
  score: number

  /**
   * 异常类型
   */
  type?: 'spike' | 'drop' | 'trend'

  /**
   * 置信度
   */
  confidence: number
}

/**
 * AI 异常检测器类
 */
export class AnomalyDetector {
  /**
   * 历史数据窗口
   */
  private window: DataPoint[] = []

  /**
   * 窗口大小
   */
  private readonly windowSize = 100

  /**
   * 异常阈值（标准差的倍数）
   */
  private readonly threshold = 3

  /**
   * 检测数据点是否异常
   */
  detect(dataPoint: DataPoint): AnomalyResult {
    this.window.push(dataPoint)

    // 限制窗口大小
    if (this.window.length > this.windowSize) {
      this.window.shift()
    }

    // 需要足够的数据点
    if (this.window.length < 10) {
      return {
        isAnomaly: false,
        score: 0,
        confidence: 0,
      }
    }

    // 计算统计指标
    const values = this.window.map(p => p.value)
    const mean = this.calculateMean(values)
    const stdDev = this.calculateStdDev(values, mean)

    // Z-score 异常检测
    const zScore = Math.abs((dataPoint.value - mean) / stdDev)
    const isAnomaly = zScore > this.threshold

    // 判断异常类型
    let type: 'spike' | 'drop' | 'trend' | undefined
    if (isAnomaly) {
      if (dataPoint.value > mean + this.threshold * stdDev) {
        type = 'spike'
      }
      else if (dataPoint.value < mean - this.threshold * stdDev) {
        type = 'drop'
      }
    }

    return {
      isAnomaly,
      score: Math.min(zScore / this.threshold, 1),
      type,
      confidence: this.window.length / this.windowSize,
    }
  }

  /**
   * 计算均值
   */
  private calculateMean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length
  }

  /**
   * 计算标准差
   */
  private calculateStdDev(values: number[], mean: number): number {
    const squaredDiffs = values.map(v => (v - mean) ** 2)
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
    return Math.sqrt(variance)
  }

  /**
   * 重置检测器
   */
  reset(): void {
    this.window = []
  }
}

/**
 * 创建异常检测器实例
 */
export function createAnomalyDetector(): AnomalyDetector {
  return new AnomalyDetector()
}





















