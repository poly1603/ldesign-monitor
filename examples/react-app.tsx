/**
 * React 应用集成示例
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { MonitorProvider, useMonitor, usePageTracking, ErrorBoundary } from '../src/react'

/**
 * Dashboard 组件
 */
function Dashboard() {
  const monitor = useMonitor()

  // 自动追踪页面浏览
  usePageTracking('/dashboard')

  const handleClick = () => {
    monitor.trackEvent('button-click', {
      buttonId: 'submit',
      page: 'dashboard',
    })
  }

  const handleError = () => {
    try {
      throw new Error('Test error')
    }
    catch (error) {
      monitor.trackError(error as Error, {
        action: 'test-button-click',
      })
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleClick}>Track Event</button>
      <button onClick={handleError}>Track Error</button>
    </div>
  )
}

/**
 * App 组件
 */
function App() {
  return (
    <MonitorProvider
      config={{
        dsn: 'https://your-endpoint.com/api/monitor',
        projectId: 'my-react-app',
        environment: 'production',
        sampleRate: 1.0,
        debug: true,
      }}
    >
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </MonitorProvider>
  )
}

// 挂载应用
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}

export default App



