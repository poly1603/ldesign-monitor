# @ldesign/monitor 文档

本文档使用 [VitePress](https://vitepress.dev/) 构建。

## 快速开始

### 安装依赖

```bash
pnpm install vitepress -D
```

### 本地开发

```bash
pnpm docs:dev
```

文档将在 `http://localhost:5173` 启动。

### 构建文档

```bash
pnpm docs:build
```

构建后的文件将输出到 `docs/.vitepress/dist/`。

### 预览构建

```bash
pnpm docs:preview
```

## 文档结构

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress 配置
├── guide/                 # 指南
│   ├── introduction.md
│   ├── getting-started.md
│   ├── installation.md
│   ├── configuration.md
│   ├── performance.md
│   ├── error-tracking.md
│   ├── user-behavior.md
│   ├── api-monitoring.md
│   ├── session-replay.md
│   ├── heatmap.md
│   ├── funnel.md
│   ├── ab-testing.md
│   ├── vue.md
│   ├── react.md
│   ├── performance-tips.md
│   ├── privacy.md
│   └── production.md
├── enhanced/              # 增强功能
│   ├── overview.md
│   ├── getting-started.md
│   ├── performance-marks.md
│   ├── long-tasks.md
│   ├── memory-monitor.md
│   ├── fps-monitor.md
│   ├── optimization.md
│   ├── scroll-depth.md
│   ├── time-on-page.md
│   ├── graphql.md
│   ├── websocket.md
│   ├── offline-storage.md
│   ├── cross-origin-error.md
│   ├── framework-error.md
│   └── error-analytics.md
├── api/                   # API 参考
│   ├── core.md
│   ├── performance.md
│   ├── error.md
│   ├── behavior.md
│   ├── api-monitoring.md
│   ├── enhanced-monitor.md
│   ├── performance-enhancer.md
│   ├── behavior-enhancer.md
│   ├── error-analytics.md
│   └── types/
│       ├── config.md
│       ├── events.md
│       └── enhanced.md
├── examples/              # 示例
│   ├── basic.md
│   ├── vue.md
│   ├── react.md
│   ├── enhanced.md
│   ├── e-commerce.md
│   ├── spa-router.md
│   └── dashboard.md
└── index.md               # 首页
```

## 编写指南

### Markdown 扩展

VitePress 支持多种 Markdown 扩展：

#### 代码块分组

```markdown
::: code-group

\`\`\`bash [npm]
npm install @ldesign/monitor
\`\`\`

\`\`\`bash [pnpm]
pnpm add @ldesign/monitor
\`\`\`

:::
```

#### 自定义容器

```markdown
::: tip 提示
这是一个提示
:::

::: warning 警告
这是一个警告
:::

::: danger 危险
这是一个危险警告
:::
```

#### 代码块高亮

````markdown
```typescript{2,4-6}
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
})
```
````

### 内部链接

使用相对路径：

```markdown
[快速开始](/guide/getting-started)
[API 参考](/api/core)
```

### 图片

将图片放在 `docs/public/` 目录下：

```markdown
![性能监控](/images/performance.png)
```

## 贡献

欢迎贡献文档改进！请遵循以下规范：

1. 使用清晰简洁的语言
2. 提供完整的代码示例
3. 添加适当的截图和图表
4. 保持文档结构一致

## License

MIT
