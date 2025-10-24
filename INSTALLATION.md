# 📦 @ldesign/monitor 安装指南

## 系统要求

### Node.js 版本

- Node.js >= 18.0.0
- pnpm >= 8.0.0（推荐）

### 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

对于旧浏览器，可能需要 polyfills。

---

## 安装方式

### 使用 pnpm（推荐）

```bash
pnpm add @ldesign/monitor
```

### 使用 npm

```bash
npm install @ldesign/monitor
```

### 使用 yarn

```bash
yarn add @ldesign/monitor
```

---

## 依赖说明

### 运行时依赖

@ldesign/monitor 依赖以下包，会自动安装：

```json
{
  "dependencies": {
    "@ldesign/logger": "workspace:*",
    "@ldesign/http": "workspace:*",
    "@ldesign/shared": "workspace:*",
    "web-vitals": "^3.5.0",
    "rrweb": "^2.0.0"
  }
}
```

### 可选依赖

```json
{
  "optionalDependencies": {
    "source-map": "^0.7.4"
  }
}
```

### Peer Dependencies

如果使用框架集成，需要安装对应的框架：

```json
{
  "peerDependencies": {
    "vue": "^3.0.0",    // Vue 集成需要
    "react": "^18.0.0"  // React 集成需要
  }
}
```

---

## CDN 引入（可选）

如果不使用包管理器，可以通过 CDN 引入：

```html
<!-- 开发版本 -->
<script src="https://unpkg.com/@ldesign/monitor/es/index.js"></script>

<!-- 生产版本（压缩） -->
<script src="https://unpkg.com/@ldesign/monitor/lib/index.cjs"></script>
```

使用 CDN 时，库会挂载到全局变量 `LDesignMonitor`:

```javascript
const monitor = LDesignMonitor.createMonitor({
  dsn: '...',
  projectId: '...',
})
```

---

## 验证安装

### 检查版本

```typescript
import { VERSION } from '@ldesign/monitor'

console.log('@ldesign/monitor version:', VERSION)
```

### 简单测试

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://test.com/api/monitor',
  projectId: 'test',
  debug: true,
})

console.log('Monitor initialized successfully!')
```

如果能看到初始化日志，说明安装成功！

---

## TypeScript 配置

### tsconfig.json

确保你的 TypeScript 配置包含：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ES2020", "DOM"]
  }
}
```

### 类型支持

@ldesign/monitor 包含完整的 TypeScript 类型定义，安装后即可获得智能提示。

---

## 构建工具配置

### Vite

无需特殊配置，开箱即用：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  // 默认配置即可
})
```

### Webpack

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      '@ldesign/monitor': '@ldesign/monitor/es',
    },
  },
}
```

### Rollup

```javascript
// rollup.config.js
export default {
  external: ['@ldesign/monitor'],
}
```

---

## 故障排查

### 问题 1: 找不到模块

**错误**:
```
Cannot find module '@ldesign/monitor'
```

**解决方案**:
1. 确认已安装: `pnpm list @ldesign/monitor`
2. 重新安装: `pnpm install --force`
3. 清除缓存: `rm -rf node_modules && pnpm install`

### 问题 2: 类型错误

**错误**:
```
Could not find a declaration file for module '@ldesign/monitor'
```

**解决方案**:
1. 确认 TypeScript 版本 >= 5.0
2. 检查 `tsconfig.json` 中的 `skipLibCheck`
3. 重新构建包: `pnpm build`

### 问题 3: Vue 集成问题

**错误**:
```
Cannot find module '@ldesign/monitor/vue'
```

**解决方案**:
1. 确认已安装 Vue: `pnpm add vue@^3.0.0`
2. 检查导入路径是否正确
3. 确认包已正确构建

### 问题 4: React 集成问题

**错误**:
```
Cannot find module '@ldesign/monitor/react'
```

**解决方案**:
1. 确认已安装 React: `pnpm add react@^18.0.0`
2. 检查导入路径是否正确
3. 确认包已正确构建

---

## 升级指南

### 从旧版本升级

```bash
# 升级到最新版本
pnpm update @ldesign/monitor

# 或指定版本
pnpm add @ldesign/monitor@0.1.0
```

### 检查破坏性变更

查看 [CHANGELOG.md](./CHANGELOG.md) 了解各版本的变更。

---

## 开发环境安装

如果你想参与 @ldesign/monitor 的开发：

```bash
# 克隆仓库
git clone https://github.com/ldesign/ldesign.git

# 进入 monitor 目录
cd ldesign/tools/monitor

# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试
pnpm test

# 监听模式（开发）
pnpm build:watch
```

---

## 下一步

安装完成后：

1. 📖 阅读 [快速开始](./QUICK_START.md)
2. 💡 查看 [基础示例](./examples/basic.ts)
3. 📚 浏览 [API 文档](./docs/API.md)
4. 🚀 开始监控你的应用！

---

## 需要帮助？

- 📖 查看 [完整文档](./docs/)
- 💬 查看 [FAQ](#故障排查)
- 🐛 [提交 Issue](../../issues)
- 💌 联系 LDesign Team

---

**祝你使用愉快！** 🎉



