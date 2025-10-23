/**
 * Vue 3 应用集成示例
 */

import { createApp } from 'vue'
import { createMonitorPlugin } from '../src/vue'

// 创建 Vue 应用
const app = createApp({
  template: '<div>My App</div>',
})

// 安装监控插件
app.use(createMonitorPlugin({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-vue-app',
  environment: 'production',
  sampleRate: 1.0,
  trackRoutes: true,
  captureVueErrors: true,
  debug: true,
}))

// 挂载应用
app.mount('#app')

// 在组件中使用
// <script setup>
// import { useMonitor, usePageTracking, useEventTracking } from '@ldesign/monitor/vue'
//
// const monitor = useMonitor()
//
// // 自动追踪页面
// usePageTracking('/dashboard')
//
// // 追踪事件
// const { trackEvent } = useEventTracking()
//
// const handleClick = () => {
//   trackEvent('button-click', { buttonId: 'submit' })
// }
// </script>

export default app



