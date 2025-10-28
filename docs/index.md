---
layout: home

hero:
  name: "@ldesign/monitor"
  text: "企业级前端监控 SDK"
  tagline: 性能监控 · 错误追踪 · 用户行为分析 · API 监控
  image:
    src: /logo.svg
    alt: LDesign Monitor
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/basic
    - theme: alt
      text: GitHub
      link: https://github.com/ldesign/monitor

features:
  - icon: 🚀
    title: 性能监控
    details: Web Vitals (FCP/LCP/FID/CLS/TTFB) 核心指标监控，自定义性能标记，Long Tasks 检测，内存监控，FPS 监控
    
  - icon: 🐛
    title: 错误追踪
    details: JavaScript 错误、Promise 错误、资源加载错误自动捕获，跨域错误处理，智能错误分组，框架错误集成
    
  - icon: 📊
    title: 用户行为
    details: 页面访问、点击、表单追踪，滚动深度分析，停留时间统计，用户路径分析
    
  - icon: 🌐
    title: API 监控
    details: XHR/Fetch 自动拦截，GraphQL 查询监控，WebSocket 连接监控，API 性能分级
    
  - icon: 🎬
    title: 会话回放
    details: rrweb 集成，完整录制用户操作，支持回放搜索和敏感信息过滤
    
  - icon: 🔥
    title: 热力图
    details: 点击热力图可视化，识别用户关注区域，优化页面布局
    
  - icon: 📈
    title: 漏斗分析
    details: 转化率和流失分析，多步骤漏斗追踪，优化用户旅程
    
  - icon: 🧪
    title: A/B 测试
    details: 实验管理和流量分配，结果统计分析，数据驱动决策
    
  - icon: 🤖
    title: AI 异常检测
    details: 智能识别性能异常，趋势分析和预测，自动优化建议
    
  - icon: 🔔
    title: 智能告警
    details: 规则引擎和多级告警，支持钉钉、企业微信、飞书通知
    
  - icon: 🎨
    title: 框架集成
    details: Vue 3 和 React 18+ 官方支持，提供组件和 Hooks
    
  - icon: 💾
    title: 离线缓存
    details: IndexedDB 本地存储，网络恢复自动上报，数据不丢失
---

## 快速开始

### 安装

```bash
npm install @ldesign/monitor
# or
yarn add @ldesign/monitor
# or
pnpm add @ldesign/monitor
```

### 基础使用

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  environment: 'production',
})

monitor.init()
```

### 增强功能（一键启用）

```typescript
import { createEnhancedMonitor } from '@ldesign/monitor'

const monitor = createEnhancedMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
  
  enhanced: {
    performance: {
      customMarks: true,      // 自定义性能标记
      longTasks: true,        // Long Tasks 检测
      memory: true,           // 内存监控
      fps: false,             // FPS 监控
      optimization: true,     // 优化建议
    },
    behavior: {
      scrollDepth: true,      // 滚动深度
      timeOnPage: true,       // 停留时间
    },
    api: {
      graphql: true,          // GraphQL 监控
      websocket: true,        // WebSocket 监控
    },
    offline: {
      enabled: true,          // 离线缓存
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

## 为什么选择 @ldesign/monitor？

### 🎯 开箱即用

无需复杂配置，一行代码即可启用所有核心功能。

### ⚡ 高性能

- 包体积小于 50KB (gzipped)
- 运行时开销 <1% CPU
- 批量上报，智能采样

### 🔒 隐私保护

- 支持数据脱敏
- GDPR 合规
- 敏感信息过滤

### 📊 完整数据链路

从数据收集、存储、分析到告警，提供完整的监控解决方案。

### 🎨 开发友好

- 100% TypeScript 覆盖
- 完整的文档和示例
- 活跃的社区支持

## 谁在使用？

<div class="users">
  <img src="/users/company1.svg" alt="Company 1" />
  <img src="/users/company2.svg" alt="Company 2" />
  <img src="/users/company3.svg" alt="Company 3" />
  <img src="/users/company4.svg" alt="Company 4" />
</div>

## 社区

- [GitHub](https://github.com/ldesign/monitor)
- [Discord](https://discord.gg/ldesign)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ldesign-monitor)

## 开源协议

[MIT License](https://github.com/ldesign/monitor/blob/main/LICENSE)

<style>
.users {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  margin: 2rem 0;
  filter: grayscale(100%);
  opacity: 0.6;
}

.users img {
  height: 40px;
}

.users:hover {
  filter: grayscale(0%);
  opacity: 1;
}
</style>
