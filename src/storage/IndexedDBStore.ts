/**
 * @ldesign/monitor - IndexedDB 离线存储
 * 
 * 离线缓存监控数据，网络恢复后自动补发
 */

export interface IndexedDBStoreOptions {
  /**
   * 数据库名称
   * @default 'monitor_offline_store'
   */
  dbName?: string

  /**
   * 数据库版本
   * @default 1
   */
  dbVersion?: number

  /**
   * 对象存储名称
   * @default 'events'
   */
  storeName?: string

  /**
   * 最大存储条数
   * @default 1000
   */
  maxItems?: number

  /**
   * 数据过期时间（毫秒）
   * @default 604800000 (7天)
   */
  ttl?: number

  /**
   * 自动清理间隔（毫秒）
   * @default 3600000 (1小时)
   */
  cleanupInterval?: number
}

export interface StoredEvent {
  /**
   * 唯一ID
   */
  id: string

  /**
   * 事件数据
   */
  data: any

  /**
   * 创建时间
   */
  timestamp: number

  /**
   * 重试次数
   */
  retryCount: number

  /**
   * 优先级
   */
  priority: number

  /**
   * 事件类型
   */
  type: string
}

export class IndexedDBStore {
  private options: Required<IndexedDBStoreOptions>
  private db: IDBDatabase | null = null
  private cleanupTimer: number | null = null
  private initPromise: Promise<void> | null = null

  constructor(options: IndexedDBStoreOptions = {}) {
    this.options = {
      dbName: options.dbName ?? 'monitor_offline_store',
      dbVersion: options.dbVersion ?? 1,
      storeName: options.storeName ?? 'events',
      maxItems: options.maxItems ?? 1000,
      ttl: options.ttl ?? 7 * 24 * 60 * 60 * 1000, // 7天
      cleanupInterval: options.cleanupInterval ?? 60 * 60 * 1000, // 1小时
    }
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    if (this.db) {
      return Promise.resolve()
    }

    this.initPromise = this.openDatabase()
    return this.initPromise
  }

  /**
   * 保存事件
   */
  async save(event: Omit<StoredEvent, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    await this.init()

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const storedEvent: StoredEvent = {
      id: this.generateId(),
      data: event.data,
      timestamp: Date.now(),
      retryCount: 0,
      priority: event.priority,
      type: event.type,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite')
      const store = transaction.objectStore(this.options.storeName)
      const request = store.add(storedEvent)

      request.onsuccess = () => {
        resolve(storedEvent.id)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 批量保存事件
   */
  async saveBatch(events: Array<Omit<StoredEvent, 'id' | 'timestamp' | 'retryCount'>>): Promise<string[]> {
    await this.init()

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const ids: string[] = []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite')
      const store = transaction.objectStore(this.options.storeName)

      for (const event of events) {
        const storedEvent: StoredEvent = {
          id: this.generateId(),
          data: event.data,
          timestamp: Date.now(),
          retryCount: 0,
          priority: event.priority,
          type: event.type,
        }

        const request = store.add(storedEvent)
        ids.push(storedEvent.id)

        request.onerror = () => {
          reject(request.error)
        }
      }

      transaction.oncomplete = () => {
        resolve(ids)
      }

      transaction.onerror = () => {
        reject(transaction.error)
      }
    })
  }

  /**
   * 获取所有事件（按优先级和时间排序）
   */
  async getAll(limit?: number): Promise<StoredEvent[]> {
    await this.init()

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readonly')
      const store = transaction.objectStore(this.options.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        let events = request.result as StoredEvent[]

        // 按优先级降序、时间升序排序
        events.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority
          }
          return a.timestamp - b.timestamp
        })

        if (limit) {
          events = events.slice(0, limit)
        }

        resolve(events)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 根据类型获取事件
   */
  async getByType(type: string, limit?: number): Promise<StoredEvent[]> {
    const allEvents = await this.getAll()
    let filtered = allEvents.filter(e => e.type === type)

    if (limit) {
      filtered = filtered.slice(0, limit)
    }

    return filtered
  }

  /**
   * 删除事件
   */
  async delete(id: string): Promise<void> {
    await this.init()

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite')
      const store = transaction.objectStore(this.options.storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 批量删除事件
   */
  async deleteBatch(ids: string[]): Promise<void> {
    await this.init()

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite')
      const store = transaction.objectStore(this.options.storeName)

      for (const id of ids) {
        const request = store.delete(id)

        request.onerror = () => {
          reject(request.error)
        }
      }

      transaction.oncomplete = () => {
        resolve()
      }

      transaction.onerror = () => {
        reject(transaction.error)
      }
    })
  }

  /**
   * 更新事件（增加重试次数）
   */
  async updateRetryCount(id: string): Promise<void> {
    await this.init()

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite')
      const store = transaction.objectStore(this.options.storeName)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const event = getRequest.result as StoredEvent
        if (event) {
          event.retryCount++
          const putRequest = store.put(event)

          putRequest.onsuccess = () => {
            resolve()
          }

          putRequest.onerror = () => {
            reject(putRequest.error)
          }
        } else {
          resolve()
        }
      }

      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    })
  }

  /**
   * 获取存储的事件数量
   */
  async count(): Promise<number> {
    await this.init()

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readonly')
      const store = transaction.objectStore(this.options.storeName)
      const request = store.count()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    await this.init()

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite')
      const store = transaction.objectStore(this.options.storeName)
      const request = store.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 清理过期和超限数据
   */
  async cleanup(): Promise<number> {
    await this.init()

    if (!this.db) {
      return 0
    }

    const now = Date.now()
    const allEvents = await this.getAll()
    const toDelete: string[] = []

    // 删除过期事件
    for (const event of allEvents) {
      if (now - event.timestamp > this.options.ttl) {
        toDelete.push(event.id)
      }
    }

    // 如果超过最大数量，删除最旧的
    if (allEvents.length > this.options.maxItems) {
      const excess = allEvents
        .slice(this.options.maxItems)
        .map(e => e.id)
      toDelete.push(...excess)
    }

    if (toDelete.length > 0) {
      await this.deleteBatch(toDelete)
    }

    return toDelete.length
  }

  /**
   * 启动自动清理
   */
  startAutoCleanup(): void {
    if (this.cleanupTimer) {
      return
    }

    this.cleanupTimer = window.setInterval(() => {
      this.cleanup().catch(console.error)
    }, this.options.cleanupInterval)
  }

  /**
   * 停止自动清理
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 关闭数据库
   */
  close(): void {
    this.stopAutoCleanup()

    if (this.db) {
      this.db.close()
      this.db = null
    }

    this.initPromise = null
  }

  /**
   * 打开数据库
   */
  private openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'))
        return
      }

      const request = indexedDB.open(this.options.dbName, this.options.dbVersion)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.startAutoCleanup()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        if (!db.objectStoreNames.contains(this.options.storeName)) {
          const objectStore = db.createObjectStore(this.options.storeName, { keyPath: 'id' })

          // 创建索引
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
          objectStore.createIndex('type', 'type', { unique: false })
          objectStore.createIndex('priority', 'priority', { unique: false })
        }
      }
    })
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 离线队列管理器
 */
export class OfflineQueueManager {
  private store: IndexedDBStore
  private isOnline = navigator.onLine
  private retryInterval = 5000
  private maxRetries = 3
  private retryTimer: number | null = null
  private onFlush?: (events: StoredEvent[]) => Promise<void>

  constructor(store: IndexedDBStore) {
    this.store = store
    this.setupOnlineListener()
  }

  /**
   * 启动队列管理
   */
  start(onFlush: (events: StoredEvent[]) => Promise<void>): void {
    this.onFlush = onFlush

    // 如果在线，立即尝试刷新
    if (this.isOnline) {
      this.flush()
    }
  }

  /**
   * 停止队列管理
   */
  stop(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  /**
   * 添加事件到离线队列
   */
  async enqueue(data: any, type: string, priority = 0): Promise<void> {
    await this.store.save({
      data,
      type,
      priority,
    })
  }

  /**
   * 刷新队列（尝试发送所有事件）
   */
  async flush(): Promise<void> {
    if (!this.isOnline || !this.onFlush) {
      return
    }

    try {
      const events = await this.store.getAll(50) // 每次最多50条

      if (events.length === 0) {
        return
      }

      // 过滤超过最大重试次数的事件
      const validEvents = events.filter(e => e.retryCount < this.maxRetries)

      if (validEvents.length === 0) {
        // 删除所有失败的事件
        await this.store.deleteBatch(events.map(e => e.id))
        return
      }

      try {
        // 尝试发送
        await this.onFlush(validEvents)

        // 成功后删除
        await this.store.deleteBatch(validEvents.map(e => e.id))

        // 如果还有更多事件，继续刷新
        const remaining = await this.store.count()
        if (remaining > 0) {
          setTimeout(() => this.flush(), 1000)
        }
      } catch (error) {
        // 发送失败，增加重试次数
        for (const event of validEvents) {
          await this.store.updateRetryCount(event.id)
        }

        // 安排下次重试
        this.scheduleRetry()
      }
    } catch (error) {
      console.error('[OfflineQueueManager] Flush error:', error)
      this.scheduleRetry()
    }
  }

  /**
   * 获取队列统计
   */
  async getStats(): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    oldestEvent: number | null
  }> {
    const events = await this.store.getAll()

    const eventsByType: Record<string, number> = {}
    let oldestTimestamp: number | null = null

    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1

      if (!oldestTimestamp || event.timestamp < oldestTimestamp) {
        oldestTimestamp = event.timestamp
      }
    }

    return {
      totalEvents: events.length,
      eventsByType,
      oldestEvent: oldestTimestamp,
    }
  }

  /**
   * 设置在线监听
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flush()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  /**
   * 安排重试
   */
  private scheduleRetry(): void {
    if (this.retryTimer) {
      return
    }

    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null
      this.flush()
    }, this.retryInterval)
  }
}
