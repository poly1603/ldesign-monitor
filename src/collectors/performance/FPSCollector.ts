/**
 * @ldesign/monitor - 帧率 (FPS) 监控收集器
 * 
 * 监控页面渲染帧率,检测卡顿
 */

import type { PerformanceMetric } from '../../types'

export interface FPSOptions {
  /**
   * 采样间隔（毫秒）
   * @default 1000
   */
  interval?: number

  /**
   * 低帧率阈值
   * @default 30
   */
  lowFPSThreshold?: number

  /**
   * 卡顿阈值
   * @default 20
   */
  freezeThreshold?: number
}

export interface FPSInfo {
  /**
   * 当前 FPS
   */
  fps: number

  /**
   * 平均 FPS
   */
  avgFPS: number

  /**
   * 最小 FPS
   */
  minFPS: number

  /**
   * 最大 FPS
   */
  maxFPS: number

  /**
   * 卡顿次数
   */
  freezeCount: number

  /**
   * 时间戳
   */
  timestamp: number
}

export class FPSCollector {
  private options: Required<FPSOptions>
  private rafId: number | null = null
  private onMetric?: (metric: PerformanceMetric) => void
  
  private lastTime = 0
  private frames = 0
  private fpsHistory: number[] = []
  private freezeCount = 0
  private readonly MAX_HISTORY = 60

  constructor(options: FPSOptions = {}) {
    this.options = {
      interval: options.interval ?? 1000,
      lowFPSThreshold: options.lowFPSThreshold ?? 30,
      freezeThreshold: options.freezeThreshold ?? 20,
    }
  }

  /**
   * 启动收集
   */
  start(callback: (metric: PerformanceMetric) => void): void {
    this.onMetric = callback
    this.lastTime = performance.now()
    this.measureFPS()
  }

  /**
   * 停止收集
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * 获取当前 FPS 信息
   */
  getFPSInfo(): FPSInfo {
    const avgFPS = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      : 0

    const minFPS = this.fpsHistory.length > 0
      ? Math.min(...this.fpsHistory)
      : 0

    const maxFPS = this.fpsHistory.length > 0
      ? Math.max(...this.fpsHistory)
      : 0

    return {
      fps: this.fpsHistory[this.fpsHistory.length - 1] || 0,
      avgFPS,
      minFPS,
      maxFPS,
      freezeCount: this.freezeCount,
      timestamp: Date.now(),
    }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.fpsHistory = []
    this.freezeCount = 0
  }

  /**
   * 测量 FPS
   */
  private measureFPS(): void {
    const now = performance.now()
    this.frames++

    // 每隔指定间隔计算一次 FPS
    if (now >= this.lastTime + this.options.interval) {
      const elapsed = now - this.lastTime
      const fps = Math.round((this.frames * 1000) / elapsed)

      // 记录 FPS
      this.fpsHistory.push(fps)
      if (this.fpsHistory.length > this.MAX_HISTORY) {
        this.fpsHistory.shift()
      }

      // 检测卡顿
      if (fps < this.options.freezeThreshold) {
        this.freezeCount++
      }

      // 上报指标
      if (this.onMetric) {
        const rating = this.getRating(fps)
        const info = this.getFPSInfo()

        this.onMetric({
          name: 'fps',
          value: fps,
          unit: 'fps',
          rating,
          attribution: {
            avgFPS: info.avgFPS,
            minFPS: info.minFPS,
            maxFPS: info.maxFPS,
            freezeCount: info.freezeCount,
            isSmooth: fps >= 60,
            isLowFPS: fps < this.options.lowFPSThreshold,
            isFreeze: fps < this.options.freezeThreshold,
          },
        })

        // 如果检测到卡顿，单独上报
        if (fps < this.options.freezeThreshold) {
          this.onMetric({
            name: 'freeze',
            value: fps,
            unit: 'fps',
            rating: 'poor',
            attribution: {
              freezeCount: this.freezeCount,
              severity: this.getFreezeSeverity(fps),
            },
          })
        }
      }

      // 重置计数器
      this.lastTime = now
      this.frames = 0
    }

    // 继续下一帧
    this.rafId = requestAnimationFrame(() => this.measureFPS())
  }

  /**
   * 获取评分
   */
  private getRating(fps: number): 'good' | 'needs-improvement' | 'poor' {
    if (fps >= 50) return 'good'
    if (fps >= this.options.lowFPSThreshold) return 'needs-improvement'
    return 'poor'
  }

  /**
   * 获取卡顿严重程度
   */
  private getFreezeSeverity(fps: number): 'mild' | 'moderate' | 'severe' {
    if (fps >= 15) return 'mild'
    if (fps >= 5) return 'moderate'
    return 'severe'
  }
}

/**
 * 使用 PerformanceObserver 监控帧时间
 */
export class FrameTimingCollector {
  private observer: PerformanceObserver | null = null
  private onMetric?: (metric: PerformanceMetric) => void
  private slowFrames = 0
  private totalFrames = 0

  /**
   * 启动收集
   */
  start(callback: (metric: PerformanceMetric) => void): void {
    this.onMetric = callback

    if (!this.supportsFrameTiming()) {
      console.warn('[FrameTimingCollector] Frame timing not supported')
      return
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleFrame(entry)
        }
      })

      // 监听 frame 或 event 类型
      const entryTypes = PerformanceObserver.supportedEntryTypes
      if (entryTypes.includes('frame')) {
        this.observer.observe({ entryTypes: ['frame'] })
      }
    } catch (error) {
      console.error('[FrameTimingCollector] Failed to start observer:', error)
    }
  }

  /**
   * 停止收集
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  /**
   * 获取慢帧率
   */
  getSlowFrameRate(): number {
    return this.totalFrames > 0 ? this.slowFrames / this.totalFrames : 0
  }

  /**
   * 处理帧
   */
  private handleFrame(entry: PerformanceEntry): void {
    this.totalFrames++

    const duration = entry.duration
    const isSlowFrame = duration > 16.67 // 超过 60fps 的单帧时间

    if (isSlowFrame) {
      this.slowFrames++
    }

    if (this.onMetric && isSlowFrame) {
      this.onMetric({
        name: 'slow-frame',
        value: duration,
        unit: 'ms',
        rating: duration > 50 ? 'poor' : 'needs-improvement',
        attribution: {
          slowFrames: this.slowFrames,
          totalFrames: this.totalFrames,
          slowFrameRate: this.getSlowFrameRate(),
        },
      })
    }
  }

  /**
   * 检查是否支持帧时间
   */
  private supportsFrameTiming(): boolean {
    return (
      typeof PerformanceObserver !== 'undefined' &&
      typeof PerformanceObserver.supportedEntryTypes !== 'undefined'
    )
  }
}
