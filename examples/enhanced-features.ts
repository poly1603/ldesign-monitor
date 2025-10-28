/**
 * @ldesign/monitor - 增强功能综合示例
 * 
 * 展示如何使用所有新增的监控功能
 */

import { createMonitor } from '@ldesign/monitor'
import {
  // 性能监控
  CustomMarkCollector,
  LongTaskCollector,
  MemoryCollector,
  FPSCollector,
  RenderOptimizationAdvisor,
  // 用户行为
  ScrollDepthTracker,
  TimeOnPageTracker,
  SessionTimeManager,
} from '@ldesign/monitor'

// ============ 1. 创建监控实例 ============
const monitor = createMonitor({
  dsn: 'https://your-endpoint.com/api/monitor',
  projectId: 'my-enhanced-app',
  environment: 'production',
  sampleRate: 1.0,
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
})

monitor.init()

// ============ 2. 性能监控增强 ============

// 2.1 自定义性能标记
const customMarkCollector = new CustomMarkCollector({
  autoCollect: true,
  collectMeasures: true,
})

customMarkCollector.start((metric) => {
  monitor.trackPerformance(metric.name, metric.value)
})

// 使用性能标记追踪关键操作
function loadData() {
  customMarkCollector.mark('data-load-start')
  
  return fetch('/api/data')
    .then(res => res.json())
    .then(data => {
      customMarkCollector.mark('data-load-end')
      const duration = customMarkCollector.measure(
        'data-load-duration',
        'data-load-start',
        'data-load-end'
      )
      console.log(`Data loaded in ${duration}ms`)
      return data
    })
}

// 2.2 Long Tasks 检测
const longTaskCollector = new LongTaskCollector({
  threshold: 50,
  collectAttribution: true,
})

longTaskCollector.start((taskInfo) => {
  // 上报长任务
  monitor.trackEvent('longtask', {
    duration: taskInfo.duration,
    blockingTime: taskInfo.attribution?.blockingTime,
    rating: taskInfo.rating,
  })

  // 如果任务过长，发出警告
  if (taskInfo.duration > 200) {
    console.warn('Long task detected:', taskInfo)
  }
})

// 定期检查长任务统计
setInterval(() => {
  const stats = longTaskCollector.getStats()
  if (stats.longTaskCount > 10) {
    console.warn('Too many long tasks detected:', stats)
  }
}, 60000)

// 2.3 内存监控
const memoryCollector = new MemoryCollector({
  interval: 30000,
  warningThreshold: 100 * 1024 * 1024,
  dangerThreshold: 200 * 1024 * 1024,
})

memoryCollector.start((metric) => {
  monitor.trackPerformance('memory', metric.value)

  // 检测内存泄漏
  const leakDetection = memoryCollector.detectMemoryLeak()
  if (leakDetection.suspected) {
    monitor.trackEvent('memory-leak-suspected', {
      reason: leakDetection.reason,
      usage: metric.attribution?.usagePercent,
    })
  }
})

// 2.4 FPS 监控
const fpsCollector = new FPSCollector({
  interval: 1000,
  lowFPSThreshold: 30,
  freezeThreshold: 20,
})

fpsCollector.start((metric) => {
  // 只在 FPS 过低时上报
  if (metric.value < 30) {
    monitor.trackEvent('low-fps', {
      fps: metric.value,
      avgFPS: metric.attribution?.avgFPS,
      freezeCount: metric.attribution?.freezeCount,
    })
  }
})

// 2.5 性能优化建议
const optimizationAdvisor = new RenderOptimizationAdvisor()

// 在页面加载完成后分析性能
window.addEventListener('load', () => {
  setTimeout(() => {
    const analysis = optimizationAdvisor.analyze()
    
    console.log('Performance Score:', analysis.score)
    console.log('Optimization Suggestions:', analysis.suggestions)

    // 上报性能分析结果
    monitor.trackEvent('performance-analysis', {
      score: analysis.score,
      fcp: analysis.fcp,
      lcp: analysis.lcp,
      cls: analysis.cls,
      suggestionCount: analysis.suggestions.length,
      criticalIssues: analysis.suggestions.filter(s => s.type === 'critical').length,
    })

    // 显示优化建议（开发环境）
    if (process.env.NODE_ENV === 'development' && analysis.suggestions.length > 0) {
      console.group('🔍 Performance Optimization Suggestions')
      analysis.suggestions.forEach((suggestion, index) => {
        const icon = suggestion.type === 'critical' ? '🔴' :
                     suggestion.type === 'important' ? '🟡' : '🟢'
        console.log(`${icon} ${index + 1}. ${suggestion.title}`)
        console.log(`   ${suggestion.description}`)
        if (suggestion.estimatedGain) {
          console.log(`   📈 Estimated gain: ${suggestion.estimatedGain}ms`)
        }
        if (suggestion.resources && suggestion.resources.length > 0) {
          console.log(`   📦 Resources:`, suggestion.resources)
        }
      })
      console.groupEnd()
    }
  }, 3000) // 等待3秒确保所有资源加载完成
})

// ============ 3. 用户行为增强 ============

// 3.1 滚动深度追踪
const scrollDepthTracker = new ScrollDepthTracker({
  milestones: [25, 50, 75, 100],
  throttle: 300,
  trackElementVisibility: true,
})

scrollDepthTracker.start(
  (event) => {
    // 达到里程碑时上报
    if (event.milestone) {
      monitor.trackEvent('scroll-depth-milestone', {
        milestone: event.milestone,
        depth: event.depth,
        scrollTop: event.scrollTop,
        pageHeight: event.pageHeight,
      })
    }
  },
  (event) => {
    // 元素可见性事件
    monitor.trackEvent('element-visible', {
      selector: event.selector,
      visibility: event.visibility,
      isFullyVisible: event.isFullyVisible,
    })
  }
)

// 追踪关键元素
scrollDepthTracker.trackElement('.hero-section')
scrollDepthTracker.trackElement('.cta-button')
scrollDepthTracker.trackElement('.pricing-table')
scrollDepthTracker.trackElement('footer')

// 定期上报滚动统计
setInterval(() => {
  const stats = scrollDepthTracker.getStats()
  if (stats.maxDepthReached > 0) {
    monitor.trackEvent('scroll-stats', {
      maxDepth: stats.maxDepthReached,
      milestones: stats.reachedMilestones,
      totalDistance: stats.totalScrollDistance,
      avgSpeed: stats.averageScrollSpeed,
    })
  }
}, 30000)

// 3.2 停留时间统计
const timeOnPageTracker = new TimeOnPageTracker({
  checkInterval: 5000,
  inactiveTimeout: 30000,
  trackVisibility: true,
  trackElements: true,
})

timeOnPageTracker.start(
  (event) => {
    // 定期上报时间统计
    monitor.trackEvent('time-on-page', {
      totalTime: event.totalTime,
      activeTime: event.activeTime,
      inactiveTime: event.inactiveTime,
      visibleTime: event.visibleTime,
      hiddenTime: event.hiddenTime,
      isActive: event.isActive,
      isVisible: event.isVisible,
    })
  },
  (event) => {
    // 元素停留时间
    monitor.trackEvent('element-time', {
      selector: event.selector,
      duration: event.duration,
      totalVisibleTime: event.totalVisibleTime,
    })
  }
)

// 追踪关键元素的停留时间
timeOnPageTracker.trackElement('.product-video')
timeOnPageTracker.trackElement('.demo-section')
timeOnPageTracker.trackElement('.testimonials')

// 会话时间管理
const sessionManager = new SessionTimeManager()
const sessionId = monitor.getSessionId()
sessionManager.startSession(sessionId)

// 定期更新会话时间
setInterval(() => {
  const stats = timeOnPageTracker.getStats()
  sessionManager.updateActivity(stats.activeTime)
}, 10000)

// ============ 4. 综合监控场景 ============

// 场景1: 监控关键业务流程
async function checkoutFlow() {
  // 开始追踪
  customMarkCollector.mark('checkout-start')
  
  try {
    // 步骤1: 验证购物车
    customMarkCollector.mark('validate-cart-start')
    await validateCart()
    customMarkCollector.mark('validate-cart-end')
    customMarkCollector.measure('validate-cart', 'validate-cart-start', 'validate-cart-end')

    // 步骤2: 处理支付
    customMarkCollector.mark('process-payment-start')
    await processPayment()
    customMarkCollector.mark('process-payment-end')
    customMarkCollector.measure('process-payment', 'process-payment-start', 'process-payment-end')

    // 步骤3: 创建订单
    customMarkCollector.mark('create-order-start')
    await createOrder()
    customMarkCollector.mark('create-order-end')
    customMarkCollector.measure('create-order', 'create-order-start', 'create-order-end')

    // 完成
    customMarkCollector.mark('checkout-end')
    const totalDuration = customMarkCollector.measure('checkout-total', 'checkout-start', 'checkout-end')

    monitor.trackEvent('checkout-success', {
      duration: totalDuration,
    })

  } catch (error) {
    monitor.trackError(error as Error, {
      flow: 'checkout',
      step: 'unknown',
    })
  }
}

// 场景2: 监控页面交互性能
function monitorInteraction(actionName: string, action: () => void | Promise<void>) {
  customMarkCollector.mark(`${actionName}-start`)
  
  const result = action()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      customMarkCollector.mark(`${actionName}-end`)
      const duration = customMarkCollector.measure(
        `${actionName}-duration`,
        `${actionName}-start`,
        `${actionName}-end`
      )
      
      if (duration && duration > 100) {
        monitor.trackEvent('slow-interaction', {
          action: actionName,
          duration,
        })
      }
    })
  } else {
    customMarkCollector.mark(`${actionName}-end`)
    const duration = customMarkCollector.measure(
      `${actionName}-duration`,
      `${actionName}-start`,
      `${actionName}-end`
    )
    
    if (duration && duration > 50) {
      monitor.trackEvent('slow-interaction', {
        action: actionName,
        duration,
      })
    }
  }
}

// 使用示例
document.getElementById('submit-button')?.addEventListener('click', () => {
  monitorInteraction('button-submit', async () => {
    await submitForm()
  })
})

// 场景3: 性能警报
function setupPerformanceAlerts() {
  // 内存警报
  setInterval(() => {
    const memoryInfo = memoryCollector.getCurrentMemory()
    if (memoryInfo && memoryInfo.usage > 0.8) {
      console.warn('High memory usage:', memoryInfo.usage)
      monitor.trackEvent('high-memory-alert', {
        usage: memoryInfo.usage,
        usedMB: (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2),
      })
    }
  }, 60000)

  // FPS 警报
  setInterval(() => {
    const fpsInfo = fpsCollector.getFPSInfo()
    if (fpsInfo.avgFPS < 30) {
      console.warn('Low FPS detected:', fpsInfo)
      monitor.trackEvent('low-fps-alert', {
        avgFPS: fpsInfo.avgFPS,
        minFPS: fpsInfo.minFPS,
        freezeCount: fpsInfo.freezeCount,
      })
    }
  }, 60000)
}

setupPerformanceAlerts()

// ============ 5. 清理 ============
window.addEventListener('beforeunload', () => {
  // 停止所有收集器
  customMarkCollector.stop()
  longTaskCollector.stop()
  memoryCollector.stop()
  fpsCollector.stop()
  scrollDepthTracker.stop()
  timeOnPageTracker.stop()
  sessionManager.endSession()
})

// ============ 工具函数 ============
async function validateCart(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200))
}

async function processPayment(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000))
}

async function createOrder(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))
}

async function submitForm(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500))
}

// ============ 导出 ============
export {
  monitor,
  customMarkCollector,
  longTaskCollector,
  memoryCollector,
  fpsCollector,
  optimizationAdvisor,
  scrollDepthTracker,
  timeOnPageTracker,
  sessionManager,
}
