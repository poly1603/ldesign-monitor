/**
 * React integration
 */

/// <reference types="react" />

import type { MonitorConfig } from '../types'
import { createMonitor, type Monitor } from '../core/Monitor'

// React types (avoiding direct import)
interface ReactNode {
  [key: string]: unknown
}

interface ReactContext<T> {
  Provider: React.ComponentType<{ value: T; children: ReactNode }>
  Consumer: React.ComponentType<{ children: (value: T) => ReactNode }>
}

// React module interface
interface ReactModule {
  createContext<T>(defaultValue: T): ReactContext<T>
  useContext<T>(context: ReactContext<T>): T
  useMemo<T>(factory: () => T, deps: unknown[]): T
  Component: React.ComponentClass
  createElement(type: string | React.ComponentType, props: Record<string, unknown> | null, ...children: ReactNode[]): ReactNode
}

// Get React from global scope safely
let React: ReactModule | null = null

try {
  // @ts-expect-error - Dynamic access for optional peer dependency
  React = globalThis.React
} catch {
  // React not available
}

const MonitorContext = React ? React.createContext<Monitor | null>(null) : null

/**
 * Monitor provider props
 * 监控器 Provider 属性
 */
export interface MonitorProviderProps {
  config: MonitorConfig
  children: ReactNode
}

/**
 * Monitor provider
 * 监控器 Provider 组件
 * 
 * @param props - Provider 属性
 * @returns React 元素
 * @throws 如果 React 不可用
 */
export function MonitorProvider({ config, children }: MonitorProviderProps): ReactNode {
  if (!React || !MonitorContext) {
    throw new Error('React is not available. Make sure React is properly loaded.')
  }

  const monitor = React.useMemo(() => {
    const m = createMonitor(config)
    m.init()
    return m
  }, [])

  return React.createElement(MonitorContext.Provider, { value: monitor }, children)
}

/**
 * Use monitor hook
 * 使用监控器的 Hook
 * 
 * @returns Monitor 实例
 * @throws 如果 React 不可用或 Monitor 未提供
 */
export function useMonitor(): Monitor {
  if (!React || !MonitorContext) {
    throw new Error('React is not available. Make sure React is properly loaded.')
  }

  const monitor = React.useContext(MonitorContext)
  if (!monitor) {
    throw new Error('Monitor not found. Wrap your app with <MonitorProvider config={config}>.')
  }
  return monitor
}

/**
 * Error boundary props
 * 错误边界组件属性
 */
export interface ErrorBoundaryProps {
  monitor?: Monitor
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
  children: ReactNode
}

/**
 * Error boundary state
 * 错误边界组件状态
 */
interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Error boundary component
 * 错误边界组件
 * 捕获子组件的错误并上报到监控系统
 */
export class ErrorBoundary extends (React?.Component ?? class { }) {
  state: ErrorBoundaryState

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    const { monitor, onError } = this.props as ErrorBoundaryProps

    if (monitor) {
      monitor.trackError(error, {
        componentStack: errorInfo.componentStack,
      })
    }

    if (onError) {
      onError(error, errorInfo)
    }
  }

  render(): ReactNode {
    if (!React) {
      throw new Error('React is not available')
    }

    if (this.state.hasError) {
      const { fallback } = this.props as ErrorBoundaryProps
      return fallback || React.createElement('div', null, 'Something went wrong.')
    }

    return (this.props as ErrorBoundaryProps).children
  }
}

/**
 * HOC to wrap component with error boundary
 * 高阶组件：为组件添加错误边界
 * 
 * @param WrappedComponent - 要包装的组件
 * @param fallback - 错误时显示的备用 UI
 * @returns 包装后的组件
 */
export function withErrorBoundary<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P): ReactNode {
    if (!React) {
      throw new Error('React is not available')
    }

    const monitor = useMonitor()
    return React.createElement(
      ErrorBoundary,
      { monitor, fallback },
      React.createElement(WrappedComponent, props)
    )
  }
}



