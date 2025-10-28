/**
 * React 和 Vue 错误边界集成
 * 
 * 功能：
 * 1. React ErrorBoundary 组件
 * 2. Vue errorHandler 全局钩子
 * 3. 框架错误统一上报
 * 4. 组件堆栈追踪
 */

import type { Monitor } from '../../core/Monitor'

export interface ComponentError {
  componentName?: string
  componentStack?: string
  props?: Record<string, any>
  lifecycle?: string
}

export interface FrameworkErrorInfo {
  framework: 'react' | 'vue'
  error: Error
  errorInfo: ComponentError
  timestamp: number
}

/**
 * React 错误边界集成
 */
export class ReactErrorIntegration {
  constructor(private monitor: Monitor) {}

  /**
   * 创建错误边界组件
   */
  createErrorBoundary(): any {
    const monitor = this.monitor

    // React 18+ 的类型定义
    const React = (globalThis as any).React

    if (!React) {
      console.warn('[Monitor] React is not available')
      return null
    }

    class MonitorErrorBoundary extends React.Component<
      {
        children: React.ReactNode
        fallback?: React.ComponentType<{ error: Error; errorInfo: any }>
        onError?: (error: Error, errorInfo: any) => void
      },
      { hasError: boolean; error: Error | null; errorInfo: any }
    > {
      constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
      }

      componentDidCatch(error: Error, errorInfo: any) {
        // 提取组件堆栈
        const componentStack = errorInfo.componentStack

        // 上报到监控系统
        monitor.captureError(error, {
          level: 'error',
          tags: { framework: 'react' },
          extra: {
            componentStack,
            errorBoundary: true,
          },
        })

        // 触发自定义回调
        if (this.props.onError) {
          this.props.onError(error, errorInfo)
        }

        this.setState({ errorInfo })
      }

      render() {
        if (this.state.hasError) {
          if (this.props.fallback) {
            const FallbackComponent = this.props.fallback
            return React.createElement(FallbackComponent, {
              error: this.state.error,
              errorInfo: this.state.errorInfo,
            })
          }

          return React.createElement(
            'div',
            { style: { padding: '20px', color: '#d32f2f' } },
            React.createElement('h2', null, 'Something went wrong'),
            React.createElement(
              'details',
              { style: { whiteSpace: 'pre-wrap' } },
              this.state.error?.toString(),
            ),
          )
        }

        return this.props.children
      }
    }

    return MonitorErrorBoundary
  }

  /**
   * HOC 包装组件
   */
  withErrorBoundary(Component: any, options?: { fallback?: any; onError?: any }): any {
    const React = (globalThis as any).React
    const ErrorBoundary = this.createErrorBoundary()

    if (!React || !ErrorBoundary) {
      return Component
    }

    return (props: any) => {
      return React.createElement(
        ErrorBoundary,
        options,
        React.createElement(Component, props),
      )
    }
  }
}

/**
 * Vue 错误处理集成
 */
export class VueErrorIntegration {
  constructor(private monitor: Monitor) {}

  /**
   * 安装 Vue 2 错误处理器
   */
  installVue2ErrorHandler(Vue: any): void {
    const monitor = this.monitor
    const originalErrorHandler = Vue.config.errorHandler

    Vue.config.errorHandler = function (
      err: Error,
      vm: any,
      info: string,
    ): void {
      // 提取组件信息
      const componentName = vm?.$options?.name || vm?.$options?._componentTag
      const propsData = vm?.$options?.propsData

      // 上报到监控系统
      monitor.captureError(err, {
        level: 'error',
        tags: {
          framework: 'vue',
          vue_version: '2',
        },
        extra: {
          componentName,
          propsData,
          lifecycle: info,
          componentTree: getComponentTree(vm),
        },
      })

      // 调用原始错误处理器
      if (originalErrorHandler) {
        originalErrorHandler.call(this, err, vm, info)
      }
    }

    // 处理 Promise 错误
    Vue.config.warnHandler = function (msg: string, vm: any, trace: string): void {
      monitor.captureError(new Error(msg), {
        level: 'warning',
        tags: {
          framework: 'vue',
          vue_version: '2',
        },
        extra: {
          trace,
          componentName: vm?.$options?.name,
        },
      })
    }
  }

  /**
   * 安装 Vue 3 错误处理器
   */
  installVue3ErrorHandler(app: any): void {
    const monitor = this.monitor

    app.config.errorHandler = (err: Error, instance: any, info: string) => {
      // 提取组件信息
      const componentName = instance?.type?.name || instance?.type?.__name
      const props = instance?.props

      // 上报到监控系统
      monitor.captureError(err, {
        level: 'error',
        tags: {
          framework: 'vue',
          vue_version: '3',
        },
        extra: {
          componentName,
          props,
          lifecycle: info,
          componentTree: getComponentTreeVue3(instance),
        },
      })
    }

    app.config.warnHandler = (msg: string, instance: any, trace: string) => {
      monitor.captureError(new Error(msg), {
        level: 'warning',
        tags: {
          framework: 'vue',
          vue_version: '3',
        },
        extra: {
          trace,
          componentName: instance?.type?.name,
        },
      })
    }
  }
}

/**
 * 获取 Vue 2 组件树
 */
function getComponentTree(vm: any, depth = 5): string[] {
  const tree: string[] = []
  let current = vm

  while (current && depth > 0) {
    const name = current.$options?.name || current.$options?._componentTag || 'Anonymous'
    tree.push(name)
    current = current.$parent
    depth--
  }

  return tree
}

/**
 * 获取 Vue 3 组件树
 */
function getComponentTreeVue3(instance: any, depth = 5): string[] {
  const tree: string[] = []
  let current = instance

  while (current && depth > 0) {
    const name = current.type?.name || current.type?.__name || 'Anonymous'
    tree.push(name)
    current = current.parent
    depth--
  }

  return tree
}

/**
 * 框架错误集成管理器
 */
export class FrameworkErrorIntegration {
  private reactIntegration: ReactErrorIntegration
  private vueIntegration: VueErrorIntegration

  constructor(private monitor: Monitor) {
    this.reactIntegration = new ReactErrorIntegration(monitor)
    this.vueIntegration = new VueErrorIntegration(monitor)
  }

  /**
   * 自动检测并安装框架错误处理器
   */
  autoInstall(): void {
    // 检测 React
    if (typeof (globalThis as any).React !== 'undefined') {
      console.log('[Monitor] React detected, ErrorBoundary is available')
    }

    // 检测 Vue 2
    if (typeof (globalThis as any).Vue !== 'undefined') {
      const Vue = (globalThis as any).Vue
      if (Vue.version && Vue.version.startsWith('2')) {
        console.log('[Monitor] Vue 2 detected, installing error handler')
        this.vueIntegration.installVue2ErrorHandler(Vue)
      }
    }

    // Vue 3 需要手动调用 installVue3ErrorHandler
  }

  /**
   * 获取 React 集成
   */
  getReactIntegration(): ReactErrorIntegration {
    return this.reactIntegration
  }

  /**
   * 获取 Vue 集成
   */
  getVueIntegration(): VueErrorIntegration {
    return this.vueIntegration
  }

  /**
   * 为 React 创建错误边界
   */
  createReactErrorBoundary(): any {
    return this.reactIntegration.createErrorBoundary()
  }

  /**
   * React HOC
   */
  withReactErrorBoundary(Component: any, options?: any): any {
    return this.reactIntegration.withErrorBoundary(Component, options)
  }

  /**
   * 安装 Vue 2 错误处理器
   */
  installVue2(Vue: any): void {
    this.vueIntegration.installVue2ErrorHandler(Vue)
  }

  /**
   * 安装 Vue 3 错误处理器
   */
  installVue3(app: any): void {
    this.vueIntegration.installVue3ErrorHandler(app)
  }
}

/**
 * 创建框架错误集成
 */
export function createFrameworkErrorIntegration(monitor: Monitor): FrameworkErrorIntegration {
  return new FrameworkErrorIntegration(monitor)
}
