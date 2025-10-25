/**
 * Vue 3 integration
 */

import type { MonitorConfig } from '../types'
import { createMonitor, type Monitor } from '../core/Monitor'

// Vue types (avoiding direct import)
interface VueApp {
  provide(key: symbol | string, value: unknown): void
  config: {
    globalProperties: Record<string, unknown>
    errorHandler?: (err: Error, instance: unknown, info: string) => void
  }
}

interface VuePlugin {
  install(app: VueApp): void
}

const MonitorSymbol = Symbol('monitor')

/**
 * Create Vue plugin
 * 创建 Vue 插件
 * 
 * @param config - 监控配置
 * @returns Vue 插件实例
 */
export function createMonitorPlugin(config: MonitorConfig): VuePlugin {
  return {
    install(app: VueApp) {
      const monitor = createMonitor(config)
      monitor.init()

      // Provide monitor instance
      app.provide(MonitorSymbol, monitor)

      // Auto-track route changes if Vue Router is available
      const router = (app.config.globalProperties as Record<string, unknown>).$router
      if (router && typeof router === 'object' && 'afterEach' in router) {
        const vueRouter = router as { afterEach(callback: (to: { path?: string; fullPath?: string }) => void): void }
        vueRouter.afterEach((to) => {
          monitor.trackPageView(to.path || to.fullPath || '')
        })
      }

      // Track Vue errors
      app.config.errorHandler = (err, instance, info) => {
        const instanceObj = instance as { $options?: { name?: string } } | null
        monitor.trackError(err, {
          componentName: instanceObj?.$options?.name,
          errorInfo: info,
        })
      }
    },
  }
}

/**
 * Use monitor in component
 * 在组件中使用监控器
 * 
 * @returns Monitor 实例
 * @throws 如果 Vue 不可用或插件未安装
 */
export function useMonitor(): Monitor {
  // Note: This requires Vue to be available
  // We use a safer approach without require()
  let vueModule: { inject: (key: symbol) => unknown } | null = null

  try {
    // @ts-expect-error - Dynamic import for optional peer dependency
    vueModule = globalThis.Vue
  } catch {
    // Vue not available in global scope
  }

  if (!vueModule) {
    throw new Error('Vue is not available. Make sure Vue is properly loaded.')
  }

  const monitor = vueModule.inject(MonitorSymbol)
  if (!monitor) {
    throw new Error('Monitor not found. Did you install the plugin using app.use(createMonitorPlugin(config))?')
  }

  return monitor as Monitor
}

