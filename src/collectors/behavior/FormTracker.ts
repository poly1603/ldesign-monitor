/**
 * 表单追踪器
 * 追踪表单提交和验证失败
 */

import { getElementSelector, now } from '../../utils'

/**
 * 表单数据接口
 */
export interface FormData {
  /**
   * 表单选择器
   */
  selector: string

  /**
   * 表单 ID
   */
  id?: string

  /**
   * 表单名称
   */
  name?: string

  /**
   * 事件类型
   */
  event: 'submit' | 'error'

  /**
   * 表单字段（脱敏）
   */
  fields?: Record<string, string>

  /**
   * 错误信息
   */
  error?: string

  /**
   * 时间戳
   */
  timestamp: number
}

/**
 * 表单追踪器类
 */
export class FormTracker {
  private callbacks: Set<(data: FormData) => void> = new Set()
  private started = false

  /**
   * 启动追踪
   */
  start(callback?: (data: FormData) => void): void {
    if (this.started) return

    if (callback) {
      this.callbacks.add(callback)
    }

    // 监听表单提交
    document.addEventListener('submit', this.handleSubmit.bind(this), true)

    this.started = true
  }

  /**
   * 处理表单提交
   */
  private handleSubmit(event: Event): void {
    const form = event.target as HTMLFormElement

    if (!form || form.tagName !== 'FORM') {
      return
    }

    const data: FormData = {
      selector: getElementSelector(form),
      id: form.id || undefined,
      name: form.name || undefined,
      event: 'submit',
      timestamp: now(),
    }

    this.emit(data)
  }

  /**
   * 发射事件
   */
  private emit(data: FormData): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(data)
      }
      catch (error) {
        console.error('[FormTracker] Error in callback:', error)
      }
    })
  }

  /**
   * 添加回调
   */
  onForm(callback: (data: FormData) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * 停止追踪
   */
  stop(): void {
    this.callbacks.clear()
    this.started = false
  }
}

/**
 * 创建表单追踪器实例
 */
export function createFormTracker(): FormTracker {
  return new FormTracker()
}

