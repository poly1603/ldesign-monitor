/**
 * 会话录制器
 * 使用 rrweb 录制用户会话
 */

import type { eventWithTime, recordOptions } from 'rrweb'
import { record } from 'rrweb'
import { now } from '../utils'

/**
 * 录制配置
 */
export interface RecorderConfig {
  /**
   * 是否录制输入内容
   * @default false
   */
  recordInput?: boolean

  /**
   * 是否录制媒体交互
   * @default true
   */
  recordMedia?: boolean

  /**
   * 是否录制 canvas
   * @default false
   */
  recordCanvas?: boolean

  /**
   * 采样间隔（毫秒）
   * @default 100
   */
  sampling?: number

  /**
   * 最大录制时长（毫秒）
   * @default 300000 (5分钟)
   */
  maxDuration?: number
}

/**
 * 会话数据接口
 */
export interface SessionData {
  /**
   * 会话 ID
   */
  sessionId: string

  /**
   * 事件列表
   */
  events: eventWithTime[]

  /**
   * 开始时间
   */
  startTime: number

  /**
   * 结束时间
   */
  endTime: number

  /**
   * 时长（毫秒）
   */
  duration: number
}

/**
 * 会话录制器类
 */
export class SessionRecorder {
  /**
   * 配置
   */
  private config: Required<RecorderConfig>

  /**
   * 是否正在录制
   */
  private recording = false

  /**
   * 停止录制函数
   */
  private stopFn: (() => void) | null = null

  /**
   * 录制的事件
   */
  private events: eventWithTime[] = []

  /**
   * 录制开始时间
   */
  private startTime: number = 0

  /**
   * 会话 ID
   */
  private sessionId: string = ''

  /**
   * 定时器（用于最大时长限制）
   */
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null

  constructor(config: RecorderConfig = {}) {
    this.config = {
      recordInput: config.recordInput ?? false,
      recordMedia: config.recordMedia ?? true,
      recordCanvas: config.recordCanvas ?? false,
      sampling: config.sampling ?? 100,
      maxDuration: config.maxDuration ?? 300000,
    }
  }

  /**
   * 开始录制
   */
  start(sessionId: string): void {
    if (this.recording) {
      console.warn('[SessionRecorder] Already recording')
      return
    }

    this.sessionId = sessionId
    this.startTime = now()
    this.events = []

    const rrwebOptions: recordOptions<eventWithTime> = {
      emit: (event) => {
        this.events.push(event)
      },
      checkoutEveryNms: this.config.maxDuration,
      sampling: {
        mousemove: true,
        mouseInteraction: true,
        scroll: this.config.sampling,
        input: this.config.recordInput ? 'all' : false,
        media: this.config.recordMedia ? 800 : false,
      },
      recordCanvas: this.config.recordCanvas,
    }

    try {
      this.stopFn = record(rrwebOptions)
      this.recording = true

      // 设置最大时长定时器
      this.maxDurationTimer = setTimeout(() => {
        this.stop()
      }, this.config.maxDuration)
    }
    catch (error) {
      console.error('[SessionRecorder] Failed to start recording:', error)
    }
  }

  /**
   * 停止录制
   */
  stop(): SessionData | null {
    if (!this.recording) {
      return null
    }

    if (this.stopFn) {
      this.stopFn()
      this.stopFn = null
    }

    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer)
      this.maxDurationTimer = null
    }

    this.recording = false

    const endTime = now()

    return {
      sessionId: this.sessionId,
      events: this.events,
      startTime: this.startTime,
      endTime,
      duration: endTime - this.startTime,
    }
  }

  /**
   * 暂停录制
   */
  pause(): void {
    if (this.stopFn) {
      this.stopFn()
      this.stopFn = null
    }
  }

  /**
   * 恢复录制
   */
  resume(): void {
    if (!this.recording) {
      return
    }

    // 重新开始录制
    this.start(this.sessionId)
  }

  /**
   * 获取当前事件数量
   */
  getEventCount(): number {
    return this.events.length
  }

  /**
   * 是否正在录制
   */
  isRecording(): boolean {
    return this.recording
  }
}

/**
 * 创建会话录制器实例
 */
export function createSessionRecorder(config?: RecorderConfig): SessionRecorder {
  return new SessionRecorder(config)
}





























