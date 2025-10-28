# @ldesign/monitor - 新功能使用指南

## 🎉 概述

本指南介绍 @ldesign/monitor v0.2.0 中新增的7个核心功能。

## ✨ 新功能列表

### 性能监控增强 (5个)
1. ✅ 自定义性能标记 (CustomMarkCollector)
2. ✅ Long Tasks 检测 (LongTaskCollector)
3. ✅ 内存监控 (MemoryCollector)
4. ✅ 帧率监控 (FPSCollector)
5. ✅ 首屏优化建议 (RenderOptimizationAdvisor)

### 用户行为增强 (2个)
6. ✅ 滚动深度追踪 (ScrollDepthTracker)
7. ✅ 停留时间统计 (TimeOnPageTracker)

---

## 📦 安装

```bash
pnpm add @ldesign/monitor@latest
```

## 🚀 快速开始

### 1. 基础设置

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  environment: 'production',
})

monitor.init()
```

### 2. 使用新功能

```typescript
import {
  CustomMarkCollector,
  LongTaskCollector,
  MemoryCollector,
  FPSCollector,
  RenderOptimizationAdvisor,
  ScrollDepthTracker,
  TimeOnPageTracker,
} from '@ldesign/monitor'
```

---

## 📖 功能详解

### 1. 自定义性能标记

**用途**: 追踪自定义业务流程的性能

```typescript
const collector = new CustomMarkCollector()

collector.start((metric) => {
  console.log(`${metric.name}: ${metric.value}ms`)
})

// 标记开始
collector.mark('feature-start')

// ... 执行操作 ...

// 标记结束
collector.mark('feature-end')

// 测量时间
const duration = collector.measure('feature-duration', 'feature-start', 'feature-end')
```

**关键方法**:
- `mark(name)` - 创建性能标记
- `measure(name, startMark, endMark)` - 测量两个标记之间的时间
- `clearMarks(name?)` - 清除标记
- `getMarks()` - 获取所有标记

---

### 2. Long Tasks 检测

**用途**: 检测阻塞主线程的长任务

```typescript
const collector = new LongTaskCollector({
  threshold: 50, // 超过50ms算长任务
})

collector.start((taskInfo) => {
  console.log('Long task detected:', {
    duration: taskInfo.duration,
    blockingTime: taskInfo.attribution?.blockingTime,
  })
})

// 获取统计
const stats = collector.getStats()
console.log('Total blocking time:', stats.totalBlockingTime)
```

**收集数据**:
- 任务持续时间
- 阻塞时间 (超过50ms的部分)
- 归因信息 (任务来源)
- 长任务总数

---

### 3. 内存监控

**用途**: 监控内存使用和检测内存泄漏

```typescript
const collector = new MemoryCollector({
  interval: 30000, // 每30秒检查一次
  warningThreshold: 100 * 1024 * 1024, // 100MB
})

collector.start((metric) => {
  console.log('Memory usage:', metric.attribution?.formatted.used)
})

// 检测内存泄漏
const leak = collector.detectMemoryLeak()
if (leak.suspected) {
  console.warn('Memory leak suspected:', leak.reason)
}

// 获取内存趋势
const trend = collector.getMemoryTrend()
console.log('Memory growing at:', trend?.rate, 'bytes/s')
```

**监控指标**:
- 已使用内存
- 内存使用率
- 内存趋势
- 内存泄漏检测

---

### 4. 帧率监控

**用途**: 监控页面流畅度

```typescript
const collector = new FPSCollector({
  interval: 1000, // 每秒计算FPS
  lowFPSThreshold: 30,
  freezeThreshold: 20,
})

collector.start((metric) => {
  if (metric.value < 30) {
    console.warn('Low FPS:', metric.value)
  }
})

const info = collector.getFPSInfo()
console.log('Average FPS:', info.avgFPS)
console.log('Freeze count:', info.freezeCount)
```

**监控指标**:
- 实时 FPS
- 平均/最小/最大 FPS
- 卡顿次数
- 流畅度评分

---

### 5. 首屏优化建议

**用途**: 分析性能并提供优化建议

```typescript
const advisor = new RenderOptimizationAdvisor()

// 更新Web Vitals
advisor.updateWebVital('LCP', 3000)
advisor.updateWebVital('FCP', 2000)

// 分析性能
const analysis = advisor.analyze()

console.log('Performance Score:', analysis.score)
console.log('Suggestions:')
analysis.suggestions.forEach(s => {
  console.log(`- [${s.type}] ${s.title}`)
  console.log(`  ${s.description}`)
  if (s.estimatedGain) {
    console.log(`  Estimated gain: ${s.estimatedGain}ms`)
  }
})
```

**分析维度**:
- 资源加载 (大小、数量、缓存)
- 渲染性能 (FCP、LCP、CLS)
- 脚本优化 (阻塞脚本、第三方脚本)
- 样式优化 (CSS大小、关键CSS)
- 图片优化 (格式、压缩、懒加载)
- 字体优化 (数量、加载策略)
- 网络性能 (DNS、TCP、TTFB)

**建议级别**:
- 🔴 Critical - 严重影响性能
- 🟡 Important - 重要优化点
- 🟢 Optional - 可选优化

---

### 6. 滚动深度追踪

**用途**: 追踪用户滚动行为

```typescript
const tracker = new ScrollDepthTracker({
  milestones: [25, 50, 75, 100], // 里程碑百分比
  trackElementVisibility: true,
})

tracker.start(
  (event) => {
    if (event.milestone) {
      console.log(`Reached ${event.milestone}%`)
    }
  },
  (event) => {
    console.log(`Element ${event.selector} is ${event.visibility}% visible`)
  }
)

// 追踪特定元素
tracker.trackElement('.hero-section')
tracker.trackElement('.cta-button')

// 获取统计
const stats = tracker.getStats()
console.log('Max depth:', stats.maxDepthReached)
console.log('Scroll distance:', stats.totalScrollDistance)
```

**追踪数据**:
- 滚动深度百分比
- 里程碑达成
- 元素可见性
- 滚动距离和速度

---

### 7. 停留时间统计

**用途**: 统计页面和元素停留时间

```typescript
const tracker = new TimeOnPageTracker({
  checkInterval: 5000,
  inactiveTimeout: 30000, // 30秒无活动算不活跃
})

tracker.start(
  (event) => {
    console.log('Time on page:', {
      total: event.totalTime,
      active: event.activeTime,
      visible: event.visibleTime,
    })
  },
  (event) => {
    console.log(`Element ${event.selector} visible for ${event.totalVisibleTime}ms`)
  }
)

// 追踪元素
tracker.trackElement('.product-video')

// 会话管理
const sessionManager = new SessionTimeManager()
sessionManager.startSession('session-123')
```

**统计数据**:
- 总停留时间
- 活跃/不活跃时间
- 可见/隐藏时间
- 元素级别停留时间

---

## 💡 实战场景

### 场景1: 电商结账流程监控

```typescript
async function monitorCheckout() {
  collector.mark('checkout-start')
  
  collector.mark('step1-start')
  await validateCart()
  collector.mark('step1-end')
  
  collector.mark('step2-start')
  await processPayment()
  collector.mark('step2-end')
  
  collector.mark('checkout-end')
  
  const duration = collector.measure('checkout-total', 'checkout-start', 'checkout-end')
  console.log(`Checkout completed in ${duration}ms`)
}
```

### 场景2: SPA 页面切换监控

```typescript
router.beforeEach((to, from, next) => {
  const pageName = to.name
  collector.mark(`page-${pageName}-start`)
  next()
})

router.afterEach((to) => {
  const pageName = to.name
  collector.mark(`page-${pageName}-end`)
  const duration = collector.measure(
    `page-${pageName}-load`,
    `page-${pageName}-start`,
    `page-${pageName}-end`
  )
  
  monitor.trackEvent('page-transition', {
    page: pageName,
    duration,
  })
})
```

### 场景3: 内容互动分析

```typescript
// 追踪文章阅读深度
scrollDepthTracker.trackElement('article')

// 追踪视频观看时间
timeOnPageTracker.trackElement('.video-player')

// 获取数据
const scrollStats = scrollDepthTracker.getStats()
const timeStats = timeOnPageTracker.getStats()

// 计算用户参与度
const engagementScore = calculateEngagement(scrollStats, timeStats)
```

---

## ⚙️ 配置建议

### 开发环境

```typescript
{
  enablePerformance: true,
  debug: true,
  sampleRate: 1.0,
  
  // 详细的性能监控
  performance: {
    customMarks: { enable: true },
    longTasks: { enable: true, threshold: 50 },
    memory: { enable: true, interval: 10000 },
    fps: { enable: true, interval: 1000 },
  }
}
```

### 生产环境

```typescript
{
  enablePerformance: true,
  sampleRate: 0.1, // 10%采样
  
  // 关键性能监控
  performance: {
    customMarks: { enable: true },
    longTasks: { enable: true, threshold: 100 },
    memory: { enable: true, interval: 60000 },
    fps: { enable: false }, // 生产环境关闭FPS监控
  }
}
```

---

## 🔧 性能影响

| 功能 | CPU 开销 | 内存开销 | 建议场景 |
|------|---------|---------|---------|
| CustomMarkCollector | < 0.1% | 很小 | 所有环境 |
| LongTaskCollector | 0% | 很小 | 所有环境 |
| MemoryCollector | < 0.1% | 很小 | 所有环境 |
| FPSCollector | ~0.5% | 很小 | 开发/测试 |
| RenderOptimizationAdvisor | 一次性 | 中等 | 开发环境 |
| ScrollDepthTracker | < 0.2% | 小 | 所有环境 |
| TimeOnPageTracker | < 0.2% | 小 | 所有环境 |

---

## 🌐 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| CustomMarkCollector | 85+ | 89+ | 15+ | 85+ |
| LongTaskCollector | 58+ | ❌ | ❌ | 79+ |
| MemoryCollector | 85+ | ❌ | ❌ | 85+ |
| FPSCollector | 全部 | 全部 | 全部 | 全部 |
| RenderOptimizationAdvisor | 85+ | 89+ | 15+ | 85+ |
| ScrollDepthTracker | 58+ | 55+ | 12.1+ | 79+ |
| TimeOnPageTracker | 58+ | 55+ | 12.1+ | 79+ |

**注意**: 所有功能都包含优雅降级，不支持的浏览器会跳过相应功能。

---

## 📚 更多资源

- [完整文档](./FEATURE_ENHANCEMENTS.md)
- [API 参考](./docs/API.md)
- [示例代码](./examples/enhanced-features.ts)
- [最佳实践](./docs/BEST_PRACTICES.md)

---

## 🐛 问题反馈

如有问题，请在 [GitHub Issues](https://github.com/ldesign/monitor/issues) 提交。

---

**版本**: 0.2.0  
**更新日期**: 2025-10-28  
**维护者**: LDesign Team
