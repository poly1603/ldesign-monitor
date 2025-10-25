/**
 * React 集成
 * 提供 React hooks 和组件
 */

import React, { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import type { Monitor } from '../core/Monitor'
import { createMonitor } from '../core/Monitor'
import type { MonitorConfig } from '../types'

/**
 * Monitor Context
 */
const MonitorContext = createContext<Monitor | null>(null)

/**
 * MonitorProvider Props
 */
export interface MonitorProviderProps {
  /**
   * 监控配置
   */
  config: MonitorConfig

  /**
   * 子组件
   */
  children: ReactNode
}

/**
 * MonitorProvider 组件
 * 
 * @example
 * ```tsx
 * import { MonitorProvider } from '@ldesign/monitor/react'
 * 
 * function App() {
 *   return (
 *     <MonitorProvider config={{ dsn: '...', projectId: '...' }}>
 *       <YourApp />
 *     </MonitorProvider>
 *   )
 * }
 * ```
 */
export function MonitorProvider({ config, children }: MonitorProviderProps) {
  const monitor = useMemo(() => createMonitor(config), [])

  return (
    <MonitorContext.Provider value={monitor}>
      {children}
    </MonitorContext.Provider>
  )
}

/**
 * useMonitor hook
 * 
 * @returns Monitor 实例
 * 
 * @example
 * ```tsx
 * import { useMonitor } from '@ldesign/monitor/react'
 * 
 * function MyComponent() {
 *   const monitor = useMonitor()
 *   
 *   const handleClick = () => {
 *     monitor.trackEvent('button-click', { buttonId: 'save' })
 *   }
 *   
 *   return <button onClick={handleClick}>Save</button>
 * }
 * ```
 */
export function useMonitor(): Monitor {
  const monitor = useContext(MonitorContext)

  if (!monitor) {
    throw new Error('[useMonitor] MonitorProvider not found in component tree')
  }

  return monitor
}

/**
 * usePageTracking hook
 * 自动追踪组件的页面浏览
 */
export function usePageTracking(pageName: string): void {
  const monitor = useMonitor()

  useEffect(() => {
    monitor.trackPageView(pageName)
  }, [pageName])
}

/**
 * useEventTracking hook
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
 * ErrorBoundary Props
 */
export interface ErrorBoundaryProps {
  /**
   * 子组件
   */
  children: ReactNode

  /**
   * 错误回退 UI
   */
  fallback?: ReactNode

  /**
   * 错误回调
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * ErrorBoundary State
 */
interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * ErrorBoundary 组件
 * 捕获 React 组件错误并上报
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = MonitorContext

  declare context: React.ContextType<typeof MonitorContext>

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 上报错误到监控系统
    if (this.context) {
      this.context.trackError(error, {
        react: {
          componentStack: errorInfo.componentStack,
        },
      })
    }

    // 调用用户回调
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>
    }

    return this.props.children
  }
}

/**
 * withErrorBoundary HOC
 * 为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
): React.ComponentType<P> {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
}


















