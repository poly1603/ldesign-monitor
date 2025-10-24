# @ldesign/monitor API 参考文档

## Monitor 核心类

### createMonitor(config)

创建监控实例。

**参数:**
- `config: MonitorConfig` - 监控配置

**返回:**
- `Monitor` - 监控实例

**示例:**
```typescript
const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  enablePerformance: true,
  enableError: true,
})
```

### monitor.init()

初始化监控器，启动所有收集器。

**示例:**
```typescript
monitor.init()
```

### monitor.trackPerformance(metric, value)

追踪性能指标。

**参数:**
- `metric: string` - 指标名称
- `value: number` - 指标值

**示例:**
```typescript
monitor.trackPerformance('page-load', 2500)
```

### monitor.trackError(error, context?)

追踪错误。

**参数:**
- `error: Error` - 错误对象
- `context?: object` - 额外上下文

**示例:**
```typescript
try {
  // your code
} catch (error) {
  monitor.trackError(error, { action: 'user-submit' })
}
```

### monitor.trackEvent(name, properties?)

追踪自定义事件。

**参数:**
- `name: string` - 事件名称
- `properties?: object` - 事件属性

**示例:**
```typescript
monitor.trackEvent('button-click', {
  buttonId: 'submit',
  page: '/checkout',
})
```

### monitor.trackPageView(page)

追踪页面浏览。

**参数:**
- `page: string` - 页面路径

**示例:**
```typescript
monitor.trackPageView('/dashboard')
```

### monitor.setUser(user)

设置用户信息。

**参数:**
- `user: UserInfo` - 用户信息

**示例:**
```typescript
monitor.setUser({
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
})
```

### monitor.setContext(context)

设置上下文信息。

**参数:**
- `context: object` - 上下文数据

**示例:**
```typescript
monitor.setContext({
  page: 'dashboard',
  feature: 'analytics',
})
```

### monitor.addBreadcrumb(breadcrumb)

添加面包屑。

**参数:**
- `breadcrumb: Breadcrumb` - 面包屑数据

**示例:**
```typescript
monitor.addBreadcrumb({
  type: 'navigation',
  message: 'User clicked button',
  level: 'info',
  timestamp: Date.now(),
})
```

### monitor.enable() / monitor.disable()

启用/禁用监控。

**示例:**
```typescript
monitor.disable() // 暂停监控
monitor.enable()  // 恢复监控
```

### monitor.on(event, handler)

监听事件。

**参数:**
- `event: string` - 事件名称
- `handler: Function` - 事件处理函数

**返回:**
- `Function` - 取消订阅函数

**示例:**
```typescript
const unsubscribe = monitor.on('performance', (metric) => {
  console.log('Performance:', metric)
})

// 取消订阅
unsubscribe()
```

---

## Vue 集成

### createMonitorPlugin(config)

创建 Vue 插件。

**参数:**
- `config: MonitorConfig` - 监控配置

**返回:**
- `Plugin` - Vue 插件

**示例:**
```typescript
import { createMonitorPlugin } from '@ldesign/monitor'

app.use(createMonitorPlugin({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-vue-app',
}))
```

### useMonitor()

在组件中使用监控器。

**返回:**
- `Monitor` - 监控实例

**示例:**
```vue
<script setup>
import { useMonitor } from '@ldesign/monitor'

const monitor = useMonitor()

const handleClick = () => {
  monitor.trackEvent('button-click')
}
</script>
```

---

## React 集成

### MonitorProvider

监控器 Provider 组件。

**Props:**
- `config: MonitorConfig` - 监控配置
- `children: ReactNode` - 子组件

**示例:**
```tsx
import { MonitorProvider } from '@ldesign/monitor'

function App() {
  return (
    <MonitorProvider config={{ /* config */ }}>
      <YourApp />
    </MonitorProvider>
  )
}
```

### useMonitor()

在组件中使用监控器。

**返回:**
- `Monitor` - 监控实例

**示例:**
```tsx
import { useMonitor } from '@ldesign/monitor'

function Component() {
  const monitor = useMonitor()
  
  const handleClick = () => {
    monitor.trackEvent('button-click')
  }
  
  return <button onClick={handleClick}>Click</button>
}
```

### ErrorBoundary

错误边界组件。

**Props:**
- `children: ReactNode` - 子组件
- `fallback?: ReactNode` - 错误时显示的内容
- `onError?: Function` - 错误回调

**示例:**
```tsx
import { ErrorBoundary } from '@ldesign/monitor'

<ErrorBoundary fallback={<div>Error occurred</div>}>
  <YourComponent />
</ErrorBoundary>
```

---

## 类型定义

### MonitorConfig

监控配置接口。

```typescript
interface MonitorConfig {
  dsn: string                    // 必需：数据端点
  projectId: string              // 必需：项目ID
  environment?: string           // 环境
  sampleRate?: number            // 采样率 (0-1)
  enablePerformance?: boolean    // 启用性能监控
  enableError?: boolean          // 启用错误追踪
  enableBehavior?: boolean       // 启用行为追踪
  enableAPI?: boolean            // 启用API监控
  enableReplay?: boolean         // 启用会话回放
  batch?: {
    size?: number                // 批量大小
    interval?: number            // 批量间隔(ms)
  }
  retry?: {
    maxRetries?: number          // 最大重试次数
    delay?: number               // 重试延迟(ms)
  }
  debug?: boolean                // 调试模式
  hooks: {
    beforeSend?: Function        // 发送前钩子
    afterError?: Function        // 错误后钩子
    afterPerformance?: Function  // 性能后钩子
  }
}
```

### UserInfo

用户信息接口。

```typescript
interface UserInfo {
  id?: string        // 用户ID
  name?: string      // 用户名
  email?: string     // 邮箱
  attributes?: object // 自定义属性
}
```

### PerformanceMetric

性能指标接口。

```typescript
interface PerformanceMetric {
  name: string                   // 指标名称
  value: number                  // 指标值
  unit?: string                  // 单位
  rating?: 'good' | 'needs-improvement' | 'poor'
  attribution?: object           // 归因信息
}
```

### ErrorInfo

错误信息接口。

```typescript
interface ErrorInfo {
  message: string                // 错误消息
  type: string                   // 错误类型
  stack?: string                 // 堆栈信息
  level: 'fatal' | 'error' | 'warning' | 'info'
  stackFrames?: StackFrame[]     // 解析后的堆栈
  fingerprint?: string           // 错误指纹
  breadcrumbs?: Breadcrumb[]     // 面包屑
  filename?: string              // 文件名
  lineno?: number                // 行号
  colno?: number                 // 列号
}
```

---

## 工具函数

### generateId()

生成唯一 ID。

**返回:**
- `string` - 唯一ID

### generateUUID()

生成 UUID。

**返回:**
- `string` - UUID

### getDeviceInfo()

获取设备信息。

**返回:**
- `DeviceInfo` - 设备信息对象

### formatBytes(bytes)

格式化字节数。

**参数:**
- `bytes: number` - 字节数

**返回:**
- `string` - 格式化后的字符串（如 "1.5 MB"）

### formatDuration(ms)

格式化时长。

**参数:**
- `ms: number` - 毫秒数

**返回:**
- `string` - 格式化后的字符串（如 "2.5s"）

---

## 事件列表

Monitor 发出的事件：

- `init` - 初始化完成
- `performance` - 性能数据收集
- `error` - 错误捕获
- `event` - 自定义事件
- `report` - 数据上报
- `user` - 用户信息更新
- `context` - 上下文更新
- `breadcrumb` - 面包屑添加
- `enable` - 监控启用
- `disable` - 监控禁用

**使用示例:**
```typescript
monitor.on('performance', (data) => {
  console.log('Performance metric:', data)
})

monitor.on('error', (data) => {
  console.log('Error captured:', data)
})
```

---

## 完整示例

查看 `examples/` 目录获取完整的可运行示例：

1. **examples/basic.ts** - 基础使用
2. **examples/vue-app.ts** - Vue 3 集成
3. **examples/react-app.tsx** - React 集成

---

**文档版本**: 1.0  
**最后更新**: 2024-01-23  
**维护者**: LDesign Team


