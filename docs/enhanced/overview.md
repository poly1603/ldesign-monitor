# 增强功能概述

@ldesign/monitor 提供了一套强大的增强功能模块，可以一键启用，让你的监控系统更加完善。

## 🎯 为什么需要增强功能？

基础监控功能已经能够满足大部分需求，但在某些场景下，你可能需要：

- 🔍 更深入的性能分析（内存、Long Tasks、FPS）
- 📊 更详细的用户行为追踪（滚动深度、停留时间）
- 🌐 更全面的 API 监控（GraphQL、WebSocket）
- 🐛 更智能的错误处理（跨域错误、框架集成、错误分析）
- 💾 更可靠的数据上报（离线缓存）

## 快速开始

只需一行代码，即可启用所有增强功能：

```typescript
import { createEnhancedMonitor } from '@ldesign/monitor'

const monitor = createEnhancedMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  
  enhanced: {
    performance: {
      customMarks: true,
      longTasks: true,
      memory: true,
      fps: true,
      optimization: true,
    },
    behavior: {
      scrollDepth: true,
      timeOnPage: true,
    },
    api: {
      graphql: true,
      websocket: true,
    },
    offline: {
      enabled: true,
    },
    error: {
      crossOrigin: true,
      framework: true,
      analytics: true,
    },
  },
})

monitor.init()
```

## 功能模块

### ⚡ 性能增强

提供更深入的性能监控和分析能力。

#### [自定义性能标记](/enhanced/performance-marks)
- 支持 Performance Marks 和 Measures
- 追踪关键业务流程的性能
- 计算自定义时间段

#### [Long Tasks 检测](/enhanced/long-tasks)
- 自动检测阻塞主线程的任务（>50ms）
- 统计长任务数量和总阻塞时间
- 识别性能瓶颈

#### [内存监控](/enhanced/memory-monitor)
- 实时监控内存使用情况
- 检测内存泄漏
- 提供内存使用趋势

#### [FPS 监控](/enhanced/fps-monitor)
- 实时监控页面帧率
- 检测卡顿和掉帧
- 适合游戏和动画密集型应用

#### [优化建议](/enhanced/optimization)
- 基于性能数据生成优化建议
- 提供性能评分（0-100）
- 识别性能问题的优先级

### 👤 行为增强

深入了解用户如何与你的应用交互。

#### [滚动深度追踪](/enhanced/scroll-depth)
- 追踪用户滚动深度百分比
- 记录滚动里程碑（25%, 50%, 75%, 100%）
- 追踪特定元素是否进入视口

#### [停留时间统计](/enhanced/time-on-page)
- 统计总停留时间
- 区分活跃时间和空闲时间
- 追踪页面可见时间

### 🔌 API 增强

全面监控你的 API 请求。

#### [GraphQL 监控](/enhanced/graphql)
- 自动拦截 GraphQL 请求
- 记录查询字段和变量
- 检测 N+1 查询问题
- 统计字段使用频率

#### [WebSocket 监控](/enhanced/websocket)
- 监控 WebSocket 连接状态
- 追踪消息发送和接收
- 计算往返延迟（RTT）
- 健康检查

#### [离线缓存](/enhanced/offline-storage)
- 网络离线时自动缓存数据
- 网络恢复后自动上报
- 支持 TTL 和容量限制

### 🐛 错误增强

更智能的错误处理和分析。

#### [跨域错误处理](/enhanced/cross-origin-error)
- 检测 "Script error" 跨域错误
- 提供 CORS 配置建议
- 监听所有脚本加载

#### [框架错误集成](/enhanced/framework-error)
- React ErrorBoundary 组件
- Vue 2/3 errorHandler 钩子
- 组件堆栈追踪

#### [错误分析](/enhanced/error-analytics)
- 智能错误分组（基于堆栈相似度）
- 错误趋势分析和异常检测
- 统计错误影响范围（用户数、会话数、页面数）

## 使用场景

### 电商结账流程监控

```typescript
// 追踪结账流程的每个步骤
monitor.mark('checkout-start')

monitor.mark('step1-start')
await validateCart()
monitor.mark('step1-end')
monitor.measure('checkout-step1', 'step1-start', 'step1-end')

monitor.mark('step2-start')
await processPayment()
monitor.mark('step2-end')
monitor.measure('checkout-step2', 'step2-start', 'step2-end')

monitor.mark('checkout-end')
const total = monitor.measure('checkout-total', 'checkout-start', 'checkout-end')

console.log(`Checkout completed in ${total}ms`)
```

### SPA 路由监控

```typescript
router.beforeEach((to, from, next) => {
  monitor.mark(`route-${to.name}-start`)
  next()
})

router.afterEach((to) => {
  monitor.mark(`route-${to.name}-end`)
  const duration = monitor.measure(
    `route-${to.name}`,
    `route-${to.name}-start`,
    `route-${to.name}-end`
  )
  console.log(`Route ${to.name} took ${duration}ms`)
})
```

### 实时性能仪表板

```typescript
setInterval(() => {
  const stats = monitor.getEnhancedStats()
  
  updateMemoryGauge(stats.performance.memory?.usage)
  updateFPSDisplay(stats.performance.fps?.fps)
  updateLongTaskCount(stats.performance.longTasks?.longTaskCount)
  updateScrollDepth(stats.behavior.scroll?.maxDepthReached)
  updateTimeOnPage(stats.behavior.time?.activeTime)
}, 5000)
```

## 事件系统

所有增强功能通过统一的事件系统暴露数据：

```typescript
// 性能事件
monitor.on('performance:mark', (metric) => {
  console.log('Performance mark:', metric.name, metric.value)
})

monitor.on('performance:longtask', (taskInfo) => {
  console.warn('Long task detected:', taskInfo.duration + 'ms')
})

monitor.on('performance:memory-leak', (detection) => {
  console.error('Memory leak suspected:', detection.reason)
})

// 行为事件
monitor.on('behavior:scroll', (event) => {
  if (event.milestone) {
    console.log(`User scrolled to ${event.milestone}%`)
  }
})

monitor.on('behavior:time', (event) => {
  console.log('Active time:', event.activeTime)
})

// API 事件
monitor.on('api:graphql', (metrics) => {
  if (metrics.hasNPlusOne) {
    console.warn('N+1 query detected')
  }
})

monitor.on('api:websocket-connection', (conn) => {
  console.log('WebSocket:', conn.type, conn.url)
})

// 错误事件
monitor.on('error:group', (group) => {
  console.log('Error grouped:', group.fingerprint)
})
```

## 配置建议

### 开发环境

```typescript
const monitor = createEnhancedMonitor({
  environment: 'development',
  debug: true,
  sampleRate: 1.0,
  
  enhanced: {
    performance: {
      customMarks: true,
      longTasks: true,
      memory: true,
      fps: true,            // ✅ 开发环境启用
      optimization: true,   // ✅ 开发环境启用
    },
    behavior: {
      scrollDepth: true,
      timeOnPage: true,
    },
    api: {
      graphql: true,
      websocket: true,
    },
    offline: {
      enabled: false,       // ❌ 开发环境可以关闭
    },
  },
})
```

### 生产环境

```typescript
const monitor = createEnhancedMonitor({
  environment: 'production',
  sampleRate: 0.1, // 10% 采样
  
  enhanced: {
    performance: {
      customMarks: true,
      longTasks: true,
      memory: true,
      fps: false,           // ❌ 生产环境关闭
      optimization: false,  // ❌ 生产环境关闭
    },
    behavior: {
      scrollDepth: true,
      timeOnPage: true,
    },
    api: {
      graphql: true,
      websocket: true,
    },
    offline: {
      enabled: true,
      maxItems: 500,
      ttl: 3 * 24 * 60 * 60 * 1000,
    },
  },
})
```

## 性能影响

增强功能经过充分优化，对性能影响很小：

| 功能 | CPU 开销 | 内存开销 |
|------|----------|----------|
| 自定义性能标记 | < 0.1% | < 1MB |
| Long Tasks | < 0.1% | < 1MB |
| 内存监控 | < 0.2% | < 1MB |
| FPS 监控 | < 0.5% | < 1MB |
| 滚动深度 | < 0.1% | < 1MB |
| 停留时间 | < 0.1% | < 1MB |
| GraphQL 监控 | < 0.2% | < 2MB |
| WebSocket 监控 | < 0.2% | < 2MB |
| 离线缓存 | < 0.3% | < 5MB |
| 错误分析 | < 0.2% | < 2MB |

**总计**: < 2% CPU，< 10MB 内存

## 下一步

- 📖 [快速开始](/enhanced/getting-started) - 5分钟快速上手
- ⚡ [性能增强](/enhanced/performance-marks) - 深入了解性能监控
- 👤 [行为增强](/enhanced/scroll-depth) - 了解用户行为追踪
- 🔌 [API 增强](/enhanced/graphql) - 全面监控 API
- 🐛 [错误增强](/enhanced/cross-origin-error) - 智能错误处理
- 💡 [示例代码](/examples/enhanced) - 查看完整示例
