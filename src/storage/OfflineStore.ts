/**
 * @ldesign/monitor - 离线存储
 * 
 * 使用 IndexedDB 缓存离线数据，网络恢复时自动上报
 */

import type { ReportData } from '../types'

/**
 * 离线存储配置
 */
export interface OfflineStoreConfig {
  /**
   * 数据库名称
   * @default 'monitor-offline'
   */
  dbName?: string

  /**
   * 数据库版本
   * @default 1
   */
  dbVersion?: number

  /**
   * 存储名称
   * @default 'reports'
   */
  storeName?: string

  /**
   * 最大存储数量
   * @default 100
   */
  maxItems?: number

  /**
   * 数据过期时间（毫秒）
   * @default 7 * 24 * 60 * 60 * 1000 (7天)
   */
  expireTime?: number
}

/**
 * 存储项
 */
interface StorageItem {
  /**
   * 唯一 ID
   */
  id: string

  /**
   * 上报数据
   */
  data: ReportData

  /**
   * 创建时间
   */
  timestamp: number

  /**
   * 重试次数
   */
  retryCount: number
}

/**
 * 离线存储类
 */
export class OfflineStore {
  private config: Required<OfflineStoreConfig>
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  constructor(config: OfflineStoreConfig = {}) {
    this.config = {
      dbName: config.dbName ?? 'monitor-offline',
      dbVersion: config.dbVersion ?? 1,
      storeName: config.storeName ?? 'reports',
      maxItems: config.maxItems ?? 100,
      expireTime: config.expireTime ?? 7 * 24 * 60 * 60 * 1000,
    }
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    if (!this.isIndexedDBSupported()) {
      console.warn('[OfflineStore] IndexedDB is not supported')
      return
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion)

      request.onerror = () => {
        console.error('[OfflineStore] Failed to open database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建存储对象（如果不存在）
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'id' })

          // 创建索引
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('retryCount', 'retryCount', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * 检查 IndexedDB 是否支持
   */
  private isIndexedDBSupported(): boolean {
    return typeof indexedDB !== 'undefined'
  }

  /**
   * 保存数据
   * 
   * @param data - 上报数据
   * @returns Promise<void>
   */
  async save(data: ReportData): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    // 检查存储数量限制
    const count = await this.count()
    if (count >= this.config.maxItems) {
      // 删除最旧的数据
      await this.removeOldest()
    }

    const item: StorageItem = {
      id: this.generateId(),
      data,
      timestamp: Date.now(),
      retryCount: 0,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.add(item)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 批量保存数据
   * 
   * @param dataList - 上报数据列表
   * @returns Promise<void>
   */
  async saveBatch(dataList: ReportData[]): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)

      for (const data of dataList) {
        const item: StorageItem = {
          id: this.generateId(),
          data,
          timestamp: Date.now(),
          retryCount: 0,
        }
        store.add(item)
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * 获取所有数据
   * 
   * @param limit - 限制数量
   * @returns Promise<StorageItem[]>
   */
  async getAll(limit?: number): Promise<StorageItem[]> {
    await this.init()

    if (!this.db) {
      return []
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.getAll(limit)

      request.onsuccess = () => {
        const items = request.result

        // 过滤过期数据
        const now = Date.now()
        const validItems = items.filter(
          item => now - item.timestamp < this.config.expireTime
        )

        resolve(validItems)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除数据
   * 
   * @param id - 数据 ID
   * @returns Promise<void>
   */
  async remove(id: string): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 批量删除数据
   * 
   * @param ids - 数据 ID 列表
   * @returns Promise<void>
   */
  async removeBatch(ids: string[]): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)

      for (const id of ids) {
        store.delete(id)
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * 清空所有数据
   * 
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取数据数量
   * 
   * @returns Promise<number>
   */
  async count(): Promise<number> {
    await this.init()

    if (!this.db) {
      return 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除最旧的数据
   */
  private async removeOldest(): Promise<void> {
    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)
      const index = store.index('timestamp')
      const request = index.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          resolve()
        } else {
          reject(new Error('No items to delete'))
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }
}

/**
 * 创建离线存储实例
 * 
 * @param config - 配置
 * @returns 离线存储实例
 */
export function createOfflineStore(config?: OfflineStoreConfig): OfflineStore {
  return new OfflineStore(config)
}

