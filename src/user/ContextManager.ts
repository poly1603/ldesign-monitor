/**
 * 上下文管理器
 * 管理应用上下文信息（页面、标签、自定义数据）
 */

import type { ContextInfo } from '../types'
import { getPageInfo } from '../utils'

/**
 * 上下文管理器类
 */
export class ContextManager {
  /**
   * 当前上下文
   */
  private context: ContextInfo = {}

  constructor() {
    // 初始化页面信息
    this.updatePageInfo()
  }

  /**
   * 设置上下文
   * 
   * @param context - 上下文信息
   */
  setContext(context: Partial<ContextInfo>): void {
    this.context = {
      ...this.context,
      ...context,
    }
  }

  /**
   * 获取上下文
   * 
   * @returns 上下文信息
   */
  getContext(): ContextInfo {
    return { ...this.context }
  }

  /**
   * 设置标签
   * 
   * @param tags - 标签键值对
   */
  setTags(tags: Record<string, string>): void {
    this.context.tags = {
      ...(this.context.tags || {}),
      ...tags,
    }
  }

  /**
   * 设置单个标签
   * 
   * @param key - 标签键
   * @param value - 标签值
   */
  setTag(key: string, value: string): void {
    if (!this.context.tags) {
      this.context.tags = {}
    }
    this.context.tags[key] = value
  }

  /**
   * 获取标签
   * 
   * @returns 所有标签
   */
  getTags(): Record<string, string> {
    return { ...(this.context.tags || {}) }
  }

  /**
   * 获取单个标签
   * 
   * @param key - 标签键
   * @returns 标签值
   */
  getTag(key: string): string | undefined {
    return this.context.tags?.[key]
  }

  /**
   * 移除标签
   * 
   * @param key - 标签键
   */
  removeTag(key: string): void {
    if (this.context.tags) {
      delete this.context.tags[key]
    }
  }

  /**
   * 设置额外数据
   * 
   * @param extra - 额外数据
   */
  setExtra(extra: Record<string, unknown>): void {
    this.context.extra = {
      ...(this.context.extra || {}),
      ...extra,
    }
  }

  /**
   * 设置单个额外数据
   * 
   * @param key - 数据键
   * @param value - 数据值
   */
  setExtraData(key: string, value: unknown): void {
    if (!this.context.extra) {
      this.context.extra = {}
    }
    this.context.extra[key] = value
  }

  /**
   * 获取额外数据
   * 
   * @returns 所有额外数据
   */
  getExtra(): Record<string, unknown> {
    return { ...(this.context.extra || {}) }
  }

  /**
   * 更新页面信息
   * 从当前页面收集信息
   */
  updatePageInfo(): void {
    const pageInfo = getPageInfo()
    this.context.url = pageInfo.url
    this.context.title = pageInfo.title
    this.context.referrer = pageInfo.referrer
  }

  /**
   * 清空上下文
   */
  clear(): void {
    this.context = {}
    this.updatePageInfo()
  }

  /**
   * 清空标签
   */
  clearTags(): void {
    this.context.tags = {}
  }

  /**
   * 清空额外数据
   */
  clearExtra(): void {
    this.context.extra = {}
  }
}

/**
 * 创建上下文管理器实例
 * 
 * @returns 上下文管理器实例
 */
export function createContextManager(): ContextManager {
  return new ContextManager()
}


