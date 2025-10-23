/**
 * Beacon 上报器
 * 使用 navigator.sendBeacon 上报数据，适用于页面卸载时
 */

import type { BeaconReporterConfig, IReporter, ReportData } from '../types/reporter'
import { safeStringify } from '../utils'

/**
 * Beacon 上报器类
 */
export class BeaconReporter implements IReporter {
  /**
   * 配置
   */
  private config: Required<BeaconReporterConfig>

  constructor(config: BeaconReporterConfig) {
    this.config = {
      url: config.url,
      contentType: config.contentType ?? 'application/json',
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

    // 检查 sendBeacon 是否可用
    if (typeof navigator.sendBeacon !== 'function') {
      console.warn('[BeaconReporter] navigator.sendBeacon not supported')
      throw new Error('navigator.sendBeacon not supported')
    }

    try {
      const blob = this.prepareBlob(batch)
      const success = navigator.sendBeacon(this.config.url, blob)

      if (!success) {
        throw new Error('sendBeacon returned false')
      }
    }
    catch (error) {
      console.error('[BeaconReporter] Failed to send data:', error)
      throw error
    }
  }

  /**
   * 刷新队列（对于 Beacon 上报器，这是一个空操作）
   */
  async flush(): Promise<void> {
    // Beacon 上报器不需要刷新操作
  }

  /**
   * 准备 Blob 数据
   * 
   * @param batch - 数据批次
   * @returns Blob 对象
   */
  private prepareBlob(batch: ReportData[]): Blob {
    const data = safeStringify(batch)
    return new Blob([data], { type: this.config.contentType })
  }
}

/**
 * 创建 Beacon 上报器实例
 * 
 * @param config - 配置
 * @returns Beacon 上报器实例
 */
export function createBeaconReporter(config: BeaconReporterConfig): BeaconReporter {
  return new BeaconReporter(config)
}


