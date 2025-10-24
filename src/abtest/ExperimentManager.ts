/**
 * A/B 测试实验管理器
 * 管理实验的创建、启动和分析
 */

import { hashCode } from '../utils'

/**
 * 实验定义接口
 */
export interface ExperimentDefinition {
  /**
   * 实验 ID
   */
  id: string

  /**
   * 实验名称
   */
  name: string

  /**
   * 实验描述
   */
  description?: string

  /**
   * 变体列表
   */
  variants: ExperimentVariant[]

  /**
   * 流量分配策略
   * @default 'random'
   */
  allocationStrategy?: 'random' | 'hash'

  /**
   * 是否启用
   * @default true
   */
  enabled?: boolean
}

/**
 * 实验变体接口
 */
export interface ExperimentVariant {
  /**
   * 变体 ID
   */
  id: string

  /**
   * 变体名称
   */
  name: string

  /**
   * 流量权重
   * @default 1
   */
  weight?: number

  /**
   * 变体配置
   */
  config?: Record<string, unknown>
}

/**
 * 用户分配结果接口
 */
export interface AllocationResult {
  /**
   * 实验 ID
   */
  experimentId: string

  /**
   * 分配的变体 ID
   */
  variantId: string

  /**
   * 变体配置
   */
  config?: Record<string, unknown>
}

/**
 * 实验结果接口
 */
export interface ExperimentResult {
  /**
   * 实验 ID
   */
  experimentId: string

  /**
   * 每个变体的结果
   */
  variants: Array<{
    variantId: string
    count: number
    successRate?: number
    avgValue?: number
  }>

  /**
   * 统计显著性
   */
  significance?: {
    pValue: number
    significant: boolean
  }
}

/**
 * 实验管理器类
 */
export class ExperimentManager {
  /**
   * 实验列表
   */
  private experiments: Map<string, ExperimentDefinition> = new Map()

  /**
   * 用户分配记录
   * experimentId -> userId -> variantId
   */
  private allocations: Map<string, Map<string, string>> = new Map()

  /**
   * 实验结果数据
   * experimentId -> variantId -> data[]
   */
  private results: Map<string, Map<string, number[]>> = new Map()

  /**
   * 创建实验
   */
  createExperiment(experiment: ExperimentDefinition): void {
    this.experiments.set(experiment.id, {
      ...experiment,
      allocationStrategy: experiment.allocationStrategy ?? 'random',
      enabled: experiment.enabled ?? true,
    })

    this.allocations.set(experiment.id, new Map())
    this.results.set(experiment.id, new Map())
  }

  /**
   * 分配用户到变体
   */
  allocate(experimentId: string, userId: string): AllocationResult | null {
    const experiment = this.experiments.get(experimentId)

    if (!experiment || !experiment.enabled) {
      return null
    }

    // 检查是否已分配
    const allocations = this.allocations.get(experimentId)!
    const existingVariant = allocations.get(userId)

    if (existingVariant) {
      const variant = experiment.variants.find(v => v.id === existingVariant)
      return {
        experimentId,
        variantId: existingVariant,
        config: variant?.config,
      }
    }

    // 分配新变体
    const variant = this.selectVariant(experiment, userId)
    allocations.set(userId, variant.id)

    return {
      experimentId,
      variantId: variant.id,
      config: variant.config,
    }
  }

  /**
   * 选择变体
   */
  private selectVariant(experiment: ExperimentDefinition, userId: string): ExperimentVariant {
    const { variants, allocationStrategy } = experiment

    if (allocationStrategy === 'hash') {
      // 使用哈希分配（同一用户总是分配到同一变体）
      const hash = hashCode(userId + experiment.id)
      const totalWeight = variants.reduce((sum, v) => sum + (v.weight ?? 1), 0)
      let cumulative = 0
      const target = hash % totalWeight

      for (const variant of variants) {
        cumulative += variant.weight ?? 1
        if (target < cumulative) {
          return variant
        }
      }
    }

    // 随机分配
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight ?? 1), 0)
    let random = Math.random() * totalWeight

    for (const variant of variants) {
      random -= variant.weight ?? 1
      if (random <= 0) {
        return variant
      }
    }

    return variants[0]
  }

  /**
   * 记录实验结果
   */
  trackResult(experimentId: string, userId: string, value: number): void {
    const allocations = this.allocations.get(experimentId)
    const results = this.results.get(experimentId)

    if (!allocations || !results) {
      return
    }

    const variantId = allocations.get(userId)
    if (!variantId) {
      return
    }

    if (!results.has(variantId)) {
      results.set(variantId, [])
    }

    results.get(variantId)!.push(value)
  }

  /**
   * 分析实验结果
   */
  analyze(experimentId: string): ExperimentResult | null {
    const experiment = this.experiments.get(experimentId)
    const results = this.results.get(experimentId)

    if (!experiment || !results) {
      return null
    }

    const variantResults = experiment.variants.map((variant) => {
      const data = results.get(variant.id) || []
      const count = data.length
      const avgValue = count > 0 ? data.reduce((sum, v) => sum + v, 0) / count : 0

      return {
        variantId: variant.id,
        count,
        avgValue,
      }
    })

    return {
      experimentId,
      variants: variantResults,
    }
  }

  /**
   * 停止实验
   */
  stopExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId)
    if (experiment) {
      experiment.enabled = false
    }
  }

  /**
   * 删除实验
   */
  deleteExperiment(experimentId: string): void {
    this.experiments.delete(experimentId)
    this.allocations.delete(experimentId)
    this.results.delete(experimentId)
  }

  /**
   * 获取所有实验
   */
  getExperiments(): ExperimentDefinition[] {
    return Array.from(this.experiments.values())
  }
}

/**
 * 创建实验管理器实例
 */
export function createExperimentManager(): ExperimentManager {
  return new ExperimentManager()
}




