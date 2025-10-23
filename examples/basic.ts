/**
 * @ldesign/monitor 基础使用示例
 */

import { createMonitor } from '../src'

// 1. 创建并初始化监控器
const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  environment: 'production',
  sampleRate: 1.0,
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
  debug: true, // 开发环境下启用调试
})

// 2. 设置用户信息
monitor.setUser({
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
})

// 3. 设置上下文
monitor.setContext({
  page: 'dashboard',
  feature: 'analytics',
})

// 4. 手动追踪性能指标
monitor.trackPerformance('custom-metric', 1234)

// 5. 手动追踪错误
try {
  throw new Error('Test error')
}
catch (error) {
  monitor.trackError(error as Error, {
    action: 'test-action',
  })
}

// 6. 追踪事件
monitor.trackEvent('button-click', {
  buttonId: 'submit-btn',
  page: 'checkout',
})

// 7. 追踪页面浏览
monitor.trackPageView('/dashboard')

// 8. 添加面包屑
monitor.addBreadcrumb({
  type: 'navigation',
  message: 'User navigated to dashboard',
  level: 'info',
  timestamp: Date.now(),
})

// 9. 监听事件
monitor.on('performance', (metric) => {
  console.log('Performance metric:', metric)
})

monitor.on('error', (error) => {
  console.log('Error captured:', error)
})

// 10. 获取信息
console.log('Session ID:', monitor.getSessionId())
console.log('User:', monitor.getUser())
console.log('Context:', monitor.getContext())
console.log('Device:', monitor.getDeviceInfo())

export default monitor



