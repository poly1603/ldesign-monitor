/**
 * @ldesign/monitor - 工具函数
 * 
 * 提供各种实用的工具函数，包括 ID 生成、时间、设备检测、性能优化等
 * @packageDocumentation
 */

import type { DeviceInfo } from '../types'

// ============ 缓存 ============

/** 设备信息缓存 */
let deviceInfoCache: DeviceInfo | null = null

/** UUID 计数器（用于高性能 UUID 生成） */
let uuidCounter = 0

// ============ ID 生成 ============

/**
 * 生成简单的唯一 ID
 * 基于时间戳和随机数生成
 * 
 * @returns 唯一 ID 字符串
 * 
 * @example
 * ```typescript
 * const id = generateId() // "1704067200000-abc1234"
 * ```
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 生成 UUID v4
 * 符合 RFC 4122 标准
 * 
 * @returns UUID 字符串
 * 
 * @example
 * ```typescript
 * const uuid = generateUUID() // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateUUID(): string {
  // 优先使用原生 crypto.randomUUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // 回退到手动生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 生成高性能的短 ID
 * 用于频繁调用场景
 * 
 * @returns 短 ID 字符串
 */
export function generateShortId(): string {
  uuidCounter = (uuidCounter + 1) % 0xFFFFFF
  return `${Date.now().toString(36)}${uuidCounter.toString(36)}`
}

// ============ 时间工具 ============

/**
 * 获取当前时间戳（毫秒）
 * 
 * @returns 当前时间戳
 */
export function now(): number {
  return Date.now()
}

/**
 * 获取高精度时间（毫秒，带小数）
 * 用于性能测量
 * 
 * @returns 高精度时间
 */
export function getHighResolutionTime(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  }
  return Date.now()
}

/**
 * 获取设备信息（带缓存）
 * 结果会被缓存，避免重复计算
 * 
 * @param forceRefresh - 是否强制刷新缓存
 * @returns 设备信息对象
 * 
 * @example
 * ```typescript
 * const device = getDeviceInfo()
 * console.log(device.browser) // "Chrome"
 * console.log(device.os) // "Windows"
 * ```
 */
export function getDeviceInfo(forceRefresh = false): DeviceInfo {
  // 返回缓存（除非强制刷新）
  if (deviceInfoCache && !forceRefresh) {
    return { ...deviceInfoCache }
  }

  if (typeof window === 'undefined') {
    return {}
  }

  const ua = navigator.userAgent
  const info: DeviceInfo = {
    userAgent: ua,
    language: navigator.language,
  }

  // 检测浏览器和版本
  const browserPatterns: Array<[RegExp, string]> = [
    [/Firefox\/(\d+)/, 'Firefox'],
    [/Edg\/(\d+)/, 'Edge'],
    [/Chrome\/(\d+)/, 'Chrome'],
    [/Safari\/(\d+)/, 'Safari'],
    [/MSIE (\d+)/, 'IE'],
    [/Trident\/.*rv:(\d+)/, 'IE'],
  ]

  for (const [pattern, name] of browserPatterns) {
    const match = ua.match(pattern)
    if (match) {
      info.browser = name
      info.browserVersion = match[1]
      break
    }
  }

  // 检测操作系统和版本
  const osPatterns: Array<[RegExp, string]> = [
    [/Windows NT (\d+\.\d+)/, 'Windows'],
    [/Mac OS X ([\d_]+)/, 'macOS'],
    [/Linux/, 'Linux'],
    [/Android ([\d.]+)/, 'Android'],
    [/iPhone OS ([\d_]+)/, 'iOS'],
    [/iPad.*OS ([\d_]+)/, 'iOS'],
  ]

  for (const [pattern, name] of osPatterns) {
    const match = ua.match(pattern)
    if (match) {
      info.os = name
      if (match[1]) {
        info.osVersion = match[1].replace(/_/g, '.')
      }
      break
    }
  }

  // 检测设备类型
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    info.deviceType = 'tablet'
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    info.deviceType = 'mobile'
  } else {
    info.deviceType = 'desktop'
  }

  // 屏幕信息
  if (window.screen) {
    info.screenResolution = `${window.screen.width}x${window.screen.height}`
  }

  // 视口信息
  if (window.innerWidth && window.innerHeight) {
    info.viewportSize = `${window.innerWidth}x${window.innerHeight}`
  }

  // 网络类型
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; type?: string } }).connection
  if (connection) {
    info.networkType = connection.effectiveType || connection.type
  }

  // 缓存结果
  deviceInfoCache = info

  return { ...info }
}

/**
 * 清除设备信息缓存
 */
export function clearDeviceInfoCache(): void {
  deviceInfoCache = null
}

/**
 * 获取页面信息
 */
export function getPageInfo() {
  if (typeof window === 'undefined') {
    return {}
  }

  return {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
  }
}

/**
 * 安全的 JSON 序列化
 * 确保始终返回字符串，即使输入是 undefined
 * 
 * @param obj - 要序列化的对象
 * @returns JSON 字符串
 */
export function safeStringify(obj: unknown): string {
  if (obj === undefined) {
    return 'undefined'
  }
  try {
    const result = JSON.stringify(obj)
    // JSON.stringify 对 undefined 返回 undefined
    return result === undefined ? 'undefined' : result
  } catch {
    return String(obj)
  }
}

/**
 * 深拷贝对象
 * 优先使用 structuredClone，回退到手动实现
 * 
 * @template T - 对象类型
 * @param obj - 要拷贝的对象
 * @returns 深拷贝后的对象
 * 
 * @example
 * ```typescript
 * const original = { a: 1, b: { c: 2 } }
 * const cloned = deepClone(original)
 * cloned.b.c = 3
 * console.log(original.b.c) // 2
 * ```
 */
export function deepClone<T>(obj: T): T {
  // 处理基本类型和 null
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // 优先使用原生 structuredClone
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj)
    } catch {
      // structuredClone 不支持某些类型（如函数），回退到手动实现
    }
  }

  // 手动实现深拷贝
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T
  }

  if (obj instanceof Map) {
    const clonedMap = new Map()
    obj.forEach((value, key) => {
      clonedMap.set(deepClone(key), deepClone(value))
    })
    return clonedMap as T
  }

  if (obj instanceof Set) {
    const clonedSet = new Set()
    obj.forEach((value) => {
      clonedSet.add(deepClone(value))
    })
    return clonedSet as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T
  }

  // 普通对象
  const clonedObj = Object.create(Object.getPrototypeOf(obj)) as T
  for (const key of Object.keys(obj)) {
    (clonedObj as Record<string, unknown>)[key] = deepClone((obj as Record<string, unknown>)[key])
  }

  return clonedObj
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let previous = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

/**
 * 获取元素选择器
 */
export function getElementSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`
  }

  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean)
    if (classes.length > 0) {
      return `.${classes.join('.')}`
    }
  }

  return element.tagName.toLowerCase()
}

/**
 * 是否为移动设备
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
    navigator.userAgent
  )
}

/**
 * 检查 API 是否支持
 */
export function isAPISupported(api: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return api in window
}

/**
 * 字符串哈希
 */
export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * 格式化字节
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 格式化时长
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}min`
}

/**
 * 是否为生产环境
 */
export function isProduction(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production'
  }
  return true
}

/**
 * 安全执行函数
 */
export function safeExecute<T>(fn: () => T, defaultValue?: T): T | undefined {
  try {
    return fn()
  } catch (error) {
    console.error('[Monitor] Error executing function:', error)
    return defaultValue
  }
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * requestIdleCallback 的 Polyfill
 * 优先使用原生 API，降级到 setTimeout
 * 
 * @param callback - 回调函数
 * @param options - 选项
 * @returns 取消函数
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }

  // Polyfill: 使用 setTimeout
  const timeout = options?.timeout ?? 1
  return setTimeout(callback, timeout) as unknown as number
}

/**
 * cancelIdleCallback 的 Polyfill
 * 
 * @param id - requestIdleCallback 返回的 ID
 */
export function cancelIdleCallback(id: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

/**
 * 带有最大等待时间的防抖函数
 * 确保在最大等待时间内至少执行一次
 * 
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @param maxWait - 最大等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounceWithMaxWait<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  maxWait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let lastCallTime = 0

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()

    if (timeout) {
      clearTimeout(timeout)
    }

    // 检查是否超过最大等待时间
    if (lastCallTime && now - lastCallTime >= maxWait) {
      lastCallTime = now
      func.apply(this, args)
      return
    }

    timeout = setTimeout(() => {
      lastCallTime = Date.now()
      func.apply(this, args)
    }, wait)

    if (!lastCallTime) {
      lastCallTime = now
    }
  }
}

/**
 * 使用 RAF (requestAnimationFrame) 的节流函数
 * 适用于需要与渲染同步的操作
 * 
 * @param func - 要节流的函数
 * @returns 节流后的函数
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  let latestArgs: Parameters<T> | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    latestArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs) {
          func.apply(this, latestArgs)
          latestArgs = null
        }
        rafId = null
      })
    }
  }
}

/**
 * 批处理函数执行
 * 将多次调用合并为一次批处理
 * 
 * @param func - 批处理函数，接收所有累积的参数
 * @param wait - 等待时间（毫秒）
 * @param maxSize - 最大批处理大小
 * @returns 批处理包装函数
 */
export function batch<T>(
  func: (items: T[]) => void,
  wait: number = 100,
  maxSize: number = 10
): (item: T) => void {
  let items: T[] = []
  let timeout: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    if (items.length > 0) {
      const batch = [...items]
      items = []
      func(batch)
    }
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return (item: T) => {
    items.push(item)

    // 达到最大批处理大小，立即执行
    if (items.length >= maxSize) {
      flush()
      return
    }

    // 设置延迟执行
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(flush, wait)
  }
}




























