/**
 * Vue 3 集成
 * 提供 Vue 插件和 composables
 */

import type { App, Plugin } from 'vue'
import { inject, onMounted, onUnmounted } from 'vue'
import type { Monitor } from '../core/Monitor'
import { createMonitor } from '../core/Monitor'
import type { MonitorConfig } from '../types'

/**
 * Vue 注入键
 */
const MONITOR_INJECTION_KEY = Symbol('monitor')

/**
 * Vue 插件配置
 */
export interface MonitorPluginOptions extends MonitorConfig {
  /**
   * 是否自动追踪路由
   * @default true
   */
  trackRoutes?: boolean

  /**
   * 是否捕获 Vue 错误
   * @default true
   */
  captureVueErrors?: boolean
}

/**
 * 创建 Vue 插件
 */
export function createMonitorPlugin(options: MonitorPluginOptions): Plugin {
  return {
    install(app: App) {
      // 创建监控实例
      const monitor = createMonitor(options)

      // 提供监控实例
      app.provide(MONITOR_INJECTION_KEY, monitor)

      // 捕获 Vue 错误
      if (options.captureVueErrors !== false) {
        app.config.errorHandler = (err, instance, info) => {
          monitor.trackError(err as Error, {
            vue: {
              componentName: instance?.$options.name,
              lifecycle: info,
            },
          })
        }
      }

      // 追踪路由（如果使用 Vue Router）
      if (options.trackRoutes !== false) {
        app.mixin({
          mounted() {
            const router = (this as any).$router
            if (router) {
              router.afterEach((to: any) => {
                monitor.trackPageView(to.path)
              })
            }
          },
        })
      }
    },
  }
}

/**
 * useMonitor composable
 * 
 * @returns Monitor 实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useMonitor } from '@ldesign/monitor/vue'
 * 
 * const monitor = useMonitor()
 * 
 * const handleClick = () => {
 *   monitor.trackEvent('button-click', { buttonId: 'save' })
 * }
 * </script>
 * ```
 */
export function useMonitor(): Monitor {
  const monitor = inject<Monitor>(MONITOR_INJECTION_KEY)

  if (!monitor) {
    throw new Error('[useMonitor] Monitor plugin not installed. Use app.use(createMonitorPlugin(...))')
  }

  return monitor
}

/**
 * usePageTracking composable
 * 自动追踪组件的页面浏览
 */
export function usePageTracking(pageName: string): void {
  const monitor = useMonitor()

  onMounted(() => {
    monitor.trackPageView(pageName)
  })
}

/**
 * useEventTracking composable
 * 提供事件追踪函数
 */
export function useEventTracking() {
  const monitor = useMonitor()

  return {
    trackEvent: (name: string, properties?: Record<string, unknown>) => {
      monitor.trackEvent(name, properties)
    },
    trackPerformance: (metric: string, value: number) => {
      monitor.trackPerformance(metric, value)
    },
  }
}

/**
 * useErrorTracking composable
 * 提供错误追踪函数
 */
export function useErrorTracking() {
  const monitor = useMonitor()

  return {
    trackError: (error: Error, context?: Record<string, unknown>) => {
      monitor.trackError(error, context)
    },
  }
}


















