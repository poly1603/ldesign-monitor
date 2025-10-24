# @ldesign/monitor 最佳实践

## 性能优化

### 1. 采样策略

不同环境使用不同的采样率：

```typescript
const getSampleRate = () => {
  const env = process.env.NODE_ENV
  
  switch (env) {
    case 'development':
      return 1.0 // 开发环境 100% 采样
    case 'staging':
      return 0.5 // 预发环境 50% 采样
    case 'production':
      return 0.1 // 生产环境 10% 采样
    default:
      return 1.0
  }
}

const monitor = createMonitor({
  dsn: '...',
  projectId: '...',
  sampleRate: getSampleRate(),
})
```

### 2. 按数据类型采样

错误数据通常比性能数据更重要：

```typescript
const monitor = createMonitor({
  dsn: '...',
  projectId: '...',
  hooks: {
    beforeSend: (data) => {
      // 错误数据 100% 采样
      if (data.type === 'error') {
        return data
      }
      
      // 性能数据 10% 采样
      if (data.type === 'performance') {
        return Math.random() < 0.1 ? data : null
      }
      
      // 行为数据 5% 采样
      if (data.type === 'behavior') {
        return Math.random() < 0.05 ? data : null
      }
      
      return data
    },
  },
})
```

### 3. 批量上报

减少网络请求，提高性能：

```typescript
const monitor = createMonitor({
  dsn: '...',
  projectId: '...',
  batch: {
    size: 20,      // 累积 20 条数据后上报
    interval: 10000, // 或每 10 秒上报一次
  },
})
```

### 4. 懒加载监控模块

对于大型应用，可以按需加载监控模块：

```typescript
// 初始只加载核心
const monitor = createMonitor({
  dsn: '...',
  projectId: '...',
  enableReplay: false, // 默认不启用会话回放
})

// 用户同意后再启用会话回放
async function enableReplay() {
  const { createSessionRecorder } = await import('@ldesign/monitor')
  const recorder = createSessionRecorder()
  recorder.start(monitor.getSessionId())
}
```

## 隐私保护

### 1. 数据脱敏

自动脱敏敏感信息：

```typescript
function maskSensitiveData(data: any) {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'creditCard']
  
  const masked = { ...data }
  
  for (const key of sensitiveKeys) {
    if (key in masked) {
      masked[key] = '***'
    }
  }
  
  // 脱敏邮箱
  if (masked.email) {
    const [name, domain] = masked.email.split('@')
    masked.email = `${name[0]}***@${domain}`
  }
  
  // 脱敏手机号
  if (masked.phone) {
    masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }
  
  return masked
}

const monitor = createMonitor({
  dsn: '...',
  projectId: '...',
  hooks: {
    beforeSend: (data) => {
      if (data.user) {
        data.user = maskSensitiveData(data.user)
      }
      return data
    },
  },
})
```

### 2. 禁用输入录制

会话回放时不录制用户输入：

```typescript
const recorder = createSessionRecorder({
  recordInput: false, // 不录制输入内容
  recordCanvas: false, // 不录制 canvas（可能包含敏感信息）
})
```

### 3. URL 参数过滤

从 URL 中移除敏感参数：

```typescript
function sanitizeURL(url: string): string {
  const urlObj = new URL(url)
  const sensitiveParams = ['token', 'apiKey', 'password']
  
  sensitiveParams.forEach((param) => {
    urlObj.searchParams.delete(param)
  })
  
  return urlObj.toString()
}
```

### 4. IP 匿名化

如果收集 IP 地址，应该匿名化：

```typescript
function anonymizeIP(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) {
    // IPv4: 保留前3段，最后一段设为0
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`
  }
  return ip
}
```

## 错误处理

### 1. 丰富的错误上下文

提供足够的上下文帮助调试：

```typescript
try {
  await performCriticalOperation()
} catch (error) {
  monitor.trackError(error, {
    operation: 'critical-operation',
    userId: currentUser.id,
    userPlan: currentUser.plan,
    attemptCount: retryCount,
    timestamp: Date.now(),
    environment: {
      url: window.location.href,
      userAgent: navigator.userAgent,
    },
  })
}
```

### 2. 错误分级

不同严重程度的错误使用不同的追踪策略：

```typescript
function trackErrorWithLevel(error: Error, level: 'fatal' | 'error' | 'warning') {
  if (level === 'fatal') {
    // 致命错误：立即上报，不批量
    monitor.trackError(error, { level, immediate: true })
  } else if (level === 'error') {
    // 普通错误：正常上报
    monitor.trackError(error, { level })
  } else {
    // 警告：可能采样上报
    if (Math.random() < 0.1) {
      monitor.trackError(error, { level })
    }
  }
}
```

### 3. 面包屑记录

记录错误前的操作路径：

```typescript
// 记录关键操作
function criticalAction(action: string) {
  monitor.addBreadcrumb({
    type: 'custom',
    message: action,
    level: 'info',
    timestamp: Date.now(),
  })
}

// 用户操作流程
criticalAction('User clicked checkout button')
criticalAction('Validating cart items')
criticalAction('Calculating total price')

try {
  processCheckout()
} catch (error) {
  // 错误上报时会包含所有面包屑
  monitor.trackError(error)
}
```

## 性能监控

### 1. 关键指标监控

重点监控对用户体验影响最大的指标：

```typescript
import { createWebVitalsCollector } from '@ldesign/monitor'

const vitals = createWebVitalsCollector()

vitals.start((metric) => {
  monitor.trackPerformance(metric.name, metric.value)
  
  // 对于 poor 评分的指标发送告警
  if (metric.rating === 'poor') {
    monitor.trackEvent('poor-performance', {
      metric: metric.name,
      value: metric.value,
      page: window.location.pathname,
    })
  }
})
```

### 2. 慢操作追踪

追踪慢操作并优化：

```typescript
async function trackSlowOperation<T>(
  name: string,
  operation: () => Promise<T>,
  threshold = 1000,
): Promise<T> {
  const start = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - start
    
    if (duration > threshold) {
      monitor.trackEvent('slow-operation', {
        operation: name,
        duration,
        threshold,
      })
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    monitor.trackError(error, {
      operation: name,
      duration,
    })
    throw error
  }
}

// 使用
await trackSlowOperation('fetch-user-data', async () => {
  return await fetch('/api/user').then(r => r.json())
})
```

### 3. 资源性能监控

监控关键资源的加载性能：

```typescript
import { createResourceTimingCollector } from '@ldesign/monitor'

const collector = createResourceTimingCollector({
  minDuration: 100,
  resourceTypes: ['script', 'fetch', 'xmlhttprequest'],
})

collector.start((resource) => {
  // 追踪慢资源
  if (resource.duration > 1000) {
    monitor.trackEvent('slow-resource', {
      url: resource.name,
      duration: resource.duration,
      type: resource.initiatorType,
    })
  }
  
  // 追踪大资源
  if (resource.transferSize > 1024 * 1024) { // >1MB
    monitor.trackEvent('large-resource', {
      url: resource.name,
      size: resource.transferSize,
    })
  }
})
```

## 用户行为分析

### 1. 关键路径追踪

追踪用户的关键操作路径：

```typescript
// 定义用户旅程
const journey = [
  'homepage',
  'product-list',
  'product-detail',
  'add-to-cart',
  'checkout',
  'payment',
  'success',
]

// 追踪每一步
journey.forEach((step) => {
  monitor.trackEvent(`journey-${step}`, {
    step,
    timestamp: Date.now(),
  })
})
```

### 2. 漏斗优化

使用漏斗分析找出流失环节：

```typescript
import { createFunnelAnalyzer } from '@ldesign/monitor'

const analyzer = createFunnelAnalyzer()

analyzer.defineFunnel({
  id: 'signup',
  name: 'User Signup',
  steps: [
    { name: 'Visit Signup Page', event: 'visit-signup' },
    { name: 'Fill Form', event: 'fill-form' },
    { name: 'Submit', event: 'submit-signup' },
    { name: 'Verify Email', event: 'verify-email' },
    { name: 'Complete', event: 'signup-complete' },
  ],
})

// 定期分析并优化流失严重的环节
setInterval(() => {
  const result = analyzer.analyze('signup')
  
  result?.steps.forEach((step, index) => {
    if (step.dropOffRate > 0.5) { // 流失率 > 50%
      console.warn(`High drop-off at step ${index + 1}: ${step.name}`)
      // 触发优化告警
    }
  })
}, 3600000) // 每小时分析一次
```

### 3. A/B 测试

数据驱动的产品优化：

```typescript
import { createExperimentManager } from '@ldesign/monitor'

const experiments = createExperimentManager()

// 创建实验
experiments.createExperiment({
  id: 'checkout-button',
  name: 'Checkout Button Test',
  variants: [
    { 
      id: 'control',
      name: 'Blue Button',
      config: { color: 'blue' },
    },
    { 
      id: 'treatment',
      name: 'Green Button',
      config: { color: 'green' },
    },
  ],
})

// 分配用户并应用变体
const allocation = experiments.allocate('checkout-button', userId)

if (allocation) {
  applyButtonColor(allocation.config.color)
}

// 追踪转化
if (userClickedCheckout) {
  experiments.trackResult('checkout-button', userId, 1)
}
```

## 告警配置

### 1. 多级告警

根据严重程度使用不同的告警渠道：

```typescript
const engine = createAlertEngine()

// 关键告警：多渠道通知
engine.addRule({
  id: 'critical-error-rate',
  name: 'Critical Error Rate',
  type: 'error_rate',
  condition: {
    metric: 'error_rate',
    operator: '>',
    threshold: 0.1, // 10%
  },
  channels: ['email', 'dingtalk', 'feishu'], // 多渠道
})

// 一般告警：单渠道
engine.addRule({
  id: 'high-error-rate',
  name: 'High Error Rate',
  type: 'error_rate',
  condition: {
    metric: 'error_rate',
    operator: '>',
    threshold: 0.05, // 5%
  },
  channels: ['email'],
})
```

### 2. 避免告警风暴

合理设置节流时间：

```typescript
engine.addRule({
  id: 'rule1',
  name: 'Test Rule',
  type: 'error_rate',
  condition: { /* ... */ },
  channels: ['email'],
  throttle: 1800000, // 30 分钟内只告警一次
})
```

### 3. 智能告警

结合 AI 异常检测，减少误报：

```typescript
import { createAnomalyDetector } from '@ldesign/monitor'

const detector = createAnomalyDetector()

webVitalsCollector.start((metric) => {
  const anomaly = detector.detect({
    timestamp: Date.now(),
    value: metric.value,
  })
  
  // 只在检测到异常时告警
  if (anomaly.isAnomaly && anomaly.confidence > 0.8) {
    monitor.trackEvent('performance-anomaly', {
      metric: metric.name,
      value: metric.value,
      anomalyType: anomaly.type,
      anomalyScore: anomaly.score,
    })
  }
})
```

## 数据管理

### 1. 数据保留策略

```typescript
// 服务端实现
// 自动删除超过 30 天的数据
const RETENTION_DAYS = 30

async function cleanupOldData() {
  const cutoffDate = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  
  await db.delete({
    where: {
      timestamp: { lt: cutoffDate },
    },
  })
}

// 每天执行一次
setInterval(cleanupOldData, 24 * 60 * 60 * 1000)
```

### 2. 数据聚合

对于高频数据，先聚合再存储：

```typescript
// 性能数据按小时聚合
interface AggregatedMetric {
  metric: string
  hour: number
  count: number
  avg: number
  p50: number
  p95: number
  p99: number
}

function aggregateMetrics(metrics: PerformanceMetric[]): AggregatedMetric {
  const values = metrics.map(m => m.value).sort((a, b) => a - b)
  
  return {
    metric: metrics[0].name,
    hour: Math.floor(Date.now() / 3600000),
    count: values.length,
    avg: values.reduce((sum, v) => sum + v, 0) / values.length,
    p50: values[Math.floor(values.length * 0.5)],
    p95: values[Math.floor(values.length * 0.95)],
    p99: values[Math.floor(values.length * 0.99)],
  }
}
```

## 服务端集成

### 1. 接收端点实现

```typescript
// Express.js 示例
import express from 'express'

const app = express()
app.use(express.json())

app.post('/api/monitor', async (req, res) => {
  const data = req.body
  
  // 验证数据
  if (!data.projectId || !data.type) {
    return res.status(400).json({ error: 'Invalid data' })
  }
  
  // 存储数据
  await saveToDatabase(data)
  
  // 触发实时处理
  await processMonitorData(data)
  
  res.status(200).json({ success: true })
})
```

### 2. 数据处理流程

```typescript
async function processMonitorData(data: ReportData) {
  // 1. 存储原始数据
  await storage.save(data)
  
  // 2. 更新统计
  await updateMetrics(data)
  
  // 3. 检查告警规则
  await checkAlertRules(data)
  
  // 4. 更新仪表板
  await updateDashboard(data)
}
```

## 监控覆盖

### 1. 全面监控

```typescript
// 创建完整的监控系统
class ComprehensiveMonitor {
  private monitor: Monitor
  private webVitals: WebVitalsCollector
  private jsError: JSErrorCollector
  private promiseError: PromiseErrorCollector
  private resourceError: ResourceErrorCollector
  private pageView: PageViewTracker
  private click: ClickTracker
  private apiInterceptor: APIInterceptor

  constructor(config: MonitorConfig) {
    this.monitor = createMonitor(config)
    this.webVitals = createWebVitalsCollector()
    this.jsError = createJSErrorCollector()
    this.promiseError = createPromiseErrorCollector()
    this.resourceError = createResourceErrorCollector()
    this.pageView = createPageViewTracker()
    this.click = createClickTracker()
    this.apiInterceptor = createAPIInterceptor()
  }

  start() {
    // 启动所有收集器
    this.webVitals.start((metric) => {
      this.monitor.trackPerformance(metric.name, metric.value)
    })

    this.jsError.start((error) => {
      this.monitor.trackError(new Error(error.message))
    })

    this.promiseError.start((error) => {
      this.monitor.trackError(new Error(error.message))
    })

    this.resourceError.start((error) => {
      this.monitor.trackError(new Error(error.message))
    })

    this.pageView.start((pageView) => {
      this.monitor.trackPageView(pageView.path)
    })

    this.click.start((click) => {
      this.monitor.trackEvent('click', {
        selector: click.selector,
        text: click.text,
      })
    })

    this.apiInterceptor.start((request) => {
      this.monitor.trackEvent('api', {
        url: request.url,
        duration: request.duration,
        success: request.success,
      })
    })
  }

  stop() {
    this.webVitals.stop()
    this.jsError.stop()
    this.promiseError.stop()
    this.resourceError.stop()
    this.pageView.stop()
    this.click.stop()
    this.apiInterceptor.stop()
  }
}
```

### 2. 关键业务监控

```typescript
// 电商场景
monitor.trackEvent('product-view', { productId, category })
monitor.trackEvent('add-to-cart', { productId, price })
monitor.trackEvent('checkout-start', { cartValue })
monitor.trackEvent('payment-submit', { amount, method })
monitor.trackEvent('order-success', { orderId, amount })

// SaaS 场景
monitor.trackEvent('feature-usage', { feature, duration })
monitor.trackEvent('upgrade-click', { plan })
monitor.trackEvent('subscription-success', { plan, price })
```

## 性能基准

### 1. 设定基准线

为每个指标设定合理的目标：

```typescript
const performanceTargets = {
  FCP: 1800, // Good: <1.8s
  LCP: 2500, // Good: <2.5s
  FID: 100,  // Good: <100ms
  CLS: 0.1,  // Good: <0.1
  TTFB: 800, // Good: <800ms
}

webVitalsCollector.start((metric) => {
  const target = performanceTargets[metric.name as keyof typeof performanceTargets]
  
  if (target && metric.value > target) {
    monitor.trackEvent('performance-below-target', {
      metric: metric.name,
      value: metric.value,
      target,
    })
  }
})
```

### 2. 性能预算

```typescript
const performanceBudget = {
  totalJS: 200 * 1024,    // 200KB
  totalCSS: 50 * 1024,    // 50KB
  totalImages: 500 * 1024, // 500KB
}

resourceCollector.start(() => {
  const stats = resourceCollector.getStats()
  const jsSize = stats.byType['script'] || 0
  
  if (jsSize > performanceBudget.totalJS) {
    monitor.trackEvent('budget-exceeded', {
      resource: 'js',
      size: jsSize,
      budget: performanceBudget.totalJS,
    })
  }
})
```

## 团队协作

### 1. 错误分配

为不同类型的错误分配负责人：

```typescript
const errorOwners = {
  'API Error': 'backend-team',
  'JS Error': 'frontend-team',
  'Resource Error': 'devops-team',
}

monitor.on('error', (errorData) => {
  const owner = errorOwners[errorData.type] || 'unknown'
  
  // 在上报数据中包含负责人信息
  monitor.setContext({
    owner,
  })
})
```

### 2. 环境标识

清晰标识数据来源：

```typescript
const monitor = createMonitor({
  dsn: '...',
  projectId: '...',
  environment: `${process.env.NODE_ENV}-${process.env.DEPLOY_ENV}`,
  // 例如: "production-us-west", "development-local"
})

monitor.setContext({
  version: process.env.APP_VERSION,
  buildId: process.env.BUILD_ID,
  branch: process.env.GIT_BRANCH,
})
```

---

遵循这些最佳实践，可以构建一个高效、可靠、隐私友好的监控系统。



