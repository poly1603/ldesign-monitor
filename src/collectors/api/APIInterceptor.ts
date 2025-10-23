/**
 * API 拦截器
 * 拦截 XHR 和 Fetch 请求，监控 API 调用
 */

import { now } from '../../utils'

/**
 * API 请求数据接口
 */
export interface APIRequestData {
  /**
   * 请求 URL
   */
  url: string

  /**
   * 请求方法
   */
  method: string

  /**
   * 请求头
   */
  headers?: Record<string, string>

  /**
   * 请求体
   */
  body?: unknown

  /**
   * HTTP 状态码
   */
  status?: number

  /**
   * 响应时间（毫秒）
   */
  duration: number

  /**
   * 是否成功
   */
  success: boolean

  /**
   * 错误信息
   */
  error?: string

  /**
   * 响应大小（字节）
   */
  responseSize?: number

  /**
   * 时间戳
   */
  timestamp: number
}

/**
 * API 拦截器配置
 */
export interface APIInterceptorConfig {
  /**
   * 是否拦截 XHR
   * @default true
   */
  interceptXHR?: boolean

  /**
   * 是否拦截 Fetch
   * @default true
   */
  interceptFetch?: boolean

  /**
   * 是否捕获请求头
   * @default false
   */
  captureHeaders?: boolean

  /**
   * 是否捕获请求体
   * @default false
   */
  captureBody?: boolean

  /**
   * URL 过滤器（返回 false 则不追踪）
   */
  urlFilter?: (url: string) => boolean
}

/**
 * API 拦截器类
 */
export class APIInterceptor {
  /**
   * 配置
   */
  private config: Required<APIInterceptorConfig>

  /**
   * 回调函数列表
   */
  private callbacks: Set<(data: APIRequestData) => void> = new Set()

  /**
   * 是否已启动
   */
  private started = false

  /**
   * 原始 XHR
   */
  private originalXHR: typeof XMLHttpRequest | null = null

  /**
   * 原始 Fetch
   */
  private originalFetch: typeof fetch | null = null

  constructor(config: APIInterceptorConfig = {}) {
    this.config = {
      interceptXHR: config.interceptXHR ?? true,
      interceptFetch: config.interceptFetch ?? true,
      captureHeaders: config.captureHeaders ?? false,
      captureBody: config.captureBody ?? false,
      urlFilter: config.urlFilter ?? (() => true),
    }
  }

  /**
   * 启动拦截
   */
  start(callback?: (data: APIRequestData) => void): void {
    if (this.started) {
      return
    }

    if (callback) {
      this.callbacks.add(callback)
    }

    if (this.config.interceptXHR) {
      this.interceptXHR()
    }

    if (this.config.interceptFetch) {
      this.interceptFetch()
    }

    this.started = true
  }

  /**
   * 拦截 XMLHttpRequest
   */
  private interceptXHR(): void {
    this.originalXHR = XMLHttpRequest

    const self = this

    // @ts-ignore
    window.XMLHttpRequest = function () {
      // @ts-ignore
      const xhr = new self.originalXHR()
      const startTime = now()
      let url = ''
      let method = ''

      // 拦截 open
      const originalOpen = xhr.open
      xhr.open = function (m: string, u: string, ...args: any[]) {
        method = m
        url = u
        return originalOpen.call(this, m, u, ...args)
      }

      // 拦截 send
      const originalSend = xhr.send
      xhr.send = function (body?: any) {
        // 应用 URL 过滤器
        if (!self.config.urlFilter(url)) {
          return originalSend.call(this, body)
        }

        // 监听完成
        xhr.addEventListener('loadend', () => {
          const duration = now() - startTime
          const success = xhr.status >= 200 && xhr.status < 400

          const data: APIRequestData = {
            url,
            method,
            status: xhr.status,
            duration,
            success,
            timestamp: startTime,
          }

          if (self.config.captureHeaders) {
            const headers: Record<string, string> = {}
            const headerStr = xhr.getAllResponseHeaders()
            headerStr.split('\r\n').forEach((line) => {
              const [key, value] = line.split(': ')
              if (key) {
                headers[key] = value
              }
            })
            data.headers = headers
          }

          if (!success) {
            data.error = xhr.statusText || 'Request failed'
          }

          self.emit(data)
        })

        return originalSend.call(this, body)
      }

      return xhr
    }
  }

  /**
   * 拦截 Fetch
   */
  private interceptFetch(): void {
    this.originalFetch = window.fetch

    const self = this

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const startTime = now()
      let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const method = init?.method || 'GET'

      // 应用 URL 过滤器
      if (!self.config.urlFilter(url)) {
        return self.originalFetch!.call(window, input, init)
      }

      return self.originalFetch!
        .call(window, input, init)
        .then((response) => {
          const duration = now() - startTime
          const success = response.ok

          const data: APIRequestData = {
            url,
            method,
            status: response.status,
            duration,
            success,
            timestamp: startTime,
          }

          if (self.config.captureHeaders && response.headers) {
            const headers: Record<string, string> = {}
            response.headers.forEach((value, key) => {
              headers[key] = value
            })
            data.headers = headers
          }

          if (!success) {
            data.error = response.statusText || 'Request failed'
          }

          self.emit(data)

          return response
        })
        .catch((error) => {
          const duration = now() - startTime

          const data: APIRequestData = {
            url,
            method,
            duration,
            success: false,
            error: error.message || 'Request failed',
            timestamp: startTime,
          }

          self.emit(data)

          throw error
        })
    }
  }

  /**
   * 发射事件
   */
  private emit(data: APIRequestData): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(data)
      }
      catch (error) {
        console.error('[APIInterceptor] Error in callback:', error)
      }
    })
  }

  /**
   * 添加回调
   */
  onRequest(callback: (data: APIRequestData) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * 停止拦截
   */
  stop(): void {
    // 恢复原始 XHR
    if (this.originalXHR) {
      window.XMLHttpRequest = this.originalXHR
      this.originalXHR = null
    }

    // 恢复原始 Fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch
      this.originalFetch = null
    }

    this.callbacks.clear()
    this.started = false
  }
}

/**
 * 创建 API 拦截器实例
 */
export function createAPIInterceptor(config?: APIInterceptorConfig): APIInterceptor {
  return new APIInterceptor(config)
}

