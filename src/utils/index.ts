/**
 * @ldesign/monitor - 工具函数
 */

import type { DeviceInfo } from '../types'

/**
 * 生成简单 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 生成 UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 获取当前时间戳
 */
export function now(): number {
  return Date.now()
}

/**
 * 获取高精度时间
 */
export function getHighResolutionTime(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  }
  return Date.now()
}

/**
 * 获取设备信息
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {}
  }

  const ua = navigator.userAgent
  const info: DeviceInfo = {
    userAgent: ua,
    language: navigator.language,
  }

  // 检测浏览器
  if (ua.includes('Firefox')) {
    info.browser = 'Firefox'
  } else if (ua.includes('Edg')) {
    info.browser = 'Edge'
  } else if (ua.includes('Chrome')) {
    info.browser = 'Chrome'
  } else if (ua.includes('Safari')) {
    info.browser = 'Safari'
  }

  // 检测操作系统
  if (ua.includes('Windows')) {
    info.os = 'Windows'
  } else if (ua.includes('Mac')) {
    info.os = 'macOS'
  } else if (ua.includes('Linux')) {
    info.os = 'Linux'
  } else if (ua.includes('Android')) {
    info.os = 'Android'
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    info.os = 'iOS'
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
  const connection = (navigator as any).connection
  if (connection) {
    info.networkType = connection.effectiveType || connection.type
  }

  return info
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
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj)
  } catch (error) {
    return String(obj)
  }
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }

  return obj
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



















