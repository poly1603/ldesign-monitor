# @ldesign/monitor 使用指南

## 安装

```bash
pnpm add @ldesign/monitor
```

## 基础使用

### 1. 创建监控实例

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  environment: 'production',
})

monitor.init()
```

### 2. 自动监控

初始化后，以下内容会自动监控：
- ✅ Web Vitals (FCP, LCP, FID, CLS, TTFB, INP)
- ✅ 页面导航性能
- ✅ 资源加载性能
- ✅ JavaScript 错误
- ✅ Promise rejection
- ✅ 资源加载错误

### 3. 手动追踪

```typescript
// 追踪自定义事件
monitor.trackEvent('purchase-complete', {
  amount: 99.99,
  currency: 'USD',
})

// 追踪性能指标
monitor.trackPerformance('checkout-duration', 3500)

// 追踪错误
monitor.trackError(new Error('Payment failed'), {
  paymentMethod: 'credit-card',
})
```

## Vue 3 集成

### 安装插件

```typescript
// main.ts
import { createApp } from 'vue'
import { createMonitorPlugin } from '@ldesign/monitor'
import App from './App.vue'

const app = createApp(App)

app.use(createMonitorPlugin({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-vue-app',
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
}))

app.mount('#app')
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useMonitor } from '@ldesign/monitor'

const monitor = useMonitor()

const handleSubmit = async (formData) => {
  try {
    await submitForm(formData)
    monitor.trackEvent('form-submit-success', {
      form: 'contact-form',
    })
  } catch (error) {
    monitor.trackError(error, {
      form: 'contact-form',
    })
  }
}
</script>
```

## React 集成

### 设置 Provider

```tsx
// App.tsx
import { MonitorProvider } from '@ldesign/monitor'

function App() {
  return (
    <MonitorProvider config={{
      dsn: 'https://your-endpoint.com/api/monitor',
      projectId: 'my-react-app',
      enablePerformance: true,
      enableError: true,
    }}>
      <YourApp />
    </MonitorProvider>
  )
}
```

### 使用 Hook

```tsx
import { useMonitor } from '@ldesign/monitor'

function Component() {
  const monitor = useMonitor()
  
  const handleClick = () => {
    monitor.trackEvent('button-click', {
      buttonId: 'submit',
    })
  }
  
  return <button onClick={handleClick}>Submit</button>
}
```

### 使用 ErrorBoundary

```tsx
import { ErrorBoundary } from '@ldesign/monitor'

<ErrorBoundary fallback={<ErrorPage />}>
  <YourComponent />
</ErrorBoundary>
```

## 配置选项

### 必需配置

- `dsn` - 数据上报端点 URL
- `projectId` - 项目唯一标识

### 可选配置

- `environment` - 环境标识（默认：'production'）
- `sampleRate` - 采样率 0-1（默认：1.0）
- `enablePerformance` - 启用性能监控（默认：true）
- `enableError` - 启用错误追踪（默认：true）
- `enableBehavior` - 启用行为追踪（默认：true）
- `enableAPI` - 启用API监控（默认：true）
- `enableReplay` - 启用会话回放（默认：false）
- `debug` - 调试模式（默认：false）

### 批量上报配置

```typescript
{
  batch: {
    size: 10,        // 批量大小（默认：10）
    interval: 5000,  // 批量间隔ms（默认：5000）
  }
}
```

### 重试配置

```typescript
{
  retry: {
    maxRetries: 3,  // 最大重试次数（默认：3）
    delay: 1000,    // 重试延迟ms（默认：1000）
  }
}
```

### Hook 配置

```typescript
{
  hooks: {
    beforeSend: (data) => {
      // 数据脱敏
      if (data.context?.url) {
        data.context.url = data.context.url.replace(/token=[^&]+/, 'token=[REDACTED]')
      }
      return data
    },
    afterError: (error) => {
      console.log('Error captured:', error)
    },
    afterPerformance: (metric) => {
      console.log('Performance:', metric)
    },
  }
}
```

## 最佳实践

### 1. 开发环境配置

```typescript
const monitor = createMonitor({
  dsn: 'http://localhost:3000/api/monitor',
  projectId: 'my-app-dev',
  environment: 'development',
  sampleRate: 1.0,   // 100% 采样
  debug: true,       // 启用调试
})
```

### 2. 生产环境配置

```typescript
const monitor = createMonitor({
  dsn: 'https://monitor.myapp.com/api/monitor',
  projectId: 'my-app',
  environment: 'production',
  sampleRate: 0.1,   // 10% 采样
  hooks: {
    beforeSend: sanitizeData,
  },
})
```

### 3. 隐私保护

```typescript
function sanitizeData(data) {
  // 移除敏感信息
  if (data.context?.url) {
    data.context.url = removeSensitiveParams(data.context.url)
  }
  // 不上报特定用户
  if (data.user?.email?.includes('@internal.com')) {
    return null // 阻止上报
  }
  return data
}
```

### 4. 性能优化

```typescript
const monitor = createMonitor({
  sampleRate: 0.1,          // 采样减少数据量
  batch: {
    size: 20,               // 增大批量减少请求
    interval: 10000,        // 延长间隔
  },
  enableBehavior: false,    // 关闭非必需功能
})
```

## 常见问题

### Q: 如何只监控错误不监控性能？

```typescript
const monitor = createMonitor({
  enablePerformance: false,
  enableError: true,
  enableBehavior: false,
  enableAPI: false,
})
```

### Q: 如何在特定页面禁用监控？

```typescript
// 在特定页面
if (window.location.pathname === '/admin') {
  monitor.disable()
}
```

### Q: 如何自定义错误指纹？

```typescript
// 使用 beforeSend hook
hooks: {
  beforeSend: (data) => {
    if (data.type === 'error') {
      data.fingerprint = customFingerprint(data)
    }
    return data
  }
}
```

### Q: 如何实现自建服务端？

服务端需要实现一个接收数据的端点：

```typescript
// Express 示例
app.post('/api/monitor', async (req, res) => {
  const { events, timestamp } = req.body
  
  // 存储events到数据库
  await db.events.insertMany(events)
  
  res.json({ success: true, accepted: events.length })
})
```

---

## 更多资源

- [README.md](../README.md) - 快速开始
- [PROJECT_PLAN.md](../PROJECT_PLAN.md) - 项目规划
- [CHANGELOG.md](../CHANGELOG.md) - 版本历史
- [API.md](./API.md) - API 参考
- [examples/](../examples/) - 示例代码

---

**文档版本**: 1.0  
**最后更新**: 2024-01-23
