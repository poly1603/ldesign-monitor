/**
 * 设备检测器
 * 检测和收集设备信息
 */

import type { DeviceInfo } from '../types'
import { getDeviceInfo as getDeviceInfoUtil } from '../utils'

/**
 * 设备检测器类
 */
export class DeviceDetector {
  /**
   * 设备信息缓存
   */
  private deviceInfo: DeviceInfo | null = null

  /**
   * 获取设备信息
   * 
   * @returns 设备信息
   */
  getDeviceInfo(): DeviceInfo {
    if (this.deviceInfo) {
      return this.deviceInfo
    }

    this.deviceInfo = this.collectDeviceInfo()
    return this.deviceInfo
  }

  /**
   * 收集设备信息
   * 
   * @returns 设备信息
   */
  private collectDeviceInfo(): DeviceInfo {
    const baseInfo = getDeviceInfoUtil()

    return {
      ...baseInfo,
      ...this.getAdditionalInfo(),
    }
  }

  /**
   * 获取额外的设备信息
   * 
   * @returns 额外信息
   */
  private getAdditionalInfo(): Partial<DeviceInfo> {
    const additional: Partial<DeviceInfo> = {}

    // 获取内存信息（如果可用）
    const memory = (performance as any).memory
    if (memory) {
      additional.memory = {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      } as any
    }

    // 获取设备像素比
    if (window.devicePixelRatio) {
      additional.pixelRatio = window.devicePixelRatio as any
    }

    // 获取触摸支持
    additional.touchSupport = 'ontouchstart' in window as any

    // 获取最大触摸点数
    if (navigator.maxTouchPoints) {
      additional.maxTouchPoints = navigator.maxTouchPoints as any
    }

    return additional
  }

  /**
   * 刷新设备信息
   * 重新收集设备信息（用于检测动态变化，如屏幕旋转）
   */
  refresh(): void {
    this.deviceInfo = null
  }

  /**
   * 获取设备指纹
   * 基于设备信息生成唯一标识
   * 
   * @returns 设备指纹
   */
  getDeviceFingerprint(): string {
    const info = this.getDeviceInfo()

    const components = [
      info.userAgent,
      info.screenResolution,
      info.language,
      String(info.pixelRatio || ''),
      String(info.touchSupport || ''),
    ]

    // 简单的哈希函数
    const str = components.join('|')
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    return `device-${Math.abs(hash).toString(36)}`
  }
}

/**
 * 创建设备检测器实例
 * 
 * @returns 设备检测器实例
 */
export function createDeviceDetector(): DeviceDetector {
  return new DeviceDetector()
}




