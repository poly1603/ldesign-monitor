# 📂 @ldesign/monitor 文件结构

## 🌲 完整目录树

```
tools/monitor/
├── 📄 核心文档 (12个)
│   ├── README.md                      # 项目介绍（完整）
│   ├── 🎯_START_HERE.md               # 导航首页 ⭐ 从这里开始
│   ├── QUICK_START.md                 # 快速开始（5分钟）
│   ├── INSTALLATION.md                # 安装指南
│   ├── CONTRIBUTING.md                # 贡献指南
│   ├── CHANGELOG.md                   # 版本记录
│   ├── PROJECT_PLAN.md                # 项目计划（详细）
│   ├── IMPLEMENTATION_STATUS.md       # 实施状态
│   ├── IMPLEMENTATION_SUMMARY.md      # 实施总结
│   ├── ✅_CHECKLIST.md                # 检查清单
│   ├── ✅_PROJECT_COMPLETED.md        # 完成报告
│   ├── 🎊_FINAL_SUMMARY.md            # 最终总结
│   ├── 🎉_PROJECT_DELIVERED.md        # 项目交付
│   ├── 📖_FEATURE_INDEX.md            # 功能索引
│   └── LICENSE                        # MIT 许可证
│
├── 📚 API 文档 (3个)
│   └── docs/
│       ├── API.md                     # 完整 API 参考
│       ├── GUIDE.md                   # 使用指南
│       └── BEST_PRACTICES.md          # 最佳实践
│
├── 💡 示例代码 (4个)
│   └── examples/
│       ├── basic.ts                   # 基础使用示例
│       ├── vue-app.ts                 # Vue 3 集成示例
│       ├── react-app.tsx              # React 18+ 集成示例
│       └── advanced.ts                # 高级功能示例
│
├── 📦 源代码 (43个 TS 文件)
│   └── src/
│       ├── 🎯 核心模块 (3个)
│       │   └── core/
│       │       ├── Monitor.ts         # 主监控类
│       │       ├── EventEmitter.ts    # 事件系统
│       │       └── index.ts
│       │
│       ├── 📝 类型定义 (4个)
│       │   └── types/
│       │       ├── index.ts           # 核心类型
│       │       ├── performance.ts     # 性能类型
│       │       ├── error.ts           # 错误类型
│       │       └── reporter.ts        # 上报类型
│       │
│       ├── 🛠️ 工具函数 (1个)
│       │   └── utils/
│       │       └── index.ts           # 20+ 工具函数
│       │
│       ├── ⚡ 性能监控 (4个)
│       │   └── collectors/performance/
│       │       ├── WebVitalsCollector.ts
│       │       ├── NavigationTimingCollector.ts
│       │       ├── ResourceTimingCollector.ts
│       │       └── index.ts
│       │
│       ├── 🐛 错误追踪 (8个)
│       │   └── collectors/error/
│       │       ├── JSErrorCollector.ts
│       │       ├── PromiseErrorCollector.ts
│       │       ├── ResourceErrorCollector.ts
│       │       ├── StackParser.ts
│       │       ├── ErrorAggregator.ts
│       │       ├── SourceMapResolver.ts
│       │       └── index.ts
│       │
│       ├── 📡 数据上报 (7个)
│       │   └── reporter/
│       │       ├── Reporter.ts
│       │       ├── BatchQueue.ts
│       │       ├── HttpReporter.ts
│       │       ├── BeaconReporter.ts
│       │       ├── RetryManager.ts
│       │       ├── SamplingManager.ts
│       │       └── index.ts
│       │
│       ├── 👤 用户信息 (4个)
│       │   └── user/
│       │       ├── UserManager.ts
│       │       ├── SessionManager.ts
│       │       ├── DeviceDetector.ts
│       │       └── ContextManager.ts
│       │
│       ├── 📊 行为追踪 (4个)
│       │   └── collectors/behavior/
│       │       ├── PageViewTracker.ts
│       │       ├── ClickTracker.ts
│       │       ├── FormTracker.ts
│       │       └── index.ts
│       │
│       ├── 🌐 API 监控 (2个)
│       │   └── collectors/api/
│       │       ├── APIInterceptor.ts
│       │       └── index.ts
│       │
│       ├── 🎬 会话回放 (1个)
│       │   └── replay/
│       │       └── SessionRecorder.ts
│       │
│       ├── 🔥 热力图 (1个)
│       │   └── heatmap/
│       │       └── ClickHeatmap.ts
│       │
│       ├── 📈 漏斗分析 (1个)
│       │   └── funnel/
│       │       └── FunnelAnalyzer.ts
│       │
│       ├── 🧪 A/B 测试 (1个)
│       │   └── abtest/
│       │       └── ExperimentManager.ts
│       │
│       ├── 🤖 AI 功能 (1个)
│       │   └── ai/
│       │       └── AnomalyDetector.ts
│       │
│       ├── 🔔 告警系统 (1个)
│       │   └── alert/
│       │       └── AlertEngine.ts
│       │
│       ├── 🗺️ Source Map (2个)
│       │   └── sourcemap/
│       │       ├── SourceMapUploader.ts
│       │       └── StackResolver.ts
│       │
│       ├── 🎨 可视化 (1个)
│       │   └── visualization/
│       │       └── Dashboard.vue
│       │
│       ├── 🔌 框架集成 (4个)
│       │   ├── vue/
│       │   │   └── index.ts           # Vue 3 插件
│       │   ├── react/
│       │   │   └── index.tsx          # React 集成
│       │   └── integrations/
│       │       ├── vue.ts
│       │       ├── react.tsx
│       │       └── index.ts
│       │
│       └── index.ts                   # 主入口文件
│
├── 🧪 测试文件 (7个)
│   └── src/__tests__/
│       ├── Monitor.test.ts            # 核心测试（11个用例）
│       ├── utils.test.ts              # 工具测试（10个用例）
│       ├── ErrorAggregator.test.ts    # 聚合测试（6个用例）
│       ├── FunnelAnalyzer.test.ts     # 漏斗测试（5个用例）
│       ├── ExperimentManager.test.ts  # A/B 测试（5个用例）
│       ├── AlertEngine.test.ts        # 告警测试（5个用例）
│       └── AnomalyDetector.test.ts    # AI 测试（4个用例）
│
├── ⚙️ 配置文件 (5个)
│   ├── package.json                   # 包配置
│   ├── tsconfig.json                  # TypeScript 配置
│   ├── vitest.config.ts               # 测试配置
│   ├── builder.config.ts              # 构建配置
│   └── .gitignore                     # Git 忽略
│
└── 📁 其他
    └── node_modules/                  # 依赖（自动生成）
```

---

## 📊 统计信息

### 文件类型分布

| 类型 | 数量 | 说明 |
|------|------|------|
| 📄 Markdown | 19个 | 文档和说明 |
| 📦 TypeScript | 43个 | 源代码 |
| 🧪 Test | 7个 | 测试文件 |
| 💡 Example | 4个 | 示例代码 |
| ⚙️ Config | 5个 | 配置文件 |
| 🎨 Vue | 1个 | Vue 组件 |
| **总计** | **79+** | **所有文件** |

### 目录层级

```
根目录
├── src/ (源代码目录)
│   ├── core/ (核心)
│   ├── types/ (类型)
│   ├── utils/ (工具)
│   ├── collectors/ (收集器)
│   │   ├── performance/
│   │   ├── error/
│   │   ├── behavior/
│   │   └── api/
│   ├── reporter/ (上报)
│   ├── user/ (用户)
│   ├── replay/ (回放)
│   ├── heatmap/ (热力图)
│   ├── funnel/ (漏斗)
│   ├── abtest/ (A/B测试)
│   ├── ai/ (AI)
│   ├── alert/ (告警)
│   ├── sourcemap/ (Source Map)
│   ├── visualization/ (可视化)
│   ├── integrations/ (集成)
│   ├── vue/ (Vue)
│   ├── react/ (React)
│   └── __tests__/ (测试)
├── docs/ (文档)
├── examples/ (示例)
└── (配置文件)
```

**最大层级深度**: 4 层  
**平均层级深度**: 2.5 层

---

## 🎯 模块分组

### 按功能分组

1. **核心架构** (8个文件)
   - core/ (3个)
   - types/ (4个)
   - utils/ (1个)

2. **数据收集** (19个文件)
   - collectors/performance/ (4个)
   - collectors/error/ (7个)
   - collectors/behavior/ (4个)
   - collectors/api/ (2个)
   - collectors/index.ts (1个)
   - 主 index.ts (1个)

3. **数据处理** (13个文件)
   - reporter/ (7个)
   - user/ (4个)
   - sourcemap/ (2个)

4. **高级功能** (5个文件)
   - replay/ (1个)
   - heatmap/ (1个)
   - funnel/ (1个)
   - abtest/ (1个)
   - ai/ (1个)
   - alert/ (1个)

5. **集成和可视化** (5个文件)
   - vue/ (1个)
   - react/ (1个)
   - integrations/ (2个)
   - visualization/ (1个)

---

## 📖 文件导航

### 核心文件（必读）

- 🎯 **START_HERE.md** - 从这里开始
- 🚀 **QUICK_START.md** - 5分钟上手
- 📘 **docs/API.md** - API 参考
- 💡 **examples/basic.ts** - 基础示例

### 进阶文件

- 📗 **docs/GUIDE.md** - 使用指南
- 📕 **docs/BEST_PRACTICES.md** - 最佳实践
- 🚀 **examples/advanced.ts** - 高级示例

### 参考文件

- 📖 **FEATURE_INDEX.md** - 功能索引
- 📊 **PROJECT_PLAN.md** - 项目计划
- 🎊 **FINAL_SUMMARY.md** - 最终总结

---

## 🔍 快速查找

### 查找功能实现

**性能监控** → `src/collectors/performance/`  
**错误追踪** → `src/collectors/error/`  
**行为追踪** → `src/collectors/behavior/`  
**API 监控** → `src/collectors/api/`  
**数据上报** → `src/reporter/`  
**用户管理** → `src/user/`  
**会话回放** → `src/replay/`  
**热力图** → `src/heatmap/`  
**漏斗分析** → `src/funnel/`  
**A/B 测试** → `src/abtest/`  
**AI 功能** → `src/ai/`  
**告警系统** → `src/alert/`  
**Vue 集成** → `src/vue/` 和 `src/integrations/vue.ts`  
**React 集成** → `src/react/` 和 `src/integrations/react.tsx`

### 查找类型定义

**所有类型** → `src/types/index.ts`  
**性能类型** → `src/types/performance.ts`  
**错误类型** → `src/types/error.ts`  
**上报类型** → `src/types/reporter.ts`

### 查找工具函数

**所有工具** → `src/utils/index.ts`

---

## 📏 代码规模

### 按目录统计

| 目录 | 文件数 | 估计行数 | 说明 |
|------|--------|----------|------|
| src/core/ | 3 | ~800 | 核心类 |
| src/types/ | 4 | ~1,500 | 类型定义 |
| src/utils/ | 1 | ~400 | 工具函数 |
| src/collectors/ | 19 | ~3,500 | 数据收集器 |
| src/reporter/ | 7 | ~1,200 | 数据上报 |
| src/user/ | 4 | ~700 | 用户管理 |
| src/replay/ | 1 | ~250 | 会话回放 |
| src/heatmap/ | 1 | ~150 | 热力图 |
| src/funnel/ | 1 | ~250 | 漏斗分析 |
| src/abtest/ | 1 | ~250 | A/B 测试 |
| src/ai/ | 1 | ~150 | AI 功能 |
| src/alert/ | 1 | ~250 | 告警系统 |
| src/sourcemap/ | 2 | ~200 | Source Map |
| src/visualization/ | 1 | ~150 | 可视化 |
| src/integrations/ | 4 | ~500 | 框架集成 |
| src/__tests__/ | 7 | ~1,000 | 测试 |
| docs/ | 3 | ~2,000 | API 文档 |
| examples/ | 4 | ~500 | 示例 |
| 其他文档 | 16 | ~3,000 | 项目文档 |
| **总计** | **79+** | **~16,000** | **全部** |

---

## 🎨 导出结构

### 主入口 (src/index.ts)

```typescript
// 核心
export { Monitor, EventEmitter }

// 性能监控（3个收集器）
export { WebVitalsCollector, NavigationTimingCollector, ResourceTimingCollector }

// 错误追踪（6个收集器）
export { JSErrorCollector, PromiseErrorCollector, ResourceErrorCollector }
export { StackParser, ErrorAggregator, SourceMapResolver }

// 数据上报（6个模块）
export { Reporter, BatchQueue, HttpReporter, BeaconReporter }
export { RetryManager, SamplingManager }

// 用户信息（4个模块）
export { UserManager, SessionManager, DeviceDetector, ContextManager }

// 行为追踪（3个追踪器）
export { PageViewTracker, ClickTracker, FormTracker }

// API 监控
export { APIInterceptor }

// 会话回放
export { SessionRecorder }

// 热力图
export { ClickHeatmap }

// 漏斗分析
export { FunnelAnalyzer }

// A/B 测试
export { ExperimentManager }

// AI 功能
export { AnomalyDetector }

// 告警系统
export { AlertEngine }

// Source Map
export { SourceMapUploader, StackResolver }

// 可视化
export { Dashboard }

// Vue 集成
export * from './vue'

// React 集成
export * from './react'

// 工具函数（20+）
export { generateId, generateUUID, now, ... }

// 所有类型
export type * from './types'
```

### 子入口

- `@ldesign/monitor/vue` - Vue 集成
- `@ldesign/monitor/react` - React 集成

---

## 🎯 文件命名规范

### 源代码文件

- **类文件**: PascalCase (例: `Monitor.ts`, `EventEmitter.ts`)
- **工具文件**: camelCase (例: `utils/index.ts`)
- **测试文件**: `*.test.ts` (例: `Monitor.test.ts`)
- **类型文件**: lowercase (例: `types/index.ts`)

### 文档文件

- **核心文档**: UPPERCASE.md (例: `README.md`)
- **导航文档**: 带emoji前缀 (例: `🎯_START_HERE.md`)
- **子文档**: lowercase.md (例: `docs/api.md`)

---

## 📦 构建输出

### 构建后的目录结构

```
tools/monitor/
├── es/                   # ESM 格式
│   ├── index.js
│   ├── index.d.ts
│   ├── core/
│   ├── types/
│   └── ...
├── lib/                  # CommonJS 格式
│   ├── index.cjs
│   ├── core/
│   └── ...
└── node_modules/         # 依赖
```

---

## 🔗 相关链接

### 内部链接

- [项目计划](./PROJECT_PLAN.md)
- [实施状态](./IMPLEMENTATION_STATUS.md)
- [功能索引](./📖_FEATURE_INDEX.md)
- [开始使用](./🎯_START_HERE.md)

### 外部资源

- [web-vitals](https://github.com/GoogleChrome/web-vitals)
- [rrweb](https://github.com/rrweb-io/rrweb)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/)

---

**文档版本**: 1.0  
**最后更新**: 2024-01-23  
**总文件数**: 79+

















