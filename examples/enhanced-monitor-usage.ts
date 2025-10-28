/**
 * @ldesign/monitor - 增强监控使用示例
 * 
 * 展示如何使用 EnhancedMonitor 一键启用所有增强功能
 */

import { createEnhancedMonitor } from '@ldesign/monitor'

// ============ 快速开始 ============

// 创建增强监控实例（一行代码启用所有功能）
const monitor = createEnhancedMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-enhanced-app',
  environment: 'production',
  sampleRate: 1.0,
  
  // 启用所有增强功能（默认配置）
  enhanced: {
    performance: {
      customMarks: true,    // 自定义性能标记
      longTasks: true,      // Long Tasks检测
      memory: true,         // 内存监控
      fps: false,           // FPS监控（生产环境建议关闭）
      optimization: true,   // 优化建议
    },
    behavior: {
      scrollDepth: true,    // 滚动深度追踪
      timeOnPage: true,     // 停留时间统计
    },
    api: {
      graphql: true,        // GraphQL监控
      websocket: true,      // WebSocket监控
    },
    offline: {
      enabled: true,        // 离线缓存
      maxItems: 1000,       // 最大缓存条数
      ttl: 7 * 24 * 60 * 60 * 1000, // 7天过期
    },
  },
})

// 初始化
monitor.init()

// ============ 使用增强功能 ============

// 1. 性能标记（自动启用）
monitor.mark('feature-start')
await doSomething()
monitor.mark('feature-end')
const duration = monitor.measure('feature', 'feature-start', 'feature-end')
console.log(`Feature took ${duration}ms`)

// 2. 追踪关键元素
monitor.trackScrollElement('.hero-section')
monitor.trackScrollElement('.cta-button')
monitor.trackElementTime('.product-video')

// 3. 获取实时统计
const stats = monitor.getEnhancedStats()
console.log('Enhanced Stats:', stats)

// 4. 获取内存信息
const memory = monitor.getMemoryInfo()
if (memory && memory.usage > 0.8) {
  console.warn('High memory usage:', memory.usage)
}

// 5. 获取优化建议
const suggestions = monitor.getOptimizationSuggestions()
if (suggestions && suggestions.score < 70) {
  console.warn('Performance score:', suggestions.score)
  console.log('Suggestions:', suggestions.suggestions.slice(0, 5))
}

// ============ 监听增强事件 ============

// 监听性能事件
monitor.on('performance:mark', (metric) => {
  console.log('Performance mark:', metric.name, metric.value)
})

monitor.on('performance:longtask', (taskInfo) => {
  console.warn('Long task detected:', taskInfo.duration + 'ms')
})

monitor.on('performance:memory-leak', (detection) => {
  console.error('Memory leak suspected:', detection.reason)
})

monitor.on('performance:fps', (metric) => {
  if (metric.value < 30) {
    console.warn('Low FPS:', metric.value)
  }
})

monitor.on('performance:analysis', (analysis) => {
  console.log('Performance analysis complete:', {
    score: analysis.score,
    criticalIssues: analysis.suggestions.filter(s => s.type === 'critical').length,
  })
})

// 监听行为事件
monitor.on('behavior:scroll', (event) => {
  if (event.milestone) {
    console.log(`User scrolled to ${event.milestone}%`)
  }
})

monitor.on('behavior:time', (event) => {
  console.log('Time on page:', {
    total: event.totalTime,
    active: event.activeTime,
    visible: event.visibleTime,
  })
})

// 监听API事件
monitor.on('api:graphql', (metrics) => {
  if (!metrics.success) {
    console.error('GraphQL error:', metrics.errors)
  }
  if (metrics.duration > 1000) {
    console.warn('Slow GraphQL query:', metrics.operationName, metrics.duration)
  }
})

monitor.on('api:websocket-connection', (conn) => {
  console.log('WebSocket:', conn.type, conn.url)
})

// ============ 实战场景 ============

// 场景1: 电商结账流程监控
async function monitorCheckoutFlow() {
  monitor.mark('checkout-start')
  
  // 步骤1
  monitor.mark('step1-start')
  await validateCart()
  monitor.mark('step1-end')
  monitor.measure('checkout-step1', 'step1-start', 'step1-end')
  
  // 步骤2
  monitor.mark('step2-start')
  await processPayment()
  monitor.mark('step2-end')
  monitor.measure('checkout-step2', 'step2-start', 'step2-end')
  
  // 完成
  monitor.mark('checkout-end')
  const total = monitor.measure('checkout-total', 'checkout-start', 'checkout-end')
  
  console.log(`Checkout completed in ${total}ms`)
  
  // 获取性能统计
  const stats = monitor.getEnhancedStats()
  console.log('Long tasks during checkout:', stats.performance.longTasks)
}

// 场景2: SPA页面切换监控
function setupRouterMonitoring(router: any) {
  router.beforeEach((to: any, from: any, next: any) => {
    monitor.mark(`route-${to.name}-start`)
    next()
  })
  
  router.afterEach((to: any) => {
    monitor.mark(`route-${to.name}-end`)
    const duration = monitor.measure(
      `route-${to.name}`,
      `route-${to.name}-start`,
      `route-${to.name}-end`
    )
    
    console.log(`Route ${to.name} took ${duration}ms`)
    
    // 重置滚动统计
    const scrollStats = monitor.getScrollStats()
    console.log('Previous page scroll:', scrollStats)
  })
}

// 场景3: 实时性能监控仪表板
function setupPerformanceDashboard() {
  setInterval(() => {
    const stats = monitor.getEnhancedStats()
    
    // 内存使用
    if (stats.performance.memory) {
      updateMemoryGauge(stats.performance.memory.usage)
    }
    
    // FPS
    if (stats.performance.fps) {
      updateFPSDisplay(stats.performance.fps.fps)
    }
    
    // 长任务
    if (stats.performance.longTasks) {
      updateLongTaskCount(stats.performance.longTasks.longTaskCount)
    }
    
    // 滚动深度
    if (stats.behavior.scroll) {
      updateScrollDepth(stats.behavior.scroll.maxDepthReached)
    }
    
    // 停留时间
    if (stats.behavior.time) {
      updateTimeOnPage(stats.behavior.time.activeTime)
    }
  }, 5000) // 每5秒更新
}

// 场景4: 离线数据管理
async function manageOfflineData() {
  // 获取离线队列统计
  const queueStats = await monitor.getOfflineQueueStats()
  if (queueStats) {
    console.log('Offline queue:', {
      total: queueStats.totalEvents,
      byType: queueStats.eventsByType,
      oldest: queueStats.oldestEvent,
    })
    
    // 如果队列过大，手动刷新
    if (queueStats.totalEvents > 100) {
      console.log('Flushing offline queue...')
      await monitor.flushOfflineQueue()
    }
  }
}

// 场景5: GraphQL查询分析
function analyzeGraphQLUsage() {
  const fieldStats = monitor.getGraphQLFieldStats()
  if (fieldStats) {
    console.log('Top 10 GraphQL fields:', fieldStats.slice(0, 10))
    
    // 检测未使用的字段
    const allFields = ['id', 'name', 'email', 'avatar', 'profile', ...]
    const usedFields = fieldStats.map(s => s.field)
    const unusedFields = allFields.filter(f => !usedFields.includes(f))
    
    if (unusedFields.length > 0) {
      console.log('Unused GraphQL fields:', unusedFields)
    }
  }
}

// 场景6: WebSocket健康检查
function monitorWebSocketHealth() {
  const wsMetrics = monitor.getWebSocketMetrics()
  if (wsMetrics) {
    wsMetrics.forEach(metrics => {
      if (!metrics.isHealthy) {
        console.warn('Unhealthy WebSocket:', {
          url: metrics.url,
          state: metrics.state,
          errors: metrics.errorCount,
          lastActivity: new Date(metrics.lastActivity),
        })
      }
      
      if (metrics.avgRTT && metrics.avgRTT > 1000) {
        console.warn('High WebSocket latency:', metrics.avgRTT + 'ms')
      }
    })
  }
}

// ============ 生产环境配置 ============

// 生产环境推荐配置
const productionMonitor = createEnhancedMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-app',
  environment: 'production',
  sampleRate: 0.1, // 10%采样率
  
  enhanced: {
    performance: {
      customMarks: true,
      longTasks: true,
      memory: true,
      fps: false,           // 生产环境关闭FPS
      optimization: false,  // 生产环境关闭优化分析
    },
    behavior: {
      scrollDepth: true,
      timeOnPage: true,
    },
    api: {
      graphql: true,
      websocket: true,
    },
    offline: {
      enabled: true,
      maxItems: 500,        // 减少缓存量
      ttl: 3 * 24 * 60 * 60 * 1000, // 3天
    },
  },
  
  // 数据脱敏
  hooks: {
    beforeSend: (data) => {
      // 移除敏感信息
      if (data.context?.url) {
        data.context.url = data.context.url.replace(/token=[^&]+/, 'token=[REDACTED]')
      }
      return data
    },
  },
})

// ============ 开发环境配置 ============

// 开发环境推荐配置
const developmentMonitor = createEnhancedMonitor({
  dsn: 'http://localhost:3000/api/monitor',
  projectId: 'my-app-dev',
  environment: 'development',
  sampleRate: 1.0, // 100%采样
  debug: true,
  
  enhanced: {
    performance: {
      customMarks: true,
      longTasks: true,
      memory: true,
      fps: true,            // 开发环境启用FPS
      optimization: true,   // 开发环境启用优化分析
    },
    behavior: {
      scrollDepth: true,
      timeOnPage: true,
    },
    api: {
      graphql: true,
      websocket: true,
    },
    offline: {
      enabled: false,       // 开发环境可以关闭离线缓存
    },
  },
})

// ============ 清理 ============

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  monitor.destroy()
})

// ============ 工具函数 ============

async function validateCart(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200))
}

async function processPayment(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000))
}

async function doSomething(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500))
}

function updateMemoryGauge(usage: number): void {
  console.log('Memory:', (usage * 100).toFixed(1) + '%')
}

function updateFPSDisplay(fps: number): void {
  console.log('FPS:', fps)
}

function updateLongTaskCount(count: number): void {
  console.log('Long tasks:', count)
}

function updateScrollDepth(depth: number): void {
  console.log('Scroll depth:', depth + '%')
}

function updateTimeOnPage(time: number): void {
  console.log('Active time:', (time / 1000).toFixed(0) + 's')
}

// ============ 导出 ============

export {
  monitor,
  productionMonitor,
  developmentMonitor,
  monitorCheckoutFlow,
  setupRouterMonitoring,
  setupPerformanceDashboard,
  manageOfflineData,
  analyzeGraphQLUsage,
  monitorWebSocketHealth,
}
