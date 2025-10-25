# @ldesign/monitor 架构设计文档

## 目录

- [概述](#概述)
- [核心架构](#核心架构)
- [模块设计](#模块设计)
- [数据流](#数据流)
- [性能优化](#性能优化)
- [隐私保护](#隐私保护)
- [扩展性](#扩展性)

## 概述

@ldesign/monitor 是一个全栈前端监控系统，提供性能监控、错误追踪、用户行为分析等功能。系统设计遵循以下原则：

- **轻量级**：核心代码体积小，按需加载
- **高性能**：不影响业务性能
- **可扩展**：插件化设计，易于扩展
- **隐私优先**：自动脱敏敏感数据
- **类型安全**：100% TypeScript 覆盖

## 核心架构

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application Layer                        │
│  (Vue/React Components, Business Logic)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Monitor Core API                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Monitor (Main Class)                                    │   │
│  │  - init(), trackPerformance(), trackError(), etc.        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────┬────────┬──────────┬────────────┬─────────┬───────────────┘
      │        │          │            │         │
┌─────▼────┐  │  ┌───────▼──────┐  ┌──▼────┐  │
│Performance│  │  │   Error      │  │Behavior│  │
│Collectors │  │  │  Collectors  │  │Trackers│  │
└──────────┘  │  └──────────────┘  └────────┘  │
              │                                  │
        ┌─────▼─────┐                      ┌────▼────┐
        │  Reporter  │                      │ Storage │
        │  (Batch)   │                      │(Offline)│
        └─────┬──────┘                      └─────────┘
              │
        ┌─────▼─────┐
        │  Network  │
        │  (HTTP/   │
        │  Beacon)  │
        └───────────┘
```

### 核心组件

#### 1. Monitor 核心类

`Monitor` 是系统的入口类，提供统一的 API：

```typescript
class Monitor extends EventEmitter {
  - init(): 初始化监控
  - trackPerformance(): 追踪性能指标
  - trackError(): 追踪错误
  - trackEvent(): 追踪自定义事件
  - trackPageView(): 追踪页面浏览
  - setUser(): 设置用户信息
  - destroy(): 销毁监控器
}
```

#### 2. EventEmitter 事件系统

基于发布订阅模式，实现松耦合的模块通信：

```typescript
class EventEmitter {
  - on(): 订阅事件
  - off(): 取消订阅
  - emit(): 发射事件
  - once(): 订阅一次
  - destroy(): 销毁所有监听器
}
```

## 模块设计

### 1. 收集器模块 (Collectors)

#### 性能收集器

- **WebVitalsCollector**: 收集 Web Vitals 指标 (FCP, LCP, FID, CLS, INP, TTFB)
- **NavigationTimingCollector**: 收集导航性能指标
- **ResourceTimingCollector**: 收集资源加载性能

#### 错误收集器

- **JSErrorCollector**: 捕获 JavaScript 运行时错误
- **PromiseErrorCollector**: 捕获未处理的 Promise 错误
- **ResourceErrorCollector**: 捕获资源加载错误
- **StackParser**: 解析错误堆栈
- **ErrorAggregator**: 智能去重和聚合

#### 行为追踪器

- **PageViewTracker**: 追踪页面浏览
- **ClickTracker**: 追踪点击事件
- **FormTracker**: 追踪表单交互

#### API 监控

- **APIInterceptor**: 拦截 XHR/Fetch 请求

### 2. 上报模块 (Reporter)

采用批量上报策略，减少网络请求：

```typescript
class Reporter {
  - BatchQueue: 批量队列（按大小或时间触发）
  - HttpReporter: HTTP 上报
  - BeaconReporter: Beacon API 上报（页面卸载时）
  - RetryManager: 失败重试机制
  - SamplingManager: 采样控制
}
```

### 3. 用户信息模块 (User)

- **UserManager**: 管理用户信息
- **SessionManager**: 管理用户会话
- **DeviceDetector**: 检测设备信息
- **ContextManager**: 管理上下文信息

### 4. 存储模块 (Storage)

- **OfflineStore**: 基于 IndexedDB 的离线存储
  - 网络离线时缓存数据
  - 网络恢复时自动上报
  - 自动清理过期数据

### 5. 隐私保护模块 (Privacy)

- **DataMasker**: 数据脱敏
  - 自动识别和脱敏敏感信息（邮箱、手机、身份证等）
  - 支持自定义脱敏规则
  - 处理对象、URL、Headers

### 6. 高级功能

- **FunnelAnalyzer**: 漏斗分析
- **ExperimentManager**: A/B 测试管理
- **AnomalyDetector**: AI 异常检测
- **AlertEngine**: 智能告警引擎
- **SessionRecorder**: 会话回放（rrweb）
- **ClickHeatmap**: 点击热力图

### 7. 配置管理 (Config)

- **ConfigValidator**: 配置验证
- **ConfigPresets**: 配置预设（development/production/test 等）

### 8. 错误处理 (Utils)

- **ErrorHandler**: 全局错误处理
- **CircuitBreaker**: 断路器（防止级联故障）
- **Retry**: 重试机制
- **Timeout**: 超时控制
- **Fallback**: 降级方案

## 数据流

### 正常流程

```
1. 事件发生 (Performance/Error/Behavior)
   ↓
2. Collector 收集数据
   ↓
3. Monitor 接收数据并触发 hooks
   ↓
4. DataMasker 脱敏敏感信息
   ↓
5. SamplingManager 采样控制
   ↓
6. BatchQueue 批量队列
   ↓
7. Reporter 上报
   ↓
8. Server 接收数据
```

### 离线流程

```
1. 事件发生
   ↓
2. Collector 收集数据
   ↓
3. 检测到网络离线
   ↓
4. OfflineStore 保存到 IndexedDB
   ↓
5. 网络恢复
   ↓
6. 自动从 IndexedDB 读取数据
   ↓
7. 批量上报
```

### 错误流程

```
1. 上报失败
   ↓
2. RetryManager 重试 (指数退避)
   ↓
3. 达到最大重试次数
   ↓
4. 保存到 OfflineStore
   ↓
5. 触发 onError 回调
```

## 性能优化

### 1. 代码分割

- 核心功能（Monitor, Collectors, Reporter）打包在主文件
- 高级功能（Funnel, ABTest, Replay）按需加载
- 框架集成（Vue, React）作为单独入口

### 2. 批量处理

- 数据批量上报，减少网络请求
- 可配置批量大小和时间间隔
- 页面卸载时立即上报

### 3. 节流和防抖

- 高频事件（scroll, resize）使用 `rafThrottle`
- 用户输入事件使用 `debounceWithMaxWait`
- 保证数据不丢失

### 4. 异步执行

- 使用 `requestIdleCallback` 在空闲时处理数据
- 不阻塞主线程
- 降级到 `setTimeout`

### 5. 采样控制

- 支持全局采样率
- 支持按类型采样（错误、性能、行为）
- 支持按用户采样

### 6. 内存管理

- 限制缓存大小（面包屑、错误队列）
- 及时清理事件监听器
- 提供 `destroy()` 方法

## 隐私保护

### 1. 数据脱敏

自动脱敏敏感信息：

- 邮箱：`user@example.com` → `***@***.***`
- 手机：`13800138000` → `138****8000`
- 身份证：`110101199001011234` → `110101********1234`
- 密码/Token：完全脱敏为 `********`

### 2. 用户控制

- 支持禁用特定功能（如会话回放）
- 支持自定义脱敏规则
- 支持 GDPR 合规

### 3. 安全传输

- 仅支持 HTTPS
- 支持数据加密（可选）

## 扩展性

### 1. 插件系统

通过 EventEmitter 实现插件系统：

```typescript
// 自定义插件
monitor.on('performance', (data) => {
  // 处理性能数据
})

monitor.on('error', (data) => {
  // 处理错误数据
})
```

### 2. Hooks 系统

提供生命周期 hooks：

```typescript
{
  hooks: {
    beforeSend: (data) => {
      // 修改或拦截数据
      return modifiedData
    },
    afterError: (error) => {
      // 错误后的自定义处理
    },
    afterPerformance: (metric) => {
      // 性能指标后的自定义处理
    }
  }
}
```

### 3. 框架集成

提供框架特定的集成：

- **Vue 3**: Plugin + Composables
- **React**: Context Provider + Hooks + Error Boundary

### 4. 自定义上报

支持自定义上报逻辑：

```typescript
monitor.on('report', (data) => {
  // 自定义上报
  customSend(data)
})
```

## 最佳实践

### 1. 初始化

```typescript
// 使用配置预设
import { createMonitor, applyPreset } from '@ldesign/monitor'

const monitor = createMonitor(
  applyPreset(
    {
      dsn: 'https://api.example.com/monitor',
      projectId: 'my-app',
    },
    'production' // 使用生产环境预设
  )
)

monitor.init()
```

### 2. 性能监控

```typescript
// Web Vitals 自动收集
// 无需手动调用

// 自定义性能指标
const start = performance.now()
// ... 执行操作
const duration = performance.now() - start
monitor.trackPerformance('operation-time', duration)
```

### 3. 错误追踪

```typescript
// 全局错误自动捕获
// 无需手动调用

// 手动追踪错误
try {
  riskyOperation()
} catch (error) {
  monitor.trackError(error, {
    context: 'user-action',
    userId: currentUser.id,
  })
}
```

### 4. 用户行为

```typescript
// 页面浏览（SPA 路由变化）
router.afterEach((to) => {
  monitor.trackPageView(to.path)
})

// 自定义事件
monitor.trackEvent('checkout-complete', {
  orderId: order.id,
  amount: order.total,
})
```

## 技术栈

- **TypeScript 5.7+**: 类型安全
- **Web Vitals 3.5+**: 性能指标
- **rrweb 2.0+**: 会话回放
- **IndexedDB**: 离线存储
- **Vitest**: 单元测试

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

对于不支持的浏览器，功能会自动降级。

## 性能影响

- **包体积**: < 50KB (gzipped)
- **初始化时间**: < 10ms
- **CPU 占用**: < 0.5%
- **内存占用**: < 5MB
- **网络开销**: 批量上报，平均每分钟 < 1 请求

## 总结

@ldesign/monitor 采用模块化、插件化的设计，既保证了功能的完整性，又保持了核心的轻量级。通过性能优化、隐私保护、离线支持等特性，为用户提供了生产级别的前端监控解决方案。

