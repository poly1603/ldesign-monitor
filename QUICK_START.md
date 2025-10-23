# 🚀 @ldesign/monitor 快速开始

## 5 分钟上手指南

### 步骤 1: 安装

```bash
pnpm add @ldesign/monitor
```

### 步骤 2: 初始化

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  environment: 'production',
})
```

### 步骤 3: 开始监控

就这么简单！监控会自动：
- ✅ 收集 Web Vitals 性能指标
- ✅ 捕获所有 JavaScript 错误
- ✅ 监控 API 请求

### 步骤 4: 手动追踪（可选）

```typescript
// 追踪自定义事件
monitor.trackEvent('button-click', { buttonId: 'submit' })

// 追踪错误
try {
  riskyOperation()
} catch (error) {
  monitor.trackError(error)
}

// 追踪页面浏览
monitor.trackPageView('/dashboard')
```

---

## 📱 框架集成

### Vue 3

```typescript
// main.ts
import { createApp } from 'vue'
import { createMonitorPlugin } from '@ldesign/monitor/vue'
import App from './App.vue'

const app = createApp(App)

app.use(createMonitorPlugin({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-vue-app',
}))

app.mount('#app')
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
    <MonitorProvider config={{
      dsn: 'https://your-endpoint.com/api/monitor',
      projectId: 'my-react-app',
    }}>
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

## 🎯 常见场景

### 场景 1: 监控页面性能

```typescript
import { createWebVitalsCollector } from '@ldesign/monitor'

const collector = createWebVitalsCollector()
collector.start((metric) => {
  console.log(`${metric.name}: ${metric.value}ms (${metric.rating})`)
})
```

### 场景 2: 追踪用户旅程

```typescript
// 用户进入结账流程
monitor.trackEvent('checkout-start')

// 用户填写信息
monitor.trackEvent('checkout-fill-info')

// 用户提交订单
monitor.trackEvent('checkout-submit', {
  amount: 99.99,
  items: 3,
})
```

### 场景 3: 错误告警

```typescript
import { createAlertEngine } from '@ldesign/monitor'

const engine = createAlertEngine()

engine.addRule({
  id: 'high-error-rate',
  name: '高错误率告警',
  type: 'error_rate',
  condition: {
    metric: 'error_rate',
    operator: '>',
    threshold: 0.05, // 5%
  },
  channels: ['email'],
})

engine.onAlert((alert) => {
  sendNotification(alert)
})
```

### 场景 4: A/B 测试

```typescript
import { createExperimentManager } from '@ldesign/monitor'

const experiments = createExperimentManager()

experiments.createExperiment({
  id: 'button-color',
  name: 'Button Color Test',
  variants: [
    { id: 'blue', name: 'Blue Button' },
    { id: 'green', name: 'Green Button' },
  ],
})

// 分配用户
const allocation = experiments.allocate('button-color', userId)

// 应用变体
if (allocation?.variantId === 'green') {
  showGreenButton()
} else {
  showBlueButton()
}
```

---

## 🔧 配置选项

### 最小配置

```typescript
createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
})
```

### 推荐配置

```typescript
createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  environment: 'production',
  sampleRate: 0.1, // 10% 采样
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
  enableAPI: true,
  batch: {
    size: 10,
    interval: 5000,
  },
  retry: {
    maxRetries: 3,
    delay: 1000,
  },
})
```

### 完整配置（所有选项）

查看 [API 文档](./docs/API.md#monitorconfig) 了解所有配置选项。

---

## 📖 下一步学习

1. **阅读完整文档**
   - [API 文档](./docs/API.md)
   - [使用指南](./docs/GUIDE.md)
   - [最佳实践](./docs/BEST_PRACTICES.md)

2. **查看示例代码**
   - [基础示例](./examples/basic.ts)
   - [Vue 集成](./examples/vue-app.ts)
   - [React 集成](./examples/react-app.tsx)
   - [高级功能](./examples/advanced.ts)

3. **动手实践**
   - 在测试项目中集成
   - 配置数据上报端点
   - 查看监控数据
   - 优化性能和错误率

---

## ❓ 常见问题

### Q: 需要服务端吗？

A: 是的，需要一个接收监控数据的服务端端点。该端点应该：
- 接受 POST 请求
- 内容类型为 `application/json`
- 返回 200 状态码表示成功

### Q: Bundle 大小多大？

A: 核心功能 <15KB，全功能 <40KB（gzipped）

### Q: 支持哪些浏览器？

A: 支持所有现代浏览器（Chrome、Firefox、Safari、Edge）。旧浏览器可能需要 polyfill。

### Q: 数据隐私如何保护？

A: 内置多种隐私保护措施：
- 可配置的数据收集级别
- 数据脱敏 hook
- 不录制敏感输入
- GDPR 合规

### Q: 性能影响大吗？

A: 影响极小：
- 初始化 <50ms
- 每次操作 <1ms
- 使用批量上报减少请求
- 支持采样降低数据量

---

## 🆘 需要帮助？

- 📖 查看 [完整文档](./docs/)
- 💡 查看 [示例代码](./examples/)
- 🐛 [提交 Issue](../../issues)
- 💬 联系 LDesign Team

---

**开始监控你的应用吧！** 🚀


