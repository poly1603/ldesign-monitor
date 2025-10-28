/**
 * 用户信息管理器
 * 管理用户信息、属性和标识
 */

import type { UserInfo } from '../types'
import { generateUUID } from '../utils'

/**
 * 用户管理器类
 */
export class UserManager {
  /**
   * 当前用户信息
   */
  private user: UserInfo = {}

  /**
   * 匿名用户 ID（如果未设置用户 ID）
   */
  private anonymousId: string

  /**
   * 是否已设置用户
   */
  private isIdentified = false

  constructor() {
    this.anonymousId = this.loadOrCreateAnonymousId()
  }

  /**
   * 设置用户信息
   * 
   * @param user - 用户信息
   */
  setUser(user: UserInfo): void {
    this.user = {
      ...this.user,
      ...user,
    }

    if (user.id) {
      this.isIdentified = true
    }
  }

  /**
   * 获取用户信息
   * 
   * @returns 用户信息
   */
  getUser(): UserInfo {
    return {
      ...this.user,
      // 如果没有用户 ID，使用匿名 ID
      id: this.user.id || this.anonymousId,
    }
  }

  /**
   * 设置用户 ID
   * 
   * @param id - 用户 ID
   */
  setUserId(id: string): void {
    this.user.id = id
    this.isIdentified = true
  }

  /**
   * 获取用户 ID
   * 
   * @returns 用户 ID（如果未设置则返回匿名 ID）
   */
  getUserId(): string {
    return this.user.id || this.anonymousId
  }

  /**
   * 获取匿名 ID
   * 
   * @returns 匿名 ID
   */
  getAnonymousId(): string {
    return this.anonymousId
  }

  /**
   * 设置用户属性
   * 
   * @param attributes - 用户属性
   */
  setAttributes(attributes: Record<string, unknown>): void {
    this.user.attributes = {
      ...(this.user.attributes || {}),
      ...attributes,
    }
  }

  /**
   * 获取用户属性
   * 
   * @returns 用户属性
   */
  getAttributes(): Record<string, unknown> {
    return this.user.attributes || {}
  }

  /**
   * 判断用户是否已识别
   * 
   * @returns 是否已识别
   */
  isUserIdentified(): boolean {
    return this.isIdentified
  }

  /**
   * 清除用户信息
   */
  clear(): void {
    this.user = {}
    this.isIdentified = false
  }

  /**
   * 加载或创建匿名 ID
   * 从 localStorage 加载，如果不存在则创建新的
   * 
   * @returns 匿名 ID
   */
  private loadOrCreateAnonymousId(): string {
    const key = '__monitor_anonymous_id__'

    try {
      // 尝试从 localStorage 加载
      const stored = localStorage.getItem(key)
      if (stored) {
        return stored
      }
    }
    catch (error) {
      // localStorage 不可用
      console.warn('[UserManager] localStorage not available')
    }

    // 创建新的匿名 ID
    const anonymousId = generateUUID()

    try {
      // 保存到 localStorage
      localStorage.setItem(key, anonymousId)
    }
    catch (error) {
      // 忽略错误
    }

    return anonymousId
  }
}

/**
 * 创建用户管理器实例
 * 
 * @returns 用户管理器实例
 */
export function createUserManager(): UserManager {
  return new UserManager()
}





























