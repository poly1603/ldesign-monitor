/**
 * @ldesign/monitor - 事件发射器
 * 
 * 提供类型安全的发布/订阅模式实现
 * @packageDocumentation
 */

/**
 * 事件处理器类型
 * @template T - 事件数据类型
 */
export type EventHandler<T = unknown> = (data: T) => void

/**
 * 事件映射类型
 * 用于定义事件名称到事件数据类型的映射
 * 
 * @example
 * ```typescript
 * interface MyEvents {
 *   'user:login': { userId: string }
 *   'error': Error
 *   'init': void
 * }
 * 
 * const emitter = new TypedEventEmitter<MyEvents>()
 * emitter.on('user:login', (data) => console.log(data.userId)) // 类型安全
 * ```
 */
export type EventMap = Record<string, unknown>

/**
 * 取消订阅函数类型
 */
export type Unsubscribe = () => void

/**
 * 事件发射器类
 * 
 * 提供发布/订阅模式的实现，支持事件的订阅、发布、取消订阅等操作。
 * 
 * @example
 * ```typescript
 * const emitter = new EventEmitter()
 * 
 * // 订阅事件
 * const unsubscribe = emitter.on('message', (data) => {
 *   console.log('Received:', data)
 * })
 * 
 * // 发射事件
 * emitter.emit('message', { text: 'Hello' })
 * 
 * // 取消订阅
 * unsubscribe()
 * ```
 */
export class EventEmitter {
  /** 事件处理器映射 */
  private readonly events: Map<string, Set<EventHandler<unknown>>> = new Map()
  /** 最大监听器数量（用于内存泄漏检测） */
  private maxListeners: number = 10
  /** 是否在控制台输出警告 */
  private warnOnLeaks: boolean = true

  /**
   * 创建事件发射器实例
   * 
   * @param options - 配置选项
   * @param options.maxListeners - 单个事件的最大监听器数量，超出时会发出警告
   * @param options.warnOnLeaks - 是否在超出最大监听器数量时发出警告
   */
  constructor(options?: { maxListeners?: number; warnOnLeaks?: boolean }) {
    if (options?.maxListeners !== undefined) {
      this.maxListeners = options.maxListeners
    }
    if (options?.warnOnLeaks !== undefined) {
      this.warnOnLeaks = options.warnOnLeaks
    }
  }

  /**
   * 订阅事件
   * 
   * @template T - 事件数据类型
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @returns 取消订阅的函数
   * 
   * @example
   * ```typescript
   * const unsubscribe = emitter.on('click', (event) => {
   *   console.log('Clicked:', event)
   * })
   * 
   * // 稍后取消订阅
   * unsubscribe()
   * ```
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe {
    if (!event || typeof event !== 'string') {
      throw new TypeError('Event name must be a non-empty string')
    }
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function')
    }

    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    const handlers = this.events.get(event)!
    handlers.add(handler as EventHandler<unknown>)

    // 内存泄漏检测
    if (this.warnOnLeaks && handlers.size > this.maxListeners) {
      console.warn(
        `[EventEmitter] Possible memory leak detected. ` +
        `${handlers.size} listeners added for event "${event}". ` +
        `Use setMaxListeners() to increase the limit.`
      )
    }

    // 返回取消订阅函数
    return () => this.off(event, handler)
  }

  /**
   * 订阅一次事件
   * 事件触发后自动取消订阅
   * 
   * @template T - 事件数据类型
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @returns 取消订阅的函数
   * 
   * @example
   * ```typescript
   * emitter.once('ready', () => {
   *   console.log('Ready! This will only log once.')
   * })
   * ```
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe {
    const onceHandler: EventHandler<T> = (data: T) => {
      this.off(event, onceHandler)
      handler(data)
    }
    return this.on(event, onceHandler)
  }

  /**
   * 取消订阅事件
   * 
   * @template T - 事件数据类型
   * @param event - 事件名称
   * @param handler - 要取消的事件处理器
   * @returns 是否成功取消订阅
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): boolean {
    const handlers = this.events.get(event)
    if (handlers) {
      const deleted = handlers.delete(handler as EventHandler<unknown>)
      // 如果事件没有监听器了，清理 Map 条目
      if (handlers.size === 0) {
        this.events.delete(event)
      }
      return deleted
    }
    return false
  }

  /**
   * 发射事件
   * 同步调用所有注册的处理器
   * 
   * @template T - 事件数据类型
   * @param event - 事件名称
   * @param data - 事件数据
   * @returns 是否有处理器被调用
   */
  emit<T = unknown>(event: string, data?: T): boolean {
    const handlers = this.events.get(event)
    if (!handlers || handlers.size === 0) {
      return false
    }

    // 复制一份 handlers，防止在迭代过程中被修改
    const handlersCopy = Array.from(handlers)
    
    for (const handler of handlersCopy) {
      try {
        handler(data)
      } catch (error) {
        console.error(`[EventEmitter] Error in "${event}" handler:`, error)
      }
    }

    return true
  }

  /**
   * 异步发射事件
   * 并行调用所有处理器，等待所有处理器完成
   * 
   * @template T - 事件数据类型
   * @param event - 事件名称
   * @param data - 事件数据
   * @returns 所有处理器的执行结果
   */
  async emitAsync<T = unknown>(event: string, data?: T): Promise<void[]> {
    const handlers = this.events.get(event)
    if (!handlers || handlers.size === 0) {
      return []
    }

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await Promise.resolve(handler(data))
      } catch (error) {
        console.error(`[EventEmitter] Error in async "${event}" handler:`, error)
        throw error
      }
    })

    return Promise.all(promises)
  }

  /**
   * 移除指定事件或所有事件的监听器
   * 
   * @param event - 事件名称，不传则移除所有事件的监听器
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  /**
   * 获取指定事件的监听器数量
   * 
   * @param event - 事件名称
   * @returns 监听器数量
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0
  }

  /**
   * 获取所有已注册的事件名称
   * 
   * @returns 事件名称数组
   */
  eventNames(): string[] {
    return Array.from(this.events.keys())
  }

  /**
   * 获取指定事件的所有监听器
   * 
   * @param event - 事件名称
   * @returns 监听器数组
   */
  listeners<T = unknown>(event: string): EventHandler<T>[] {
    const handlers = this.events.get(event)
    return handlers ? Array.from(handlers) as EventHandler<T>[] : []
  }

  /**
   * 设置最大监听器数量
   * 超过此数量时会发出内存泄漏警告
   * 
   * @param n - 最大监听器数量，0 表示无限制
   */
  setMaxListeners(n: number): this {
    this.maxListeners = n
    return this
  }

  /**
   * 获取最大监听器数量
   * 
   * @returns 最大监听器数量
   */
  getMaxListeners(): number {
    return this.maxListeners
  }

  /**
   * 检查是否有事件监听器
   * 
   * @param event - 事件名称，不传则检查是否有任何事件监听器
   * @returns 是否有监听器
   */
  hasListeners(event?: string): boolean {
    if (event) {
      return this.listenerCount(event) > 0
    }
    return this.events.size > 0
  }

  /**
   * 销毁事件发射器
   * 清理所有事件监听器，防止内存泄漏
   */
  destroy(): void {
    this.events.clear()
  }
}

/**
 * 类型安全的事件发射器
 * 
 * @template Events - 事件映射类型
 * 
 * @example
 * ```typescript
 * interface AppEvents {
 *   'user:login': { userId: string; timestamp: number }
 *   'user:logout': void
 *   'error': Error
 * }
 * 
 * const emitter = new TypedEventEmitter<AppEvents>()
 * 
 * // 类型安全的订阅
 * emitter.on('user:login', (data) => {
 *   console.log(data.userId) // 类型推断为 string
 * })
 * 
 * // 类型安全的发射
 * emitter.emit('user:login', { userId: '123', timestamp: Date.now() })
 * ```
 */
export class TypedEventEmitter<Events extends EventMap> extends EventEmitter {
  /**
   * 订阅事件（类型安全）
   */
  override on<K extends keyof Events>(
    event: K & string,
    handler: EventHandler<Events[K]>
  ): Unsubscribe {
    return super.on(event, handler as EventHandler<unknown>)
  }

  /**
   * 订阅一次事件（类型安全）
   */
  override once<K extends keyof Events>(
    event: K & string,
    handler: EventHandler<Events[K]>
  ): Unsubscribe {
    return super.once(event, handler as EventHandler<unknown>)
  }

  /**
   * 取消订阅（类型安全）
   */
  override off<K extends keyof Events>(
    event: K & string,
    handler: EventHandler<Events[K]>
  ): boolean {
    return super.off(event, handler as EventHandler<unknown>)
  }

  /**
   * 发射事件（类型安全）
   */
  override emit<K extends keyof Events>(
    event: K & string,
    data?: Events[K]
  ): boolean {
    return super.emit(event, data)
  }

  /**
   * 异步发射事件（类型安全）
   */
  override emitAsync<K extends keyof Events>(
    event: K & string,
    data?: Events[K]
  ): Promise<void[]> {
    return super.emitAsync(event, data)
  }
}




























