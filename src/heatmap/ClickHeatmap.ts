/**
 * 点击热力图
 * 记录和可视化用户点击行为
 */

import { now } from '../utils'

/**
 * 点击热力数据接口
 */
export interface ClickHeatData {
  /**
   * 点击坐标
   */
  x: number
  y: number

  /**
   * 页面路径
   */
  path: string

  /**
   * 视口宽度
   */
  viewportWidth: number

  /**
   * 视口高度
   */
  viewportHeight: number

  /**
   * 时间戳
   */
  timestamp: number
}

/**
 * 点击热力图类
 */
export class ClickHeatmap {
  /**
   * 点击数据列表
   */
  private clicks: ClickHeatData[] = []

  /**
   * 最大数据量
   */
  private readonly maxClicks = 1000

  /**
   * 回调函数
   */
  private callbacks: Set<(data: ClickHeatData) => void> = new Set()

  /**
   * 是否已启动
   */
  private started = false

  /**
   * 点击处理器
   */
  private handleClick: (event: MouseEvent) => void

  constructor() {
    this.handleClick = this.onClick.bind(this)
  }

  /**
   * 启动收集
   */
  start(callback?: (data: ClickHeatData) => void): void {
    if (this.started) return

    if (callback) {
      this.callbacks.add(callback)
    }

    document.addEventListener('click', this.handleClick, true)
    this.started = true
  }

  /**
   * 处理点击
   */
  private onClick(event: MouseEvent): void {
    const data: ClickHeatData = {
      x: event.clientX,
      y: event.clientY,
      path: window.location.pathname,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timestamp: now(),
    }

    // 限制数据量
    if (this.clicks.length >= this.maxClicks) {
      this.clicks.shift()
    }

    this.clicks.push(data)

    this.callbacks.forEach((callback) => {
      try {
        callback(data)
      }
      catch (error) {
        console.error('[ClickHeatmap] Error in callback:', error)
      }
    })
  }

  /**
   * 获取热力图数据
   */
  getData(): ClickHeatData[] {
    return [...this.clicks]
  }

  /**
   * 获取指定页面的数据
   */
  getDataByPath(path: string): ClickHeatData[] {
    return this.clicks.filter(click => click.path === path)
  }

  /**
   * 清空数据
   */
  clear(): void {
    this.clicks = []
  }

  /**
   * 停止收集
   */
  stop(): void {
    document.removeEventListener('click', this.handleClick, true)
    this.callbacks.clear()
    this.started = false
  }
}

/**
 * 创建点击热力图实例
 */
export function createClickHeatmap(): ClickHeatmap {
  return new ClickHeatmap()
}





























