<!--
  性能仪表板组件
  展示性能指标的实时数据
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { PerformanceMetric } from '../types'

/**
 * Props
 */
interface Props {
  /**
   * 刷新间隔（毫秒）
   */
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  refreshInterval: 5000,
})

/**
 * 性能指标数据
 */
const metrics = ref<PerformanceMetric[]>([])

/**
 * Web Vitals 数据
 */
const webVitals = computed(() => {
  const vitalsMap = new Map<string, PerformanceMetric>()
  
  metrics.value.forEach((metric) => {
    if (['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'INP'].includes(metric.name)) {
      vitalsMap.set(metric.name, metric)
    }
  })
  
  return Array.from(vitalsMap.values())
})

/**
 * 定时器
 */
let timer: ReturnType<typeof setInterval> | null = null

/**
 * 加载数据
 */
async function loadData() {
  try {
    // TODO: 从 API 加载数据
    // const response = await fetch('/api/monitor/metrics')
    // metrics.value = await response.json()
  }
  catch (error) {
    console.error('[Dashboard] Failed to load data:', error)
  }
}

/**
 * 获取评分颜色
 */
function getRatingColor(rating?: string): string {
  switch (rating) {
    case 'good':
      return '#52c41a'
    case 'needs-improvement':
      return '#faad14'
    case 'poor':
      return '#ff4d4f'
    default:
      return '#d9d9d9'
  }
}

onMounted(() => {
  loadData()
  timer = setInterval(loadData, props.refreshInterval)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="monitor-dashboard">
    <h2>性能仪表板</h2>

    <div class="metrics-grid">
      <div
        v-for="metric in webVitals"
        :key="metric.name"
        class="metric-card"
      >
        <div class="metric-name">{{ metric.name }}</div>
        <div 
          class="metric-value"
          :style="{ color: getRatingColor(metric.rating) }"
        >
          {{ metric.value.toFixed(2) }}
          <span class="metric-unit">{{ metric.unit || 'ms' }}</span>
        </div>
        <div class="metric-rating">{{ metric.rating || '-' }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-dashboard {
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.metric-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.metric-name {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
}

.metric-unit {
  font-size: 16px;
  font-weight: 400;
  margin-left: 4px;
}

.metric-rating {
  font-size: 12px;
  color: #8c8c8c;
  text-transform: capitalize;
}
</style>



