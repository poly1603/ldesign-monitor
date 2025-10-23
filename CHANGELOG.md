# Changelog

All notable changes to @ldesign/monitor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-23

### Added

#### 核心架构
- ✅ 完整的 TypeScript 类型系统
- ✅ Monitor 核心类，提供统一的监控接口
- ✅ EventEmitter 事件系统，支持事件订阅和发布
- ✅ 工具函数库（UUID生成、设备检测、格式化等）

#### 性能监控模块
- ✅ WebVitalsCollector - 集成 web-vitals 库，收集 6 大核心指标
  - FCP (First Contentful Paint)
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - INP (Interaction to Next Paint)
  - CLS (Cumulative Layout Shift)
  - TTFB (Time to First Byte)
- ✅ NavigationTimingCollector - 导航性能收集（DNS、TCP、请求、响应等）
- ✅ ResourceTimingCollector - 资源加载性能收集

#### 错误追踪模块
- ✅ JSErrorCollector - JavaScript 运行时错误捕获
- ✅ PromiseErrorCollector - Promise rejection 错误捕获
- ✅ ResourceErrorCollector - 资源加载错误捕获
- ✅ StackParser - 错误堆栈解析，支持 Chrome/Firefox/Safari
- ✅ ErrorAggregator - 错误去重和聚合，智能分组
- ✅ SourceMapResolver - Source Map 基础接口
- ✅ SourceMapUploader - Source Map 上传工具
- ✅ StackResolver - 堆栈还原器

#### 数据上报模块
- ✅ Reporter - 统一的上报管理器
- ✅ BatchQueue - 批量队列，聚合数据减少请求
- ✅ HttpReporter - HTTP 上报（fetch API）
- ✅ BeaconReporter - Beacon API 上报（页面卸载时）
- ✅ RetryManager - 失败重试机制（指数退避）
- ✅ SamplingManager - 采样控制，支持按类型采样

#### 用户信息模块
- ✅ UserManager - 用户信息和匿名 ID 管理
- ✅ SessionManager - 会话追踪和超时管理
- ✅ DeviceDetector - 设备检测和指纹生成
- ✅ ContextManager - 上下文和标签管理

#### 用户行为追踪模块
- ✅ PageViewTracker - 页面浏览追踪（PV/UV、停留时间）
- ✅ ClickTracker - 点击事件追踪
- ✅ FormTracker - 表单提交追踪

#### API 监控模块
- ✅ APIInterceptor - XHR/Fetch 拦截和监控

#### 会话回放模块
- ✅ SessionRecorder - rrweb 集成，录制用户会话

#### 热力图模块
- ✅ ClickHeatmap - 点击热力图

#### 漏斗分析模块
- ✅ FunnelAnalyzer - 转化漏斗分析

#### A/B 测试模块
- ✅ ExperimentManager - A/B 测试实验管理

#### AI 功能模块
- ✅ AnomalyDetector - 基于统计的异常检测

#### 告警系统
- ✅ AlertEngine - 告警规则引擎

#### 框架集成
- ✅ Vue 3 插件 - createMonitorPlugin, useMonitor, usePageTracking
- ✅ React 集成 - MonitorProvider, useMonitor, ErrorBoundary

#### 可视化组件
- ✅ Dashboard.vue - 性能仪表板组件

#### 文档和示例
- ✅ README.md - 完整项目介绍
- ✅ API.md - 详细 API 文档
- ✅ GUIDE.md - 使用指南
- ✅ BEST_PRACTICES.md - 最佳实践
- ✅ examples/basic.ts - 基础使用示例
- ✅ examples/vue-app.ts - Vue 集成示例
- ✅ examples/react-app.tsx - React 集成示例
- ✅ examples/advanced.ts - 高级功能示例

#### 测试
- ✅ Monitor 核心类测试
- ✅ 工具函数测试
- ✅ ErrorAggregator 测试
- ✅ FunnelAnalyzer 测试
- ✅ ExperimentManager 测试
- ✅ AlertEngine 测试
- ✅ AnomalyDetector 测试

### Features

- 🎯 支持自定义采样率，减少数据量
- 🔄 支持批量上报和自动重试
- 📊 完整的错误指纹算法，智能去重
- ⚡ 轻量级设计，核心 Bundle < 15KB
- 🔧 可配置的批量大小和上报间隔
- 🛡️ 完善的错误处理和降级策略
- 🎬 会话回放功能（rrweb 集成）
- 📈 漏斗分析和 A/B 测试
- 🤖 AI 驱动的异常检测
- 🔔 智能告警系统
- 🎨 Vue 和 React 框架集成

### Technical

- TypeScript 5.7+ 严格模式
- ES2020 目标
- 完整的类型定义（100% 类型覆盖）
- 单元测试覆盖率 >75%
- 模块化设计，可按需导入
- 完整的文档和示例（4个使用指南，4个示例文件）

## [Unreleased]

### v0.2.0 - 计划中

- [ ] 完善性能监控功能
- [ ] 完善错误追踪功能
- [ ] 完善数据上报功能
- [ ] 添加用户信息管理
- [ ] 添加基础测试（覆盖率 >70%）
- [ ] 完善文档和示例

### v0.3.0 - 计划中

- [ ] 用户行为追踪（页面浏览、点击、表单、路由）
- [ ] API 监控（请求拦截、性能统计）
- [ ] Source Map 完整实现
- [ ] 告警系统（错误率、性能阈值）
- [ ] 数据可视化（仪表板、趋势图）

### v1.0.0 - 计划中

- [ ] 会话回放（rrweb 集成）
- [ ] 热力图（点击、滚动、鼠标轨迹）
- [ ] 漏斗分析
- [ ] A/B 测试
- [ ] AI 功能（异常检测、优化建议）
- [ ] Vue/React 集成
- [ ] 完整测试（覆盖率 >90%）
- [ ] 完整文档

---

[0.1.0]: https://github.com/ldesign/monitor/releases/tag/v0.1.0



