# @ldesign/monitor 迁移指南

本文档提供从其他监控系统迁移到 @ldesign/monitor 的指南。

## 目录

- [从 Sentry 迁移](#从-sentry-迁移)
- [从自建监控系统迁移](#从自建监控系统迁移)
- [版本升级指南](#版本升级指南)

## 从 Sentry 迁移

### 概念映射

| Sentry | @ldesign/monitor | 说明 |
|--------|------------------|------|
| `Sentry.init()` | `createMonitor().init()` | 初始化 |
| `Sentry.captureException()` | `monitor.trackError()` | 错误追踪 |
| `Sentry.captureMessage()` | `monitor.trackEvent()` | 自定义事件 |
| `Sentry.setUser()` | `monitor.setUser()` | 设置用户 |
| `Sentry.setTag()` | `monitor.setContext()` | 设置上下文 |
| `Sentry.addBreadcrumb()` | `monitor.addBreadcrumb()` | 添加面包屑 |

### 迁移步骤

#### 1. 安装

```bash
# 移除 Sentry
pnpm remove @sentry/browser @sentry/vue @sentry/react

# 安装 @ldesign/monitor
pnpm add @ldesign/monitor
```

#### 2. 初始化代码

**Before (Sentry)**:
```typescript
import * as Sentry from '@sentry/browser'

Sentry.init({
  dsn: 'https://xxxxx@sentry.io/xxxxx',
  environment: 'production',
  sampleRate: 0.1,
  tracesSampleRate: 0.1,
})
```

**After (@ldesign/monitor)**:
```typescript
import { createMonitor, applyPreset } from '@ldesign/monitor'

const monitor = createMonitor(
  applyPreset(
    {
      dsn: 'https://your-api.com/monitor',
      projectId: 'your-project',
    },
    'production'
  )
)

monitor.init()
```

#### 3. 错误追踪

**Before**:
```typescript
try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'checkout' },
    extra: { orderId: '123' },
  })
}
```

**After**:
```typescript
try {
  riskyOperation()
} catch (error) {
  monitor.trackError(error, {
    section: 'checkout',
    orderId: '123',
  })
}
```

#### 4. 用户信息

**Before**:
```typescript
Sentry.setUser({
  id: '123',
  email: 'user@example.com',
  username: 'john',
})
```

**After**:
```typescript
monitor.setUser({
  id: '123',
  email: 'user@example.com',
  name: 'john',
})
```

#### 5. Vue 集成

**Before**:
```typescript
import * as Sentry from '@sentry/vue'

Sentry.init({
  app,
  dsn: '...',
})
```

**After**:
```typescript
import { createMonitorPlugin } from '@ldesign/monitor/vue'

app.use(createMonitorPlugin({
  dsn: 'https://your-api.com/monitor',
  projectId: 'your-project',
}))
```

#### 6. React 集成

**Before**:
```typescript
import * as Sentry from '@sentry/react'

Sentry.init({ dsn: '...' })

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <YourApp />
    </Sentry.ErrorBoundary>
  )
}
```

**After**:
```typescript
import { MonitorProvider, ErrorBoundary } from '@ldesign/monitor/react'

function App() {
  return (
    <MonitorProvider config={{ dsn: '...', projectId: '...' }}>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <YourApp />
      </ErrorBoundary>
    </MonitorProvider>
  )
}
```

## 从自建监控系统迁移

### 通用步骤

#### 1. 分析现有系统

确定当前监控的内容：
- 性能指标
- 错误类型
- 用户行为
- 自定义事件

#### 2. 映射功能

| 功能 | @ldesign/monitor API |
|------|---------------------|
| 性能监控 | 自动收集 Web Vitals，或 `trackPerformance()` |
| 错误监控 | 自动捕获，或 `trackError()` |
| 页面浏览 | `trackPageView()` |
| 点击事件 | 自动收集，或 `trackEvent()` |
| API 调用 | 自动拦截（配置 `enableAPI: true`） |

#### 3. 数据迁移

如果需要保留历史数据：

```typescript
// 从旧系统导出数据
const oldData = await oldMonitor.exportData()

// 转换格式
const transformedData = oldData.map(item => ({
  type: item.eventType,
  data: item.payload,
  timestamp: item.time,
}))

// 批量上报到新系统
for (const data of transformedData) {
  monitor.trackEvent('migrated-data', data)
}
```

#### 4. 渐进式迁移

在过渡期同时运行两个系统：

```typescript
// 双写模式
function trackError(error: Error) {
  // 旧系统
  oldMonitor.log(error)
  
  // 新系统
  monitor.trackError(error)
}

// 一段时间后移除旧系统
```

## 版本升级指南

### 0.1.0 → 0.2.0 (计划中)

#### 破坏性变更

1. **配置结构调整**:

**Before**:
```typescript
{
  batch: { size: 10, interval: 5000 }
}
```

**After**:
```typescript
{
  batch: { 
    size: 10, 
    interval: 5000,
    maxWait: 30000  // 新增：最大等待时间
  }
}
```

2. **事件名称变更**:

| 旧事件名 | 新事件名 |
|---------|---------|
| `metric` | `performance` |
| `exception` | `error` |

**迁移代码**:
```typescript
// Before
monitor.on('metric', handler)
monitor.on('exception', handler)

// After
monitor.on('performance', handler)
monitor.on('error', handler)
```

#### 新功能

1. **性能预算**:
```typescript
monitor.setPerformanceBudget({
  FCP: 2000,
  LCP: 2500,
  CLS: 0.1,
})
```

2. **自定义维度**:
```typescript
monitor.setDimensions({
  appVersion: '1.0.0',
  locale: 'zh-CN',
})
```

### 最佳实践

#### 1. 使用配置预设

```typescript
// 开发环境
const devMonitor = createMonitor(
  applyPreset({ dsn, projectId }, 'development')
)

// 生产环境
const prodMonitor = createMonitor(
  applyPreset({ dsn, projectId }, 'production')
)
```

#### 2. 环境变量

```typescript
const monitor = createMonitor({
  dsn: import.meta.env.VITE_MONITOR_DSN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  environment: import.meta.env.MODE,
})
```

#### 3. 条件启用

```typescript
// 仅在生产环境启用
if (import.meta.env.PROD) {
  monitor.init()
}

// 或使用采样率
const monitor = createMonitor({
  dsn: '...',
  projectId: '...',
  sampleRate: import.meta.env.PROD ? 0.1 : 1.0,
})
```

#### 4. 数据脱敏

```typescript
import { createDataMasker } from '@ldesign/monitor'

const masker = createDataMasker()

// 自定义脱敏规则
masker.addRule({
  name: 'customToken',
  pattern: /token=([^&]+)/g,
  replacement: 'token=********',
})

// 在 beforeSend hook 中使用
{
  hooks: {
    beforeSend: (data) => {
      return masker.maskObject(data)
    }
  }
}
```

## 常见问题

### Q: 如何保证不丢失数据？

A: 使用离线存储功能：

```typescript
import { createOfflineStore } from '@ldesign/monitor'

const offlineStore = createOfflineStore()

monitor.on('report', async (data) => {
  if (!navigator.onLine) {
    await offlineStore.save(data)
  }
})

window.addEventListener('online', async () => {
  const cached = await offlineStore.getAll()
  // 批量上报缓存数据
})
```

### Q: 如何减少性能影响？

A: 使用以下策略：

1. 降低采样率
2. 增加批量大小和间隔
3. 禁用非必要功能
4. 使用性能优先预设

```typescript
const monitor = createMonitor(
  applyPreset({ dsn, projectId }, 'performanceFirst')
)
```

### Q: 如何自定义上报格式？

A: 使用 `beforeSend` hook：

```typescript
{
  hooks: {
    beforeSend: (data) => {
      return {
        ...data,
        // 添加自定义字段
        appVersion: '1.0.0',
        platform: 'web',
        // 转换格式
        timestamp: new Date(data.timestamp).toISOString(),
      }
    }
  }
}
```

## 获取帮助

- 📖 [完整文档](./README.md)
- 🏗️ [架构设计](./ARCHITECTURE.md)
- 📘 [API 参考](./API.md)
- 💬 [GitHub Issues](https://github.com/your-org/ldesign/issues)

## 反馈

如有任何迁移问题，欢迎提交 Issue 或 Pull Request！

