# 快速开始

本指南将帮助你在 5 分钟内快速集成 @ldesign/monitor 到你的项目中。

## 安装

使用你喜欢的包管理器安装：

::: code-group

```bash [npm]
npm install @ldesign/monitor
```

```bash [yarn]
yarn add @ldesign/monitor
```

```bash [pnpm]
pnpm add @ldesign/monitor
```

:::

## 基础使用

### 1. 创建监控实例

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  environment: 'production',
  sampleRate: 1.0,
})
```

### 2. 初始化监控

```typescript
monitor.init()
```

就这么简单！监控系统现在已经开始自动收集：

- ✅ 性能指标 (FCP, LCP, FID, CLS, TTFB)
- ✅ JavaScript 错误
- ✅ Promise 错误
- ✅ 资源加载错误
- ✅ API 请求 (Fetch/XMLHttpRequest)

### 3. 手动追踪事件

```typescript
// 追踪自定义事件
monitor.trackEvent('button_click', {
  button_name: 'checkout',
  page: '/cart',
})

// 追踪页面访问
monitor.trackPageView('/products')

// 手动上报错误
try {
  riskyOperation()
} catch (error) {
  monitor.captureError(error, {
    level: 'error',
    tags: { feature: 'checkout' },
  })
}
```

## 增强功能

如果你需要更强大的功能，可以使用 `createEnhancedMonitor`：

```typescript
import { createEnhancedMonitor } from '@ldesign/monitor'

const monitor = createEnhancedMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  environment: 'production',
  
  // 一键启用所有增强功能
  enhanced: {
    performance: {
      customMarks: true,      // 自定义性能标记
      longTasks: true,        // Long Tasks 检测
      memory: true,           // 内存监控
      fps: false,             // FPS 监控（生产环境建议关闭）
      optimization: true,     // 优化建议
    },
    behavior: {
      scrollDepth: true,      // 滚动深度追踪
      timeOnPage: true,       // 停留时间统计
    },
    api: {
      graphql: true,          // GraphQL 监控
      websocket: true,        // WebSocket 监控
    },
    offline: {
      enabled: true,          // 离线缓存
      maxItems: 1000,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7天
    },
    error: {
      crossOrigin: true,      // 跨域错误
      framework: true,        // 框架集成
      analytics: true,        // 错误分析
    },
  },
})

monitor.init()
```

## 框架集成

### Vue 3

```vue
<script setup>
import { useMonitor } from '@ldesign/monitor/vue'

const monitor = useMonitor()

const handleClick = () => {
  monitor.trackEvent('button_click')
}
</script>

<template>
  <button @click="handleClick">Click Me</button>
</template>
```

### React

```tsx
import { useMonitor } from '@ldesign/monitor/react'

function MyComponent() {
  const monitor = useMonitor()
  
  return (
    <button onClick={() => monitor.trackEvent('button_click')}>
      Click Me
    </button>
  )
}
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dsn` | `string` | **必填** | 数据上报端点 |
| `projectId` | `string` | **必填** | 项目 ID |
| `environment` | `string` | `'production'` | 环境标识 |
| `sampleRate` | `number` | `1.0` | 采样率 (0-1) |
| `debug` | `boolean` | `false` | 调试模式 |
| `enablePerformance` | `boolean` | `true` | 启用性能监控 |
| `enableError` | `boolean` | `true` | 启用错误追踪 |
| `enableBehavior` | `boolean` | `true` | 启用行为追踪 |

完整配置选项请查看 [配置文档](/guide/configuration)。

## 环境配置

### 开发环境

```typescript
const monitor = createEnhancedMonitor({
  dsn: 'http://localhost:3000/api/monitor',
  projectId: 'my-app-dev',
  environment: 'development',
  debug: true,
  sampleRate: 1.0, // 100% 采样
  
  enhanced: {
    performance: {
      fps: true,            // 开发环境启用 FPS
      optimization: true,   // 开发环境启用优化分析
    },
    offline: {
      enabled: false,       // 开发环境可以关闭离线缓存
    },
  },
})
```

### 生产环境

```typescript
const monitor = createEnhancedMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-app',
  environment: 'production',
  sampleRate: 0.1, // 10% 采样
  
  enhanced: {
    performance: {
      fps: false,           // 生产环境关闭 FPS
      optimization: false,  // 生产环境关闭优化分析
    },
    offline: {
      enabled: true,
      maxItems: 500,
      ttl: 3 * 24 * 60 * 60 * 1000, // 3天
    },
  },
  
  // 数据脱敏
  hooks: {
    beforeSend: (data) => {
      if (data.context?.url) {
        data.context.url = data.context.url.replace(/token=[^&]+/, 'token=[REDACTED]')
      }
      return data
    },
  },
})
```

## 下一步

- 📖 阅读 [核心概念](/guide/concepts)
- 🚀 探索 [增强功能](/enhanced/overview)
- 💡 查看 [实战示例](/examples/basic)
- 🔧 了解 [API 参考](/api/core)

## 常见问题

### 如何查看上报的数据？

你需要搭建自己的监控后端服务来接收数据。我们提供了参考实现：

- [Node.js 后端示例](https://github.com/ldesign/monitor-backend)
- [数据库 Schema](https://github.com/ldesign/monitor-backend/blob/main/schema.sql)

### 为什么没有数据上报？

请检查：

1. `dsn` 配置是否正确
2. 网络请求是否被 CORS 拦截
3. 采样率 `sampleRate` 是否设置过低
4. 浏览器控制台是否有报错

### 性能影响如何？

@ldesign/monitor 经过充分优化：

- 包体积: ~50KB (gzipped)
- 运行时开销: <1% CPU
- 内存占用: <5MB
- 批量上报，减少网络请求

### 支持哪些浏览器？

支持所有现代浏览器：

- Chrome >= 60
- Firefox >= 60
- Safari >= 11
- Edge >= 79

不支持 IE11 及更低版本。
