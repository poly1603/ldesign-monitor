/**
 * @ldesign/monitor - 插件系统
 * 
 * 提供可扩展的插件机制，允许用户自定义监控行为
 * @packageDocumentation
 */

import type { MonitorConfig, ReportData } from '../types'
import type { Monitor } from '../core/Monitor'
import { PluginError } from '../errors'

/**
 * 插件生命周期钩子
 */
export interface PluginHooks {
  /**
   * 监控器初始化前
   * @param config - 监控配置
   * @returns 修改后的配置或 void
   */
  beforeInit?: (config: MonitorConfig) => MonitorConfig | void

  /**
   * 监控器初始化后
   * @param monitor - 监控器实例
   */
  afterInit?: (monitor: Monitor) => void

  /**
   * 数据上报前
   * @param data - 上报数据
   * @returns 修改后的数据、null（丢弃）或 void
   */
  beforeReport?: (data: ReportData) => ReportData | null | void

  /**
   * 数据上报后
   * @param data - 上报数据
   * @param success - 是否成功
   */
  afterReport?: (data: ReportData, success: boolean) => void

  /**
   * 错误捕获时
   * @param error - 错误对象
   * @param context - 上下文信息
   * @returns 是否继续处理
   */
  onError?: (error: Error, context?: Record<string, unknown>) => boolean | void

  /**
   * 性能数据收集时
   * @param metric - 性能指标名称
   * @param value - 性能指标值
   */
  onPerformance?: (metric: string, value: number) => void

  /**
   * 监控器销毁前
   */
  beforeDestroy?: () => void

  /**
   * 监控器销毁后
   */
  afterDestroy?: () => void
}

/**
 * 插件接口
 */
export interface MonitorPlugin {
  /**
   * 插件名称（必须唯一）
   */
  readonly name: string

  /**
   * 插件版本
   */
  readonly version?: string

  /**
   * 插件依赖的其他插件
   */
  readonly dependencies?: string[]

  /**
   * 插件生命周期钩子
   */
  hooks?: PluginHooks

  /**
   * 安装插件
   * @param monitor - 监控器实例
   * @param options - 插件配置选项
   */
  install?(monitor: Monitor, options?: Record<string, unknown>): void

  /**
   * 卸载插件
   * @param monitor - 监控器实例
   */
  uninstall?(monitor: Monitor): void
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /**
   * 插件实例或创建函数
   */
  plugin: MonitorPlugin | (() => MonitorPlugin)

  /**
   * 插件配置选项
   */
  options?: Record<string, unknown>

  /**
   * 是否启用
   * @default true
   */
  enabled?: boolean
}

/**
 * 插件管理器
 * 管理插件的注册、执行和生命周期
 */
export class PluginManager {
  /** 已注册的插件 */
  private readonly plugins: Map<string, MonitorPlugin> = new Map()
  /** 插件配置 */
  private readonly pluginConfigs: Map<string, Record<string, unknown>> = new Map()
  /** 插件执行顺序 */
  private readonly executionOrder: string[] = []
  /** 监控器实例引用 */
  private monitor: Monitor | null = null

  /**
   * 注册插件
   * 
   * @param plugin - 插件实例或配置
   * @param options - 插件配置选项
   * @throws {PluginError} 插件无效或已存在时抛出
   * 
   * @example
   * ```typescript
   * pluginManager.register(myPlugin)
   * pluginManager.register(myPlugin, { option1: 'value' })
   * ```
   */
  register(plugin: MonitorPlugin | PluginConfig, options?: Record<string, unknown>): this {
    let pluginInstance: MonitorPlugin
    let pluginOptions: Record<string, unknown> | undefined

    if ('plugin' in plugin) {
      // PluginConfig
      const config = plugin as PluginConfig
      if (config.enabled === false) {
        return this
      }
      pluginInstance = typeof config.plugin === 'function' ? config.plugin() : config.plugin
      pluginOptions = config.options
    } else {
      pluginInstance = plugin
      pluginOptions = options
    }

    // 验证插件
    if (!pluginInstance.name) {
      throw new PluginError('Plugin must have a name', 'unknown')
    }

    if (this.plugins.has(pluginInstance.name)) {
      throw new PluginError(`Plugin "${pluginInstance.name}" is already registered`, pluginInstance.name)
    }

    // 检查依赖
    if (pluginInstance.dependencies) {
      for (const dep of pluginInstance.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new PluginError(
            `Plugin "${pluginInstance.name}" depends on "${dep}" which is not registered`,
            pluginInstance.name
          )
        }
      }
    }

    this.plugins.set(pluginInstance.name, pluginInstance)
    if (pluginOptions) {
      this.pluginConfigs.set(pluginInstance.name, pluginOptions)
    }
    this.executionOrder.push(pluginInstance.name)

    // 如果监控器已经初始化，立即安装插件
    if (this.monitor && pluginInstance.install) {
      try {
        pluginInstance.install(this.monitor, pluginOptions)
      } catch (error) {
        throw new PluginError(
          `Failed to install plugin "${pluginInstance.name}"`,
          pluginInstance.name,
          error instanceof Error ? error : undefined
        )
      }
    }

    return this
  }

  /**
   * 注销插件
   * 
   * @param name - 插件名称
   */
  unregister(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      return false
    }

    // 检查是否有其他插件依赖此插件
    for (const [otherName, otherPlugin] of this.plugins) {
      if (otherPlugin.dependencies?.includes(name)) {
        throw new PluginError(
          `Cannot unregister plugin "${name}" because "${otherName}" depends on it`,
          name
        )
      }
    }

    // 卸载插件
    if (this.monitor && plugin.uninstall) {
      try {
        plugin.uninstall(this.monitor)
      } catch (error) {
        console.error(`[PluginManager] Error uninstalling plugin "${name}":`, error)
      }
    }

    this.plugins.delete(name)
    this.pluginConfigs.delete(name)
    const index = this.executionOrder.indexOf(name)
    if (index !== -1) {
      this.executionOrder.splice(index, 1)
    }

    return true
  }

  /**
   * 获取插件
   * 
   * @param name - 插件名称
   * @returns 插件实例或 undefined
   */
  get(name: string): MonitorPlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 检查插件是否已注册
   * 
   * @param name - 插件名称
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * 获取所有已注册的插件名称
   */
  getPluginNames(): string[] {
    return [...this.executionOrder]
  }

  /**
   * 设置监控器实例
   * 
   * @param monitor - 监控器实例
   */
  setMonitor(monitor: Monitor): void {
    this.monitor = monitor

    // 安装所有已注册的插件
    for (const name of this.executionOrder) {
      const plugin = this.plugins.get(name)!
      if (plugin.install) {
        try {
          plugin.install(monitor, this.pluginConfigs.get(name))
        } catch (error) {
          console.error(`[PluginManager] Error installing plugin "${name}":`, error)
        }
      }
    }
  }

  /**
   * 执行钩子
   * 
   * @template K - 钩子名称
   * @param hookName - 钩子名称
   * @param args - 钩子参数
   * @returns 最后一个返回非 void 值的结果
   */
  executeHook<K extends keyof PluginHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): ReturnType<NonNullable<PluginHooks[K]>> | undefined {
    let result: ReturnType<NonNullable<PluginHooks[K]>> | undefined

    for (const name of this.executionOrder) {
      const plugin = this.plugins.get(name)!
      const hook = plugin.hooks?.[hookName]
      
      if (hook) {
        try {
          const hookResult = (hook as Function)(...args)
          if (hookResult !== undefined) {
            result = hookResult
          }
        } catch (error) {
          console.error(`[PluginManager] Error in hook "${hookName}" of plugin "${name}":`, error)
        }
      }
    }

    return result
  }

  /**
   * 执行钩子（异步）
   * 
   * @template K - 钩子名称
   * @param hookName - 钩子名称
   * @param args - 钩子参数
   */
  async executeHookAsync<K extends keyof PluginHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): Promise<ReturnType<NonNullable<PluginHooks[K]>> | undefined> {
    let result: ReturnType<NonNullable<PluginHooks[K]>> | undefined

    for (const name of this.executionOrder) {
      const plugin = this.plugins.get(name)!
      const hook = plugin.hooks?.[hookName]
      
      if (hook) {
        try {
          const hookResult = await Promise.resolve((hook as Function)(...args))
          if (hookResult !== undefined) {
            result = hookResult
          }
        } catch (error) {
          console.error(`[PluginManager] Error in async hook "${hookName}" of plugin "${name}":`, error)
        }
      }
    }

    return result
  }

  /**
   * 销毁插件管理器
   * 卸载所有插件
   */
  destroy(): void {
    // 反向卸载插件
    for (let i = this.executionOrder.length - 1; i >= 0; i--) {
      const name = this.executionOrder[i]
      const plugin = this.plugins.get(name)!
      
      if (this.monitor && plugin.uninstall) {
        try {
          plugin.uninstall(this.monitor)
        } catch (error) {
          console.error(`[PluginManager] Error uninstalling plugin "${name}":`, error)
        }
      }
    }

    this.plugins.clear()
    this.pluginConfigs.clear()
    this.executionOrder.length = 0
    this.monitor = null
  }
}

/**
 * 创建插件
 * 辅助函数，用于创建类型安全的插件
 * 
 * @param plugin - 插件定义
 * @returns 插件实例
 * 
 * @example
 * ```typescript
 * const myPlugin = createPlugin({
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   hooks: {
 *     beforeReport: (data) => {
 *       // 修改数据
 *       return data
 *     }
 *   },
 *   install: (monitor) => {
 *     console.log('Plugin installed!')
 *   }
 * })
 * ```
 */
export function createPlugin(plugin: MonitorPlugin): MonitorPlugin {
  return plugin
}

/**
 * 创建插件管理器
 * 
 * @returns 插件管理器实例
 */
export function createPluginManager(): PluginManager {
  return new PluginManager()
}
