/**
 * 会话管理器
 * 管理用户会话，追踪会话时长和页面浏览
 */

import type { SessionInfo } from '../types'
import { generateUUID, now } from '../utils'

/**
 * 会话管理器类
 */
export class SessionManager {
  /**
   * 会话信息
   */
  private session: SessionInfo

  /**
   * 会话超时时间（毫秒）
   * @default 30 * 60 * 1000 (30分钟)
   */
  private readonly sessionTimeout: number = 30 * 60 * 1000

  /**
   * 最后活动时间
   */
  private lastActivityTime: number

  /**
   * 页面浏览计数
   */
  private pageViewCount = 0

  /**
   * 活动事件处理器引用（用于清理）
   */
  private activityHandler: (() => void) | null = null

  /**
   * 可见性变化处理器引用（用于清理）
   */
  private visibilityHandler: (() => void) | null = null

  /**
   * 是否已销毁
   */
  private destroyed = false

  constructor() {
    this.session = this.createNewSession()
    this.lastActivityTime = now()

    // 监听用户活动
    this.setupActivityTracking()
  }

  /**
   * 创建新会话
   * 
   * @returns 会话信息
   */
  private createNewSession(): SessionInfo {
    return {
      id: generateUUID(),
      startTime: now(),
      pageViews: 0,
    }
  }

  /**
   * 获取会话信息
   * 
   * @returns 会话信息
   */
  getSession(): SessionInfo {
    // 检查会话是否超时
    if (this.isSessionExpired()) {
      this.renewSession()
    }

    return {
      ...this.session,
      duration: now() - this.session.startTime,
      pageViews: this.pageViewCount,
    }
  }

  /**
   * 获取会话 ID
   * 
   * @returns 会话 ID
   */
  getSessionId(): string {
    return this.session.id
  }

  /**
   * 获取会话时长（毫秒）
   * 
   * @returns 会话时长
   */
  getDuration(): number {
    return now() - this.session.startTime
  }

  /**
   * 增加页面浏览计数
   */
  incrementPageView(): void {
    this.pageViewCount++
    this.updateActivity()
  }

  /**
   * 更新最后活动时间
   */
  updateActivity(): void {
    this.lastActivityTime = now()
  }

  /**
   * 判断会话是否过期
   * 
   * @returns 是否过期
   */
  private isSessionExpired(): boolean {
    const inactiveTime = now() - this.lastActivityTime
    return inactiveTime > this.sessionTimeout
  }

  /**
   * 续订会话
   * 创建新会话并保留一些信息
   */
  private renewSession(): void {
    const oldSessionId = this.session.id

    this.session = this.createNewSession()
    this.pageViewCount = 0
    this.lastActivityTime = now()

    // 可以触发会话续订事件
    console.log(`[SessionManager] Session renewed: ${oldSessionId} -> ${this.session.id}`)
  }

  /**
   * 手动结束当前会话
   */
  endSession(): void {
    this.session = this.createNewSession()
    this.pageViewCount = 0
    this.lastActivityTime = now()
  }

  /**
   * 设置活动追踪
   * 监听用户交互事件来更新活动时间
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') {
      return
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    this.activityHandler = () => {
      this.updateActivity()
    }

    events.forEach((event) => {
      window.addEventListener(event, this.activityHandler!, {
        passive: true,
        capture: true,
      })
    })

    // 监听页面可见性变化
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        // 页面重新可见时，检查会话是否过期
        if (this.isSessionExpired()) {
          this.renewSession()
        }
        else {
          this.updateActivity()
        }
      }
    }

    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  /**
   * 销毁会话管理器
   * 清理所有事件监听器，防止内存泄漏
   */
  destroy(): void {
    if (this.destroyed) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    // 移除活动事件监听器
    if (this.activityHandler) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
      events.forEach((event) => {
        window.removeEventListener(event, this.activityHandler!, {
          capture: true,
        })
      })
      this.activityHandler = null
    }

    // 移除可见性变化监听器
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }

    this.destroyed = true
  }
}

/**
 * 创建会话管理器实例
 * 
 * @returns 会话管理器实例
 */
export function createSessionManager(): SessionManager {
  return new SessionManager()
}





























