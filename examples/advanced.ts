/**
 * 高级功能示例
 * 展示监控系统的完整功能
 */

import {
  createMonitor,
  createWebVitalsCollector,
  createJSErrorCollector,
  createAPIInterceptor,
  createClickHeatmap,
  createFunnelAnalyzer,
  createExperimentManager,
  createAlertEngine,
  createSessionRecorder,
  createAnomalyDetector,
} from '../src'

// 1. 创建监控实例
const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'advanced-demo',
  environment: 'production',
  sampleRate: 0.1, // 10% 采样
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
  enableAPI: true,
  enableReplay: true,
  debug: true,
  hooks: {
    beforeSend: (data) => {
      // 数据脱敏
      console.log('[Hook] beforeSend:', data.type)
      return data
    },
    afterError: (error) => {
      console.log('[Hook] afterError:', error.message)
    },
    afterPerformance: (metric) => {
      console.log('[Hook] afterPerformance:', metric.name, metric.value)
    },
  },
})

// 初始化
monitor.init()

// 2. 设置用户信息
monitor.setUser({
  id: 'user-12345',
  name: 'John Doe',
  email: 'john@example.com',
  attributes: {
    plan: 'premium',
    signupDate: '2024-01-01',
  },
})

// 3. 设置上下文
monitor.setContext({
  feature: 'analytics',
  version: '2.0',
})

// 4. Web Vitals 性能监控
const webVitals = createWebVitalsCollector()
webVitals.start((metric) => {
  monitor.trackPerformance(metric.name, metric.value)

  // 性能异常检测
  const detector = createAnomalyDetector()
  const anomaly = detector.detect({
    timestamp: Date.now(),
    value: metric.value,
  })

  if (anomaly.isAnomaly) {
    console.warn(`[Anomaly] ${metric.name} is abnormal:`, anomaly)
  }
})

// 5. 错误追踪
const errorCollector = createJSErrorCollector()
errorCollector.start((error) => {
  monitor.trackError(new Error(error.message), {
    type: error.type,
    stack: error.stack,
  })
})

// 6. API 监控
const apiInterceptor = createAPIInterceptor({
  interceptXHR: true,
  interceptFetch: true,
  urlFilter: (url) => {
    // 只监控业务 API，忽略第三方
    return url.startsWith('/api/')
  },
})

apiInterceptor.start((request) => {
  monitor.trackEvent('api-request', {
    url: request.url,
    method: request.method,
    duration: request.duration,
    status: request.status,
    success: request.success,
  })

  // 慢请求检测
  if (request.duration > 3000) {
    console.warn('[Slow API]', request.url, request.duration)
  }
})

// 7. 点击热力图
const heatmap = createClickHeatmap()
heatmap.start((click) => {
  console.log('[Heatmap] Click at:', click.x, click.y)
})

// 8. 漏斗分析
const funnelAnalyzer = createFunnelAnalyzer()

funnelAnalyzer.defineFunnel({
  id: 'purchase-funnel',
  name: 'Purchase Funnel',
  steps: [
    { name: 'View Product', event: 'product-view' },
    { name: 'Add to Cart', event: 'add-to-cart' },
    { name: 'Checkout', event: 'checkout' },
    { name: 'Purchase', event: 'purchase' },
  ],
  timeWindow: 3600000, // 1 hour
})

// 监听事件并记录到漏斗
monitor.on('event', (data: any) => {
  funnelAnalyzer.trackEvent('user-123', data.name, data.timestamp)
})

// 分析漏斗
setTimeout(() => {
  const result = funnelAnalyzer.analyze('purchase-funnel')
  console.log('[Funnel] Analysis:', result)
}, 10000)

// 9. A/B 测试
const experimentManager = createExperimentManager()

experimentManager.createExperiment({
  id: 'button-color-test',
  name: 'Button Color Test',
  description: 'Test which button color converts better',
  variants: [
    { id: 'control', name: 'Blue Button', weight: 1 },
    { id: 'treatment', name: 'Green Button', weight: 1 },
  ],
  allocationStrategy: 'hash',
})

// 分配用户
const allocation = experimentManager.allocate('button-color-test', 'user-123')
console.log('[A/B Test] Allocated to:', allocation?.variantId)

// 记录转化
experimentManager.trackResult('button-color-test', 'user-123', 1) // 成功转化

// 10. 告警系统
const alertEngine = createAlertEngine()

alertEngine.addRule({
  id: 'high-error-rate',
  name: 'High Error Rate Alert',
  type: 'error_rate',
  condition: {
    metric: 'error_rate',
    operator: '>',
    threshold: 0.05, // 错误率 > 5%
  },
  channels: ['email', 'dingtalk'],
  throttle: 300000, // 5分钟内只告警一次
})

alertEngine.onAlert((alert) => {
  console.error('[ALERT]', alert.message, {
    severity: alert.severity,
    value: alert.value,
    threshold: alert.threshold,
  })
})

// 模拟错误率更新
setInterval(() => {
  const errorRate = Math.random()
  alertEngine.updateMetric('error_rate', errorRate)
}, 10000)

// 11. 会话回放
const recorder = createSessionRecorder({
  recordInput: false, // 不录制输入内容（隐私）
  recordMedia: true,
  recordCanvas: false,
  maxDuration: 300000, // 5分钟
})

// 开始录制
recorder.start(monitor.getSessionId())

// 停止录制并获取数据
setTimeout(() => {
  const sessionData = recorder.stop()
  if (sessionData) {
    console.log('[Session Replay] Recorded:', {
      sessionId: sessionData.sessionId,
      eventCount: sessionData.events.length,
      duration: sessionData.duration,
    })
  }
}, 60000) // 1分钟后停止

// 12. 监听所有事件
monitor.on('performance', (metric) => {
  console.log('[Performance]', metric)
})

monitor.on('error', (error) => {
  console.log('[Error]', error)
})

monitor.on('event', (event) => {
  console.log('[Event]', event)
})

// 13. 清理（页面卸载时）
window.addEventListener('beforeunload', () => {
  webVitals.stop()
  errorCollector.stop()
  apiInterceptor.stop()
  heatmap.stop()
  recorder.stop()
})

console.log('[Monitor] Advanced example initialized')

export default monitor





























