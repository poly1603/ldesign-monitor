/**
 * Vue 3 integration
 */

import type { Plugin, App } from 'vue'
import type { MonitorConfig } from '../types'
import { createMonitor, type Monitor } from '../core/Monitor'

const MonitorSymbol = Symbol('monitor')

/**
 * Create Vue plugin
 */
export function createMonitorPlugin(config: MonitorConfig): Plugin {
  return {
    install(app: App) {
      const monitor = createMonitor(config)
      monitor.init()

      // Provide monitor instance
      app.provide(MonitorSymbol, monitor)

      // Auto-track route changes if Vue Router is available
      const router = (app.config.globalProperties as any).$router
      if (router) {
        router.afterEach((to: any) => {
          monitor.trackPageView(to.path || to.fullPath)
        })
      }

      // Track Vue errors
      app.config.errorHandler = (err, instance, info) => {
        monitor.trackError(err as Error, {
          componentName: instance?.$options?.name,
          errorInfo: info,
        })
      }
    },
  }
}

/**
 * Use monitor in component
 */
export function useMonitor(): Monitor {
  // Note: This requires Vue to be available
  // Dynamic import to avoid bundling Vue when not needed
  try {
    const { inject } = require('vue')
    const monitor = inject(MonitorSymbol)
    if (!monitor) {
      throw new Error('Monitor not found. Did you install the plugin?')
    }
    return monitor
  } catch (e) {
    throw new Error('Vue is not available or Monitor plugin not installed')
  }
}

