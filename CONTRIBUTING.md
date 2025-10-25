# 🤝 贡献指南

感谢你对 @ldesign/monitor 的关注！我们欢迎所有形式的贡献。

---

## 🌟 贡献方式

### 1. 报告 Bug

发现问题？请：

1. 搜索[现有 Issues](../../issues)，避免重复
2. 使用 Bug 模板创建新 Issue
3. 提供以下信息：
   - 问题描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（浏览器、版本等）
   - 代码示例

### 2. 提出功能请求

有新想法？请：

1. 搜索现有的 Feature Requests
2. 使用 Feature Request 模板
3. 描述：
   - 使用场景
   - 期望功能
   - 可能的实现方案
   - 预期收益

### 3. 提交代码

想贡献代码？太好了！

#### 准备工作

```bash
# Fork 仓库
# Clone 你的 fork
git clone https://github.com/YOUR_USERNAME/ldesign.git

# 添加上游仓库
git remote add upstream https://github.com/ldesign/ldesign.git

# 安装依赖
cd ldesign/tools/monitor
pnpm install
```

#### 开发流程

```bash
# 创建功能分支
git checkout -b feat/your-feature

# 开发...
# 编写代码
# 添加测试
# 更新文档

# 运行测试
pnpm test

# 运行 lint
pnpm lint:fix

# 提交代码
git add .
git commit -m "feat: your feature description"

# 推送到你的 fork
git push origin feat/your-feature

# 创建 Pull Request
```

---

## 📝 代码规范

### TypeScript 规范

```typescript
// ✅ 推荐：显式类型
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ❌ 避免：any 类型
function process(data: any) {}

// ✅ 推荐：使用 unknown
function process(data: unknown) {
  if (typeof data === 'object') {
    // ...
  }
}
```

### 命名规范

```typescript
// 类名：PascalCase
class MonitorEngine {}

// 函数名：camelCase
function trackEvent() {}

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3

// 接口：PascalCase，加 I 前缀（可选）
interface IMonitor {}
interface MonitorConfig {}

// 类型别名：PascalCase
type EventHandler = (data: unknown) => void
```

### 注释规范

```typescript
/**
 * 追踪性能指标
 * 
 * @param metric - 指标名称
 * @param value - 指标值
 * @returns void
 * 
 * @example
 * ```typescript
 * monitor.trackPerformance('page-load', 1234)
 * ```
 */
function trackPerformance(metric: string, value: number): void {
  // 实现...
}
```

---

## 🧪 测试规范

### 测试文件结构

```
src/
├── MyModule.ts
└── __tests__/
    └── MyModule.test.ts
```

### 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { MyModule } from '../MyModule'

describe('MyModule', () => {
  let module: MyModule

  beforeEach(() => {
    module = new MyModule()
  })

  describe('功能1', () => {
    it('应该正确处理正常情况', () => {
      const result = module.process('test')
      expect(result).toBe('expected')
    })

    it('应该处理边界情况', () => {
      const result = module.process('')
      expect(result).toBe('')
    })

    it('应该抛出错误（异常情况）', () => {
      expect(() => module.process(null)).toThrow()
    })
  })
})
```

### 测试覆盖要求

- 新功能：覆盖率 >= 80%
- Bug 修复：必须添加测试用例
- 核心模块：覆盖率 >= 90%

---

## 📚 文档规范

### 代码注释

所有导出的函数、类、接口都必须有 JSDoc 注释：

```typescript
/**
 * 简短描述（一句话）
 * 
 * 详细描述（可选，多行）
 * 
 * @param param1 - 参数说明
 * @param param2 - 参数说明
 * @returns 返回值说明
 * 
 * @example
 * ```typescript
 * // 使用示例
 * const result = myFunction('test', 123)
 * ```
 */
```

### README 更新

如果添加了新功能，请更新：

1. README.md - 添加到特性列表
2. docs/API.md - 添加 API 文档
3. CHANGELOG.md - 记录变更
4. examples/ - 添加使用示例（如果需要）

---

## 🔄 提交规范

### Commit Message 格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 其他杂项

### Scope 范围

- `core`: 核心模块
- `performance`: 性能监控
- `error`: 错误追踪
- `reporter`: 数据上报
- `behavior`: 行为追踪
- `api`: API 监控
- `replay`: 会话回放
- `funnel`: 漏斗分析
- `abtest`: A/B 测试
- `ai`: AI 功能
- `alert`: 告警系统
- `vue`: Vue 集成
- `react`: React 集成
- `docs`: 文档
- `test`: 测试

### 示例

```bash
# 新功能
git commit -m "feat(performance): 添加 FCP 性能监控"

# Bug 修复
git commit -m "fix(error): 修复堆栈解析在 Safari 的问题"

# 文档更新
git commit -m "docs(guide): 完善 API 监控使用指南"

# 性能优化
git commit -m "perf(reporter): 优化批量上报性能"

# 测试
git commit -m "test(funnel): 添加漏斗分析测试"
```

---

## 🔍 代码审查

### Pull Request 检查清单

在提交 PR 之前，请确保：

- [ ] 代码通过 lint 检查 (`pnpm lint`)
- [ ] 所有测试通过 (`pnpm test`)
- [ ] 新代码有对应的测试
- [ ] 测试覆盖率不降低
- [ ] 更新了相关文档
- [ ] Commit message 符合规范
- [ ] 代码有适当的注释
- [ ] TypeScript 类型完整
- [ ] 没有 console.log（除非是有意为之）
- [ ] 没有调试代码

### PR 描述模板

```markdown
## 变更类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性变更
- [ ] 文档更新
- [ ] 性能优化

## 变更内容

描述你的变更...

## 相关 Issue

Closes #123

## 测试

如何测试这个变更...

## 截图（如果适用）

添加截图...
```

---

## 🎯 开发指南

### 添加新功能

1. **创建功能分支**
   ```bash
   git checkout -b feat/new-feature
   ```

2. **创建模块文件**
   ```bash
   src/feature/NewFeature.ts
   ```

3. **编写代码**
   - 遵循 TypeScript 规范
   - 添加完整的类型定义
   - 添加 JSDoc 注释
   - 实现错误处理

4. **编写测试**
   ```bash
   src/__tests__/NewFeature.test.ts
   ```

5. **更新文档**
   - 更新 README.md
   - 更新 docs/API.md
   - 添加示例（如果需要）

6. **更新导出**
   ```typescript
   // src/index.ts
   export { NewFeature } from './feature/NewFeature'
   ```

7. **运行测试**
   ```bash
   pnpm test
   pnpm lint:fix
   ```

8. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feat/new-feature
   ```

9. **创建 Pull Request**

### 修复 Bug

1. **创建 Issue** （如果还没有）
2. **创建修复分支**
   ```bash
   git checkout -b fix/bug-description
   ```
3. **修复代码**
4. **添加测试** （避免回归）
5. **提交和创建 PR**

---

## 📦 发布流程（维护者）

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/):

- **主版本（MAJOR）**: 不兼容的 API 变更
- **次版本（MINOR）**: 向后兼容的新功能
- **补丁版本（PATCH）**: 向后兼容的 Bug 修复

### 发布步骤

```bash
# 1. 更新版本号
pnpm version patch  # 或 minor, major

# 2. 更新 CHANGELOG
# 编辑 CHANGELOG.md

# 3. 构建
pnpm build

# 4. 测试
pnpm test

# 5. 提交
git add .
git commit -m "chore: release v0.1.1"

# 6. 打标签
git tag v0.1.1

# 7. 推送
git push origin main --tags

# 8. 发布到 npm
pnpm publish
```

---

## 🎨 代码风格

项目使用 @antfu/eslint-config，自动格式化代码。

### 格式化

```bash
# 自动修复
pnpm lint:fix

# 只检查
pnpm lint
```

### 主要规则

- 使用 2 空格缩进
- 使用单引号
- 语句不加分号
- 对象和数组使用尾随逗号
- 使用 const/let 而不是 var
- 使用箭头函数

---

## 💡 开发建议

### 性能优化

- 避免不必要的计算
- 使用批量处理
- 实现懒加载
- 使用缓存

### 可维护性

- 保持函数简短（<50行）
- 单一职责原则
- 避免深层嵌套（<4层）
- 使用有意义的命名

### 测试编写

- 测试覆盖所有分支
- 测试边界情况
- 测试错误处理
- 使用描述性的测试名称

---

## 🙏 致谢

感谢所有贡献者！

你的贡献让 @ldesign/monitor 变得更好。

---

## 📄 许可证

通过贡献代码，你同意你的贡献将遵循 [MIT License](./LICENSE)。

---

## 📞 联系方式

- 🐛 [Issue Tracker](../../issues)
- 💬 [Discussions](../../discussions)
- 📧 Email: team@ldesign.com

---

**感谢你的贡献！** ❤️


















