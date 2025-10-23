/**
 * 错误聚合器
 * 对错误进行去重、分组和聚合
 */

import type { ErrorGroup, MonitorErrorEvent } from '../../types/error'
import { hashCode } from '../../utils'

/**
 * 错误聚合器配置
 */
export interface ErrorAggregatorConfig {
  /**
   * 最大错误组数量
   * @default 100
   */
  maxGroups?: number

  /**
   * 单个错误组的最大实例数
   * @default 10
   */
  maxInstances?: number
}

/**
 * 错误聚合器类
 */
export class ErrorAggregator {
  /**
   * 配置
   */
  private config: Required<ErrorAggregatorConfig>

  /**
   * 错误组映射（fingerprint -> ErrorGroup）
   */
  private groups: Map<string, ErrorGroup> = new Map()

  constructor(config: ErrorAggregatorConfig = {}) {
    this.config = {
      maxGroups: config.maxGroups ?? 100,
      maxInstances: config.maxInstances ?? 10,
    }
  }

  /**
   * 添加错误
   * 
   * @param error - 错误事件
   * @returns 错误指纹
   */
  add(error: MonitorErrorEvent): string {
    // 计算错误指纹
    const fingerprint = this.calculateFingerprint(error)
    error.fingerprint = fingerprint

    // 获取或创建错误组
    let group = this.groups.get(fingerprint)

    if (!group) {
      // 检查是否超过最大组数
      if (this.groups.size >= this.config.maxGroups) {
        // 移除最旧的组
        const oldestKey = this.groups.keys().next().value
        this.groups.delete(oldestKey)
      }

      // 创建新组
      group = {
        id: fingerprint,
        type: error.type,
        message: error.message,
        stack: error.stack,
        count: 0,
        affectedUsers: 0,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        instances: [],
        status: 'unresolved',
      }

      this.groups.set(fingerprint, group)
    }

    // 更新错误组
    group.count++
    group.lastSeen = error.timestamp

    // 添加错误实例（限制数量）
    if (group.instances.length < this.config.maxInstances) {
      group.instances.push(error)
    }
    else {
      // 替换最旧的实例
      group.instances.shift()
      group.instances.push(error)
    }

    return fingerprint
  }

  /**
   * 计算错误指纹
   * 相同指纹的错误会被归为一组
   * 
   * @param error - 错误事件
   * @returns 错误指纹
   */
  calculateFingerprint(error: MonitorErrorEvent): string {
    // 基于错误类型、消息和堆栈的第一帧计算指纹
    const parts: string[] = [
      error.type,
      this.normalizeMessage(error.message),
    ]

    // 如果有堆栈信息，使用第一帧
    if (error.stackFrames && error.stackFrames.length > 0) {
      const firstFrame = error.stackFrames[0]
      parts.push(
        firstFrame.filename,
        String(firstFrame.lineno),
        String(firstFrame.colno),
      )
    }
    else if (error.filename) {
      parts.push(
        error.filename,
        String(error.lineno || 0),
        String(error.colno || 0),
      )
    }

    const fingerprintString = parts.join('|')
    return `error-${hashCode(fingerprintString)}`
  }

  /**
   * 规范化错误消息
   * 移除动态内容（如数字、URL 等）
   * 
   * @param message - 错误消息
   * @returns 规范化后的消息
   */
  private normalizeMessage(message: string): string {
    return message
      // 移除数字
      .replace(/\d+/g, '<number>')
      // 移除 URL
      .replace(/https?:\/\/[^\s]+/g, '<url>')
      // 移除引号内的内容
      .replace(/"[^"]*"/g, '"<string>"')
      .replace(/'[^']*'/g, "'<string>'")
      // 移除多余的空白
      .trim()
  }

  /**
   * 获取错误组
   * 
   * @param fingerprint - 错误指纹
   * @returns 错误组
   */
  getGroup(fingerprint: string): ErrorGroup | undefined {
    return this.groups.get(fingerprint)
  }

  /**
   * 获取所有错误组
   * 
   * @returns 错误组数组
   */
  getAllGroups(): ErrorGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * 获取排序后的错误组
   * 
   * @param sortBy - 排序字段
   * @param order - 排序顺序
   * @returns 排序后的错误组数组
   */
  getSortedGroups(
    sortBy: 'count' | 'firstSeen' | 'lastSeen' = 'count',
    order: 'asc' | 'desc' = 'desc',
  ): ErrorGroup[] {
    const groups = this.getAllGroups()

    groups.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]

      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })

    return groups
  }

  /**
   * 获取错误统计
   * 
   * @returns 统计信息
   */
  getStats(): {
    totalGroups: number
    totalErrors: number
    unresolvedGroups: number
    resolvedGroups: number
  } {
    let totalErrors = 0
    let unresolvedGroups = 0
    let resolvedGroups = 0

    this.groups.forEach((group) => {
      totalErrors += group.count
      if (group.status === 'unresolved') {
        unresolvedGroups++
      }
      else if (group.status === 'resolved') {
        resolvedGroups++
      }
    })

    return {
      totalGroups: this.groups.size,
      totalErrors,
      unresolvedGroups,
      resolvedGroups,
    }
  }

  /**
   * 标记错误组为已解决
   * 
   * @param fingerprint - 错误指纹
   */
  resolve(fingerprint: string): void {
    const group = this.groups.get(fingerprint)
    if (group) {
      group.status = 'resolved'
    }
  }

  /**
   * 标记错误组为已忽略
   * 
   * @param fingerprint - 错误指纹
   */
  ignore(fingerprint: string): void {
    const group = this.groups.get(fingerprint)
    if (group) {
      group.status = 'ignored'
    }
  }

  /**
   * 删除错误组
   * 
   * @param fingerprint - 错误指纹
   */
  delete(fingerprint: string): void {
    this.groups.delete(fingerprint)
  }

  /**
   * 清空所有错误组
   */
  clear(): void {
    this.groups.clear()
  }
}

/**
 * 创建错误聚合器实例
 * 
 * @param config - 配置
 * @returns 错误聚合器实例
 */
export function createErrorAggregator(config?: ErrorAggregatorConfig): ErrorAggregator {
  return new ErrorAggregator(config)
}

