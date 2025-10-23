# @ldesign/monitor

<div align="center">

# 📈 全栈前端监控系统

**性能监控 · 错误追踪 · 行为分析 · 会话回放 · AI驱动**

---

[![版本](https://img.shields.io/badge/version-0.1.0-blue.svg)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](./tsconfig.json)
[![测试](https://img.shields.io/badge/tests-75%2B%25-green.svg)](./src/__tests__)
[![文档](https://img.shields.io/badge/docs-完整-green.svg)](./docs/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

**[English](./README.md)** | **简体中文**

</div>

---

## ✨ 核心特性

- 🚀 **性能监控** - 6大Web Vitals指标（FCP/LCP/FID/INP/CLS/TTFB）
- 🐛 **错误追踪** - 自动捕获所有JavaScript错误
- 📊 **用户行为** - 页面浏览、点击、表单全追踪
- 🌐 **API监控** - XHR/Fetch自动拦截监控
- 🎬 **会话回放** - rrweb集成，重现用户操作
- 🔥 **热力图** - 点击行为可视化
- 📈 **漏斗分析** - 转化率深度分析
- 🧪 **A/B测试** - 完整实验系统
- 🤖 **AI异常检测** - 智能识别性能问题
- 🔔 **智能告警** - 多级告警系统
- 🎨 **框架集成** - Vue 3 和 React 18+ 开箱即用
- 🔒 **隐私优先** - GDPR合规，数据脱敏

---

## 🚀 快速开始

### 安装

```bash
pnpm add @ldesign/monitor
```

### 初始化

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
})

// 完成！监控已自动启动
```

### 使用

```typescript
// 追踪自定义事件
monitor.trackEvent('button-click', { buttonId: 'submit' })

// 追踪错误
try {
  // 某些操作
} catch (error) {
  monitor.trackError(error)
}

// 追踪页面浏览
monitor.trackPageView('/dashboard')
```

---

## 📚 核心功能

### 性能监控

```typescript
import { createWebVitalsCollector } from '@ldesign/monitor'

const collector = createWebVitalsCollector()
collector.start((metric) => {
  console.log(`${metric.name}: ${metric.value}ms (${metric.rating})`)
})
```

**自动收集**: FCP, LCP, FID, INP, CLS, TTFB

### 错误追踪

```typescript
// 自动捕获所有错误
// - JavaScript 运行时错误
// - Promise rejection
// - 资源加载失败

// 也可手动追踪
monitor.trackError(new Error('Custom error'), {
  context: 'user-action',
})
```

**智能去重**: 相同错误自动合并

### 用户行为追踪

```typescript
import { createPageViewTracker, createClickTracker } from '@ldesign/monitor'

// 页面浏览
const pageView = createPageViewTracker()
pageView.start()

// 点击追踪
const click = createClickTracker()
click.start()
```

**自动追踪**: PV/UV、点击、表单提交

### API监控

```typescript
import { createAPIInterceptor } from '@ldesign/monitor'

const api = createAPIInterceptor()
api.start((request) => {
  console.log(`API: ${request.url} - ${request.duration}ms`)
})
```

**自动拦截**: XHR和Fetch请求

---

## 🎨 框架集成

### Vue 3

```typescript
// main.ts
import { createMonitorPlugin } from '@ldesign/monitor/vue'

app.use(createMonitorPlugin({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-vue-app',
}))
```

```vue
<!-- 组件中使用 -->
<script setup>
import { useMonitor } from '@ldesign/monitor/vue'

const monitor = useMonitor()

const handleClick = () => {
  monitor.trackEvent('button-click')
}
</script>
```

### React

```tsx
// App.tsx
import { MonitorProvider } from '@ldesign/monitor/react'

function App() {
  return (
    <MonitorProvider config={{ dsn: '...', projectId: '...' }}>
      <YourApp />
    </MonitorProvider>
  )
}
```

```tsx
// 组件中使用
import { useMonitor } from '@ldesign/monitor/react'

function MyComponent() {
  const monitor = useMonitor()
  
  return (
    <button onClick={() => monitor.trackEvent('click')}>
      Click me
    </button>
  )
}
```

---

## 📖 完整文档

### 📚 文档导航

| 文档 | 说明 | 推荐 |
|------|------|------|
| [🎯 START_HERE.md](./🎯_START_HERE.md) | 导航首页 | ⭐⭐⭐⭐⭐ |
| [QUICK_START.md](./QUICK_START.md) | 5分钟上手 | ⭐⭐⭐⭐⭐ |
| [docs/API.md](./docs/API.md) | API参考 | ⭐⭐⭐⭐⭐ |
| [docs/GUIDE.md](./docs/GUIDE.md) | 使用指南 | ⭐⭐⭐⭐⭐ |
| [docs/BEST_PRACTICES.md](./docs/BEST_PRACTICES.md) | 最佳实践 | ⭐⭐⭐⭐ |
| [INSTALLATION.md](./INSTALLATION.md) | 安装指南 | ⭐⭐⭐ |
| [📖_FEATURE_INDEX.md](./📖_FEATURE_INDEX.md) | 功能索引 | ⭐⭐⭐ |

### 💡 示例代码

| 示例 | 说明 | 难度 |
|------|------|------|
| [basic.ts](./examples/basic.ts) | 基础使用 | ⭐ 简单 |
| [vue-app.ts](./examples/vue-app.ts) | Vue集成 | ⭐⭐ 中等 |
| [react-app.tsx](./examples/react-app.tsx) | React集成 | ⭐⭐ 中等 |
| [advanced.ts](./examples/advanced.ts) | 高级功能 | ⭐⭐⭐ 高级 |

---

## 🌟 为什么选择 @ldesign/monitor？

### vs 商业产品

| 对比项 | Sentry | PostHog | @ldesign/monitor |
|--------|--------|---------|------------------|
| **价格** | $26/月起 | 按量计费 | 🎁 **完全免费** |
| **数据控制** | 第三方 | 可自建 | ✅ **完全掌控** |
| **功能** | 错误追踪为主 | 行为分析为主 | ✅ **全功能** |
| **Bundle** | 35KB | 大 | ✅ **<40KB** |
| **TypeScript** | 部分 | 部分 | ✅ **100%** |
| **文档** | 英文为主 | 英文为主 | ✅ **中英双语** |
| **学习成本** | 中 | 中 | ✅ **低（5分钟）** |

### 独特优势

1. ✅ **完全免费开源** - MIT许可证
2. ✅ **功能最全面** - 40+模块
3. ✅ **文档最详细** - 20个文档
4. ✅ **类型最安全** - 100% TypeScript
5. ✅ **集成最简单** - 2分钟完成
6. ✅ **性能最优** - <40KB
7. ✅ **隐私友好** - 可私有部署
8. ✅ **AI驱动** - 智能检测

---

## 📊 功能模块

<details>
<summary><b>点击查看完整功能列表（40+模块）</b></summary>

### 性能监控
- WebVitalsCollector - 6大核心指标
- NavigationTimingCollector - 导航性能
- ResourceTimingCollector - 资源性能

### 错误追踪
- JSErrorCollector - JS错误
- PromiseErrorCollector - Promise错误
- ResourceErrorCollector - 资源错误
- StackParser - 堆栈解析
- ErrorAggregator - 智能去重
- SourceMapResolver - Source Map
- SourceMapUploader - 上传工具
- StackResolver - 堆栈还原

### 数据上报
- Reporter - 上报管理器
- BatchQueue - 批量队列
- HttpReporter - HTTP上报
- BeaconReporter - Beacon上报
- RetryManager - 重试机制
- SamplingManager - 采样控制

### 用户信息
- UserManager - 用户管理
- SessionManager - 会话管理
- DeviceDetector - 设备检测
- ContextManager - 上下文管理

### 行为追踪
- PageViewTracker - 页面浏览
- ClickTracker - 点击追踪
- FormTracker - 表单追踪

### API监控
- APIInterceptor - XHR/Fetch拦截

### 会话回放
- SessionRecorder - rrweb集成

### 热力图
- ClickHeatmap - 点击热力图

### 漏斗分析
- FunnelAnalyzer - 转化分析

### A/B测试
- ExperimentManager - 实验管理

### AI功能
- AnomalyDetector - 异常检测

### 告警系统
- AlertEngine - 告警引擎

### 框架集成
- Vue 3 插件和Composables
- React Provider和Hooks

### 可视化
- Dashboard组件

</details>

---

## 🎯 使用场景

### 电商平台

```typescript
// 追踪购物流程
monitor.trackEvent('product-view', { productId, category })
monitor.trackEvent('add-to-cart', { productId, price })
monitor.trackEvent('checkout', { amount })
monitor.trackEvent('purchase', { orderId, amount })

// 漏斗分析
const funnel = createFunnelAnalyzer()
funnel.defineFunnel({
  id: 'purchase',
  steps: [
    { name: '浏览商品', event: 'product-view' },
    { name: '加入购物车', event: 'add-to-cart' },
    { name: '提交订单', event: 'checkout' },
    { name: '支付成功', event: 'purchase' },
  ],
})
```

### SaaS应用

```typescript
// 监控核心功能
monitor.trackEvent('feature-use', { feature: 'export', duration })
monitor.trackEvent('upgrade-click', { plan: 'premium' })

// A/B测试
const exp = createExperimentManager()
exp.createExperiment({
  id: 'pricing-page',
  variants: [
    { id: 'v1', name: '月付优先' },
    { id: 'v2', name: '年付优先' },
  ],
})
```

### 内容平台

```typescript
// 内容消费监控
monitor.trackEvent('article-read', { articleId, readTime })
monitor.trackEvent('video-watch', { videoId, watchTime })

// 热力图分析
const heatmap = createClickHeatmap()
// 分析用户点击最多的内容区域
```

---

## 🏆 项目亮点

### 代码质量

- ✅ TypeScript 5.7+ 严格模式
- ✅ 100% 类型覆盖
- ✅ 完整的 JSDoc 注释
- ✅ ESLint 0 错误
- ✅ 模块化设计

### 文档质量

- ✅ 20个文档文件
- ✅ 7,000+行文档
- ✅ 4个实战示例
- ✅ 中英双语

### 测试质量

- ✅ 7个测试套件
- ✅ 46+测试用例
- ✅ >75%覆盖率

---

## 📦 包信息

### 安装

```bash
pnpm add @ldesign/monitor
```

### Bundle 大小

- **核心功能**: ~15KB gzipped
- **全功能**: <40KB gzipped
- **按需导入**: 更小

### 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

---

## 🎯 快速导航

| 想要... | 查看文档 | 耗时 |
|---------|----------|------|
| **快速上手** | [QUICK_START.md](./QUICK_START.md) | 5分钟 |
| **查看API** | [docs/API.md](./docs/API.md) | 30分钟 |
| **深入学习** | [docs/GUIDE.md](./docs/GUIDE.md) | 1小时 |
| **最佳实践** | [docs/BEST_PRACTICES.md](./docs/BEST_PRACTICES.md) | 1小时 |
| **Vue集成** | [examples/vue-app.ts](./examples/vue-app.ts) | 10分钟 |
| **React集成** | [examples/react-app.tsx](./examples/react-app.tsx) | 10分钟 |
| **高级功能** | [examples/advanced.ts](./examples/advanced.ts) | 20分钟 |
| **功能索引** | [📖_FEATURE_INDEX.md](./📖_FEATURE_INDEX.md) | 15分钟 |

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

---

## 📄 许可证

MIT License © 2024 LDesign Team

---

<div align="center">

**功能完整** · **文档齐全** · **测试充分** · **立即可用**

[开始使用](./QUICK_START.md) · [查看文档](./docs/) · [运行示例](./examples/)

</div>

