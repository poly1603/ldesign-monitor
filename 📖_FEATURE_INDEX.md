# 📖 @ldesign/monitor 功能索引

快速查找所需功能的完整索引。

---

## 🎯 按功能分类

### 性能监控

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| Web Vitals | `WebVitalsCollector` | `performance/WebVitalsCollector.ts` | FCP/LCP/FID/INP/CLS/TTFB |
| 导航性能 | `NavigationTimingCollector` | `performance/NavigationTimingCollector.ts` | DNS/TCP/请求/响应时间 |
| 资源性能 | `ResourceTimingCollector` | `performance/ResourceTimingCollector.ts` | 图片/脚本/样式加载 |

### 错误追踪

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| JS 错误 | `JSErrorCollector` | `error/JSErrorCollector.ts` | window.onerror 捕获 |
| Promise 错误 | `PromiseErrorCollector` | `error/PromiseErrorCollector.ts` | unhandledrejection |
| 资源错误 | `ResourceErrorCollector` | `error/ResourceErrorCollector.ts` | 图片/脚本加载失败 |
| 堆栈解析 | `StackParser` | `error/StackParser.ts` | 解析错误堆栈 |
| 错误聚合 | `ErrorAggregator` | `error/ErrorAggregator.ts` | 去重和分组 |
| Source Map | `SourceMapResolver` | `error/SourceMapResolver.ts` | 源码映射 |
| Source Map 上传 | `SourceMapUploader` | `sourcemap/SourceMapUploader.ts` | 上传工具 |
| 堆栈还原 | `StackResolver` | `sourcemap/StackResolver.ts` | 还原源码位置 |

### 数据上报

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 上报管理 | `Reporter` | `reporter/Reporter.ts` | 统一上报接口 |
| 批量队列 | `BatchQueue` | `reporter/BatchQueue.ts` | 数据聚合 |
| HTTP 上报 | `HttpReporter` | `reporter/HttpReporter.ts` | Fetch API |
| Beacon 上报 | `BeaconReporter` | `reporter/BeaconReporter.ts` | 页面卸载时 |
| 重试管理 | `RetryManager` | `reporter/RetryManager.ts` | 指数退避 |
| 采样控制 | `SamplingManager` | `reporter/SamplingManager.ts` | 数据采样 |

### 用户信息

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 用户管理 | `UserManager` | `user/UserManager.ts` | 用户信息和属性 |
| 会话管理 | `SessionManager` | `user/SessionManager.ts` | 会话追踪 |
| 设备检测 | `DeviceDetector` | `user/DeviceDetector.ts` | 设备信息和指纹 |
| 上下文管理 | `ContextManager` | `user/ContextManager.ts` | 标签和自定义数据 |

### 用户行为

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 页面浏览 | `PageViewTracker` | `behavior/PageViewTracker.ts` | PV/UV/停留时间 |
| 点击追踪 | `ClickTracker` | `behavior/ClickTracker.ts` | 点击事件 |
| 表单追踪 | `FormTracker` | `behavior/FormTracker.ts` | 表单提交 |

### API 监控

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| API 拦截 | `APIInterceptor` | `api/APIInterceptor.ts` | XHR/Fetch 拦截 |

### 会话回放

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 会话录制 | `SessionRecorder` | `replay/SessionRecorder.ts` | rrweb 集成 |

### 热力图

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 点击热力图 | `ClickHeatmap` | `heatmap/ClickHeatmap.ts` | 点击位置记录 |

### 漏斗分析

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 漏斗分析 | `FunnelAnalyzer` | `funnel/FunnelAnalyzer.ts` | 转化率计算 |

### A/B 测试

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 实验管理 | `ExperimentManager` | `abtest/ExperimentManager.ts` | A/B 测试系统 |

### AI 功能

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 异常检测 | `AnomalyDetector` | `ai/AnomalyDetector.ts` | 统计异常检测 |

### 告警系统

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 告警引擎 | `AlertEngine` | `alert/AlertEngine.ts` | 规则引擎 |

### 框架集成

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| Vue 插件 | `createMonitorPlugin` | `vue/index.ts` | Vue 3 集成 |
| React 集成 | `MonitorProvider` | `react/index.tsx` | React 18+ 集成 |

### 可视化

| 功能 | 模块 | 文件 | 说明 |
|------|------|------|------|
| 仪表板 | `Dashboard` | `visualization/Dashboard.vue` | 性能仪表板 |

---

## 🔍 按使用场景查找

### 我想监控页面性能

→ 使用 `WebVitalsCollector` 或 `NavigationTimingCollector`  
→ 查看 [性能监控 API](./docs/API.md#性能监控-api)  
→ 示例: [examples/basic.ts](./examples/basic.ts)

### 我想捕获所有错误

→ 使用 `JSErrorCollector`、`PromiseErrorCollector`、`ResourceErrorCollector`  
→ 查看 [错误追踪 API](./docs/API.md#错误追踪-api)  
→ 示例: [examples/basic.ts](./examples/basic.ts)

### 我想追踪用户行为

→ 使用 `PageViewTracker`、`ClickTracker`、`FormTracker`  
→ 查看 [用户行为追踪 API](./docs/API.md#用户行为追踪-api)  
→ 示例: [examples/advanced.ts](./examples/advanced.ts)

### 我想监控 API 请求

→ 使用 `APIInterceptor`  
→ 查看 [API 监控 API](./docs/API.md#api-监控-api)  
→ 示例: [examples/advanced.ts](./examples/advanced.ts)

### 我想录制用户会话

→ 使用 `SessionRecorder`  
→ 查看 [会话回放 API](./docs/API.md#会话回放-api)  
→ 示例: [examples/advanced.ts](./examples/advanced.ts)

### 我想分析转化率

→ 使用 `FunnelAnalyzer`  
→ 查看 [漏斗分析 API](./docs/API.md#漏斗分析-api)  
→ 示例: [examples/advanced.ts](./examples/advanced.ts)

### 我想做 A/B 测试

→ 使用 `ExperimentManager`  
→ 查看 [A/B 测试 API](./docs/API.md#ab-测试-api)  
→ 示例: [examples/advanced.ts](./examples/advanced.ts)

### 我想设置告警

→ 使用 `AlertEngine`  
→ 查看 [告警系统 API](./docs/API.md#告警系统-api)  
→ 示例: [examples/advanced.ts](./examples/advanced.ts)

### 我想在 Vue 中使用

→ 使用 `createMonitorPlugin` 和 `useMonitor`  
→ 查看 [Vue 集成 API](./docs/API.md#vue-集成-api)  
→ 示例: [examples/vue-app.ts](./examples/vue-app.ts)

### 我想在 React 中使用

→ 使用 `MonitorProvider` 和 `useMonitor`  
→ 查看 [React 集成 API](./docs/API.md#react-集成-api)  
→ 示例: [examples/react-app.tsx](./examples/react-app.tsx)

---

## 📚 按文档类型查找

### API 参考

→ [docs/API.md](./docs/API.md) - 完整的 API 文档

### 使用教程

→ [docs/GUIDE.md](./docs/GUIDE.md) - 深入的使用指南

### 最佳实践

→ [docs/BEST_PRACTICES.md](./docs/BEST_PRACTICES.md) - 性能优化和最佳实践

### 快速开始

→ [QUICK_START.md](./QUICK_START.md) - 5分钟上手指南

### 项目规划

→ [PROJECT_PLAN.md](./PROJECT_PLAN.md) - 详细的项目计划

### 完成报告

→ [✅_PROJECT_COMPLETED.md](./✅_PROJECT_COMPLETED.md) - 项目完成报告

---

## 🔗 外部资源

### 依赖库文档

- [web-vitals](https://github.com/GoogleChrome/web-vitals) - Google Web Vitals 库
- [rrweb](https://github.com/rrweb-io/rrweb) - 会话回放库
- [source-map](https://github.com/mozilla/source-map) - Source Map 解析

### 参考项目

- [Sentry](https://github.com/getsentry/sentry) - 错误追踪
- [PostHog](https://github.com/PostHog/posthog) - 产品分析
- [Mixpanel](https://mixpanel.com) - 行为分析
- [Google Analytics](https://analytics.google.com) - 网站分析

---

## 🎯 功能对照表

| 需求 | 功能模块 | 文档位置 | 示例代码 |
|------|----------|----------|----------|
| 监控页面加载速度 | WebVitalsCollector | API.md#webvitalscollector | basic.ts |
| 捕获 JS 错误 | JSErrorCollector | API.md#jserrorcollector | basic.ts |
| 监控 API 请求 | APIInterceptor | API.md#apiinterceptor | advanced.ts |
| 追踪用户点击 | ClickTracker | API.md#clicktracker | advanced.ts |
| 录制用户会话 | SessionRecorder | API.md#sessionrecorder | advanced.ts |
| 分析转化漏斗 | FunnelAnalyzer | API.md#funnelanalyzer | advanced.ts |
| A/B 测试 | ExperimentManager | API.md#experimentmanager | advanced.ts |
| 性能告警 | AlertEngine | API.md#alertengine | advanced.ts |
| 异常检测 | AnomalyDetector | API.md#anomalydetector | advanced.ts |
| Vue 集成 | createMonitorPlugin | API.md#vue-集成-api | vue-app.ts |
| React 集成 | MonitorProvider | API.md#react-集成-api | react-app.tsx |

---

## 🛠️ 工具函数索引

| 函数名 | 功能 | 文件位置 |
|--------|------|----------|
| `generateId()` | 生成唯一ID | utils/index.ts |
| `generateUUID()` | 生成UUID | utils/index.ts |
| `now()` | 当前时间戳 | utils/index.ts |
| `getDeviceInfo()` | 获取设备信息 | utils/index.ts |
| `getPageInfo()` | 获取页面信息 | utils/index.ts |
| `safeStringify()` | 安全JSON序列化 | utils/index.ts |
| `deepClone()` | 深度克隆 | utils/index.ts |
| `throttle()` | 节流函数 | utils/index.ts |
| `debounce()` | 防抖函数 | utils/index.ts |
| `getElementSelector()` | 获取元素选择器 | utils/index.ts |
| `hashCode()` | 字符串哈希 | utils/index.ts |
| `formatBytes()` | 格式化字节 | utils/index.ts |
| `formatDuration()` | 格式化时长 | utils/index.ts |
| `isMobile()` | 是否移动设备 | utils/index.ts |
| `isProduction()` | 是否生产环境 | utils/index.ts |

---

## 📊 类型索引

### 核心类型 (`types/index.ts`)

- `MonitorConfig` - 监控配置
- `ReportData` - 上报数据
- `UserInfo` - 用户信息
- `SessionInfo` - 会话信息
- `DeviceInfo` - 设备信息
- `ContextInfo` - 上下文信息
- `PerformanceMetric` - 性能指标
- `ErrorInfo` - 错误信息
- `Breadcrumb` - 面包屑
- `TrackEvent` - 追踪事件
- `IMonitor` - 监控器接口

### 性能类型 (`types/performance.ts`)

- `WebVitalsMetric` - Web Vitals 指标
- `WebVitalsAttribution` - 归因信息
- `NavigationTiming` - 导航性能
- `ResourceTiming` - 资源性能
- `CustomMetric` - 自定义指标
- `PerformanceSnapshot` - 性能快照

### 错误类型 (`types/error.ts`)

- `ErrorType` - 错误类型枚举
- `ErrorLevel` - 错误级别枚举
- `MonitorErrorEvent` - 错误事件
- `StackFrame` - 堆栈帧
- `SourceInfo` - 源码信息
- `BreadcrumbType` - 面包屑类型
- `ErrorGroup` - 错误分组
- `ErrorStats` - 错误统计

### 上报类型 (`types/reporter.ts`)

- `ReportDataType` - 上报数据类型
- `ReportStatus` - 上报状态
- `ReportResult` - 上报结果
- `ReportStats` - 上报统计
- `BatchQueueConfig` - 批量队列配置
- `RetryConfig` - 重试配置
- `SamplingConfig` - 采样配置

---

## 🎨 组件索引

### Vue 组件

| 组件 | 功能 | 文件 |
|------|------|------|
| `Dashboard` | 性能仪表板 | visualization/Dashboard.vue |

### React 组件

| 组件 | 功能 | 文件 |
|------|------|------|
| `MonitorProvider` | 提供监控上下文 | react/index.tsx |
| `ErrorBoundary` | 错误边界 | react/index.tsx |

---

## 🔌 Composables/Hooks 索引

### Vue Composables

| Composable | 功能 | 文件 |
|-----------|------|------|
| `useMonitor()` | 获取监控实例 | vue/index.ts |
| `usePageTracking(page)` | 自动页面追踪 | vue/index.ts |
| `useEventTracking()` | 事件追踪函数 | vue/index.ts |
| `useErrorTracking()` | 错误追踪函数 | vue/index.ts |

### React Hooks

| Hook | 功能 | 文件 |
|------|------|------|
| `useMonitor()` | 获取监控实例 | react/index.tsx |
| `usePageTracking(page)` | 自动页面追踪 | react/index.tsx |
| `useEventTracking()` | 事件追踪函数 | react/index.tsx |

---

## 📂 文件结构索引

```
tools/monitor/
├── 📋 文档 (10个文件)
│   ├── README.md
│   ├── QUICK_START.md
│   ├── CHANGELOG.md
│   ├── PROJECT_PLAN.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── ✅_PROJECT_COMPLETED.md
│   ├── 🎊_FINAL_SUMMARY.md
│   ├── 📖_FEATURE_INDEX.md (本文件)
│   ├── docs/API.md
│   ├── docs/GUIDE.md
│   └── docs/BEST_PRACTICES.md
│
├── 💡 示例 (4个文件)
│   ├── examples/basic.ts
│   ├── examples/vue-app.ts
│   ├── examples/react-app.tsx
│   └── examples/advanced.ts
│
├── 🧪 测试 (7个文件)
│   ├── src/__tests__/Monitor.test.ts
│   ├── src/__tests__/utils.test.ts
│   ├── src/__tests__/ErrorAggregator.test.ts
│   ├── src/__tests__/FunnelAnalyzer.test.ts
│   ├── src/__tests__/ExperimentManager.test.ts
│   ├── src/__tests__/AlertEngine.test.ts
│   └── src/__tests__/AnomalyDetector.test.ts
│
├── 📦 源代码 (43个文件)
│   ├── src/core/ (2个)
│   ├── src/types/ (4个)
│   ├── src/utils/ (1个)
│   ├── src/performance/ (3个)
│   ├── src/error/ (8个)
│   ├── src/reporter/ (6个)
│   ├── src/user/ (4个)
│   ├── src/behavior/ (3个)
│   ├── src/api/ (1个)
│   ├── src/replay/ (1个)
│   ├── src/heatmap/ (1个)
│   ├── src/funnel/ (1个)
│   ├── src/abtest/ (1个)
│   ├── src/ai/ (1个)
│   ├── src/alert/ (1个)
│   ├── src/sourcemap/ (2个)
│   ├── src/visualization/ (1个)
│   ├── src/vue/ (1个)
│   ├── src/react/ (1个)
│   └── src/index.ts (主入口)
│
└── ⚙️ 配置 (4个文件)
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    └── builder.config.ts
```

**总计**: 68+ 个文件

---

## 🔗 快速链接

### 开始使用

- 🚀 [5分钟快速开始](./QUICK_START.md)
- 📖 [完整 README](./README.md)
- 💡 [基础示例](./examples/basic.ts)

### 深入学习

- 📘 [API 文档](./docs/API.md)
- 📗 [使用指南](./docs/GUIDE.md)
- 📕 [最佳实践](./docs/BEST_PRACTICES.md)

### 框架集成

- 🎨 [Vue 示例](./examples/vue-app.ts)
- ⚛️ [React 示例](./examples/react-app.tsx)

### 高级功能

- 🚀 [高级示例](./examples/advanced.ts)
- 📊 [项目计划](./PROJECT_PLAN.md)
- 🎊 [完成总结](./🎊_FINAL_SUMMARY.md)

---

## 🎯 功能清单（按重要性）

### ⭐⭐⭐⭐⭐ 核心必备

- Monitor 核心类
- Web Vitals 性能监控
- JavaScript 错误追踪
- 数据上报系统

### ⭐⭐⭐⭐ 高度推荐

- 用户行为追踪
- API 监控
- 错误聚合
- 会话管理

### ⭐⭐⭐ 推荐使用

- 会话回放
- 漏斗分析
- A/B 测试
- 告警系统

### ⭐⭐ 可选增强

- 热力图
- AI 异常检测
- Source Map 集成
- 可视化组件

---

**找不到想要的功能？**

1. 查看 [完整 API 文档](./docs/API.md)
2. 查看 [使用指南](./docs/GUIDE.md)
3. 查看 [示例代码](./examples/)
4. 提交 [Issue](../../issues)

---

**文档版本**: 1.0  
**最后更新**: 2024-01-23  
**维护团队**: LDesign Team


