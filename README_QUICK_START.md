# 🚀 @ldesign/monitor 快速开始

> 5分钟内开始使用前端监控系统

## 📦 安装

```bash
pnpm add @ldesign/monitor
```

## ⚡ 快速使用

### 1. 创建监控实例（仅需 3 行代码）

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
})

monitor.init()
```

**就这么简单！** 监控已经开始工作了：
- ✅ Web Vitals 性能指标自动收集
- ✅ JavaScript 错误自动捕获
- ✅ API 请求自动监控
- ✅ 用户行为自动追踪

---

## 🎯 Vue 3 项目（1行代码）

```typescript
// main.ts
import { createMonitorPlugin } from '@ldesign/monitor'

app.use(createMonitorPlugin({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-vue-app',
}))
```

**完成！** Vue Router 路由变化自动追踪，Vue 错误自动捕获！

---

## ⚛️ React 项目（1个组件）

```tsx
// App.tsx
import { MonitorProvider } from '@ldesign/monitor'

function App() {
  return (
    <MonitorProvider config={{
      dsn: 'https://your-endpoint.com/api/monitor',
      projectId: 'my-react-app',
    }}>
      <YourApp />
    </MonitorProvider>
  )
}
```

**完成！** React 错误自动捕获！

---

## 📊 自动监控的内容

### 性能指标 ✅
- FCP - 首次内容绘制
- LCP - 最大内容绘制
- FID - 首次输入延迟
- CLS - 累积布局偏移
- TTFB - 首字节时间
- INP - 交互到下次绘制

### 错误追踪 ✅
- JavaScript 运行时错误
- Promise rejection
- 资源加载失败

### API 监控 ✅
- 所有 Fetch 请求
- 所有 XMLHttpRequest 请求
- 请求时长和状态码

---

## 🎨 手动追踪（可选）

### 追踪自定义事件

```typescript
// 用户点击
monitor.trackEvent('button-click', {
  buttonId: 'submit',
  page: '/checkout',
})

// 购买完成
monitor.trackEvent('purchase', {
  amount: 99.99,
  product: 'Premium Plan',
})
```

### 追踪自定义性能指标

```typescript
monitor.trackPerformance('checkout-duration', 3500)
```

### 手动报告错误

```typescript
try {
  // 你的代码
} catch (error) {
  monitor.trackError(error, {
    context: 'payment-processing',
  })
}
```

### 设置用户信息

```typescript
monitor.setUser({
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
})
```

---

## ⚙️ 常用配置

### 开发环境

```typescript
const monitor = createMonitor({
  dsn: 'http://localhost:3000/api/monitor',
  projectId: 'my-app-dev',
  environment: 'development',
  sampleRate: 1.0,    // 100% 采样
  debug: true,        // 启用调试日志
})
```

### 生产环境

```typescript
const monitor = createMonitor({
  dsn: 'https://monitor.myapp.com/api/monitor',
  projectId: 'my-app',
  environment: 'production',
  sampleRate: 0.1,    // 10% 采样（节省流量）
})
```

### 仅监控错误

```typescript
const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-app',
  enablePerformance: false,  // 关闭性能监控
  enableError: true,         // 仅错误追踪
  enableBehavior: false,     // 关闭行为追踪
  enableAPI: false,          // 关闭 API 监控
})
```

---

## 🔒 隐私保护

### 数据脱敏

```typescript
const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-app',
  hooks: {
    beforeSend: (data) => {
      // 移除 URL 中的敏感参数
      if (data.context?.url) {
        data.context.url = data.context.url.replace(
          /token=[^&]+/g, 
          'token=[REDACTED]'
        )
      }
      return data
    },
  },
})
```

### 禁用用户追踪

```typescript
const monitor = createMonitor({
  enableBehavior: false,  // 不追踪用户行为
  enableReplay: false,    // 不录制会话
})
```

---

## 📚 更多资源

- 📖 [完整文档](./README.md)
- 🔍 [API 参考](./docs/API.md)
- 📘 [使用指南](./docs/GUIDE.md)
- 📋 [项目计划](./PROJECT_PLAN.md)
- 💡 [示例代码](./examples/)

---

## ❓ 常见问题

**Q: 需要搭建服务端吗？**  
A: 是的，需要一个接收数据的端点（POST 接口）。

**Q: 支持哪些浏览器？**  
A: Chrome, Firefox, Safari, Edge 最新2个版本。

**Q: 会影响性能吗？**  
A: 影响极小，<1ms per operation。

**Q: 如何查看收集的数据？**  
A: 在您的服务端存储和展示，或等待 v0.3.0 的 Dashboard。

**Q: 可以本地部署吗？**  
A: 完全可以！数据完全可控。

---

## 🎉 开始使用！

只需 **3 行代码** 即可开始监控您的应用：

```typescript
import { createMonitor } from '@ldesign/monitor'

const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-project',
})

monitor.init()  // 🚀 监控已启动！
```

---

**🎊 欢迎使用 @ldesign/monitor！**

有问题？查看 [完整文档](./README.md) 或 [API 参考](./docs/API.md)



