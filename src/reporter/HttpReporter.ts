/**
 * HTTP 上报器
 * 使用 HTTP 请求上报数据
 */

import type { HttpReporterConfig, IReporter, ReportData } from '../types/reporter'
import { safeStringify } from '../utils'

/**
 * HTTP 上报器类
 */
export class HttpReporter implements IReporter {
  /**
   * 配置
   */
  private config: Required<HttpReporterConfig>

  constructor(config: HttpReporterConfig) {
    this.config = {
      url: config.url,
      method: config.method ?? 'POST',
      headers: config.headers ?? {},
      timeout: config.timeout ?? 5000,
      compress: config.compress ?? true,
      json: config.json ?? true,
    }
  }

  /**
   * 发送单条数据
   * 
   * @param data - 上报数据
   */
  async send(data: ReportData | ReportData[]): Promise<void> {
    const dataArray = Array.isArray(data) ? data : [data]
    return this.sendBatch(dataArray)
  }

  /**
   * 批量发送数据
   * 
   * @param batch - 数据批次
   */
  async sendBatch(batch: ReportData[]): Promise<void> {
    if (batch.length === 0) {
      return
    }

    try {
      const body = this.prepareBody(batch)
      const headers = this.prepareHeaders()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(this.config.url, {
        method: this.config.method,
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    }
    catch (error) {
      console.error('[HttpReporter] Failed to send data:', error)
      throw error
    }
  }

  /**
   * 刷新队列（对于 HTTP 上报器，这是一个空操作）
   */
  async flush(): Promise<void> {
    // HTTP 上报器不需要刷新操作
  }

  /**
   * 准备请求体
   * 
   * @param batch - 数据批次
   * @returns 请求体
   */
  private prepareBody(batch: ReportData[]): string | Blob {
    let body: string

    if (this.config.json) {
      body = safeStringify(batch)
    }
    else {
      body = batch.map(item => safeStringify(item)).join('\n')
    }

    // 压缩（简化实现，实际应使用 gzip）
    if (this.config.compress) {
      // TODO: 实现真正的压缩
      // 这里只是一个占位符
    }

    return body
  }

  /**
   * 准备请求头
   * 
   * @returns 请求头
   */
  private prepareHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': this.config.json ? 'application/json' : 'text/plain',
      ...this.config.headers,
    }

    if (this.config.compress) {
      headers['Content-Encoding'] = 'gzip'
    }

    return headers
  }
}

/**
 * 创建 HTTP 上报器实例
 * 
 * @param config - 配置
 * @returns HTTP 上报器实例
 */
export function createHttpReporter(config: HttpReporterConfig): HttpReporter {
  return new HttpReporter(config)
}




















