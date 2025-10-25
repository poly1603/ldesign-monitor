/**
 * @ldesign/monitor - 配置预设
 * 
 * 提供常见场景的预设配置
 */

import type { MonitorConfig } from '../types'

/**
 * 开发环境配置预设
 */
export const developmentPreset: Partial<MonitorConfig> = {
  environment: 'development',
  debug: true,
  sampleRate: 1.0,
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
  enableAPI: true,
  enableReplay: false,
  batch: {
    size: 5,
    interval: 1000, // 更快的上报间隔
  },
  retry: {
    maxRetries: 1,
    delay: 500,
  },
}

/**
 * 生产环境配置预设
 */
export const productionPreset: Partial<MonitorConfig> = {
  environment: 'production',
  debug: false,
  sampleRate: 0.1, // 10% 采样率
  enablePerformance: true,
  enableError: true,
  enableBehavior: false, // 生产环境可能不需要详细的行为追踪
  enableAPI: true,
  enableReplay: false, // 会话回放消耗较大
  batch: {
    size: 20,
    interval: 10000, // 更长的批处理间隔
  },
  retry: {
    maxRetries: 3,
    delay: 2000,
  },
}

/**
 * 测试环境配置预设
 */
export const testPreset: Partial<MonitorConfig> = {
  environment: 'test',
  debug: false,
  sampleRate: 0,  // 测试环境默认不上报
  enablePerformance: false,
  enableError: false,
  enableBehavior: false,
  enableAPI: false,
  enableReplay: false,
}

/**
 * 性能优先配置预设
 * 适用于对性能要求极高的场景
 */
export const performanceFirstPreset: Partial<MonitorConfig> = {
  sampleRate: 0.05, // 5% 采样率
  enablePerformance: true,
  enableError: true,
  enableBehavior: false,
  enableAPI: false,
  enableReplay: false,
  batch: {
    size: 50, // 更大的批量
    interval: 30000, // 更长的间隔
  },
}

/**
 * 完整监控配置预设
 * 适用于需要完整数据的场景
 */
export const fullMonitoringPreset: Partial<MonitorConfig> = {
  sampleRate: 1.0,
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
  enableAPI: true,
  enableReplay: true,
  batch: {
    size: 10,
    interval: 5000,
  },
}

/**
 * 错误监控专用配置预设
 */
export const errorOnlyPreset: Partial<MonitorConfig> = {
  enablePerformance: false,
  enableError: true,
  enableBehavior: false,
  enableAPI: false,
  enableReplay: false,
  batch: {
    size: 10,
    interval: 3000,
  },
}

/**
 * 配置预设映射
 */
export const presets = {
  development: developmentPreset,
  production: productionPreset,
  test: testPreset,
  performanceFirst: performanceFirstPreset,
  fullMonitoring: fullMonitoringPreset,
  errorOnly: errorOnlyPreset,
} as const

export type PresetName = keyof typeof presets

/**
 * 应用配置预设
 * 
 * @param baseConfig - 基础配置（必须包含 dsn 和 projectId）
 * @param presetName - 预设名称
 * @returns 合并后的配置
 */
export function applyPreset(
  baseConfig: Pick<MonitorConfig, 'dsn' | 'projectId'> & Partial<MonitorConfig>,
  presetName: PresetName
): MonitorConfig {
  const preset = presets[presetName]

  return {
    ...preset,
    ...baseConfig,
    // 确保必填字段不被覆盖
    dsn: baseConfig.dsn,
    projectId: baseConfig.projectId,
  }
}

/**
 * 合并多个配置预设
 * 
 * @param baseConfig - 基础配置
 * @param presetNames - 预设名称数组（后面的会覆盖前面的）
 * @returns 合并后的配置
 */
export function mergePresets(
  baseConfig: Pick<MonitorConfig, 'dsn' | 'projectId'> & Partial<MonitorConfig>,
  ...presetNames: PresetName[]
): MonitorConfig {
  let mergedConfig: Partial<MonitorConfig> = { ...baseConfig }

  for (const presetName of presetNames) {
    mergedConfig = {
      ...mergedConfig,
      ...presets[presetName],
    }
  }

  return {
    ...mergedConfig,
    dsn: baseConfig.dsn,
    projectId: baseConfig.projectId,
  } as MonitorConfig
}

