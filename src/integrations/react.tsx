/**
 * React integration
 */

/// <reference types="react" />

import type { ReactNode } from 'react'
import type { MonitorConfig } from '../types'
import { createMonitor, type Monitor } from '../core/Monitor'

// Use dynamic imports to avoid bundling React when not needed
let React: any
let createContext: any
let useContext: any
let useMemo: any
let Component: any

try {
  const ReactModule = require('react')
  React = ReactModule
  createContext = ReactModule.createContext
  useContext = ReactModule.useContext
  useMemo = ReactModule.useMemo
  Component = ReactModule.Component
} catch (e) {
  // React not available
}

const MonitorContext = createContext ? createContext<Monitor | null>(null) : null

/**
 * Monitor provider props
 */
export interface MonitorProviderProps {
  config: MonitorConfig
  children: ReactNode
}

/**
 * Monitor provider
 */
export function MonitorProvider({ config, children }: MonitorProviderProps) {
  if (!MonitorContext) {
    throw new Error('React is not available')
  }

  const monitor = useMemo(() => {
    const m = createMonitor(config)
    m.init()
    return m
  }, [])

  return React.createElement(MonitorContext.Provider, { value: monitor }, children)
}

/**
 * Use monitor hook
 */
export function useMonitor(): Monitor {
  if (!useContext || !MonitorContext) {
    throw new Error('React is not available')
  }

  const monitor = useContext(MonitorContext)
  if (!monitor) {
    throw new Error('Monitor not found. Wrap your app with MonitorProvider.')
  }
  return monitor
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  monitor?: Monitor
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
  children: ReactNode
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Error boundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    const { monitor, onError } = this.props

    if (monitor) {
      monitor.trackError(error, {
        componentStack: errorInfo.componentStack,
      })
    }

    if (onError) {
      onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || React.createElement('div', null, 'Something went wrong.')
    }

    return this.props.children
  }
}

/**
 * HOC to wrap component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: any,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    const monitor = useMonitor()
    return React.createElement(
      ErrorBoundary,
      { monitor, fallback },
      React.createElement(WrappedComponent, props)
    )
  }
}



