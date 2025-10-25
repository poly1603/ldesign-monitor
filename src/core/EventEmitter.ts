/**
 * @ldesign/monitor - 事件发射器
 */

type EventHandler<T = any> = (data: T) => void

/**
 * 事件发射器类
 */
export class EventEmitter {
  private events: Map<string, Set<EventHandler>> = new Map()

  /**
   * 订阅事件
   */
  on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    this.events.get(event)!.add(handler)

    // 返回取消订阅函数
    return () => this.off(event, handler)
  }

  /**
   * 订阅一次事件
   */
  once<T = any>(event: string, handler: EventHandler<T>): void {
    const onceHandler = (data: T) => {
      handler(data)
      this.off(event, onceHandler)
    }
    this.on(event, onceHandler)
  }

  /**
   * 取消订阅
   */
  off<T = any>(event: string, handler: EventHandler<T>): void {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * 发射事件
   */
  emit<T = any>(event: string, data?: T): void {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error(`[EventEmitter] Error in ${event} handler:`, error)
        }
      })
    }
  }

  /**
   * 移除所有事件监听
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): string[] {
    return Array.from(this.events.keys())
  }

  /**
   * 销毁事件发射器
   * 清理所有事件监听器，防止内存泄漏
   */
  destroy(): void {
    this.events.clear()
  }

  /**
   * 检查是否有事件监听器
   */
  hasListeners(event?: string): boolean {
    if (event) {
      return this.listenerCount(event) > 0
    }
    return this.events.size > 0
  }
}

















