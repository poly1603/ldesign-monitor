/**
 * 漏斗分析器
 * 分析用户转化漏斗，计算转化率和流失率
 */

/**
 * 漏斗步骤接口
 */
export interface FunnelStep {
  /**
   * 步骤名称
   */
  name: string

  /**
   * 步骤事件（触发条件）
   */
  event: string

  /**
   * 步骤描述
   */
  description?: string
}

/**
 * 漏斗定义接口
 */
export interface FunnelDefinition {
  /**
   * 漏斗 ID
   */
  id: string

  /**
   * 漏斗名称
   */
  name: string

  /**
   * 漏斗步骤列表
   */
  steps: FunnelStep[]

  /**
   * 时间窗口（毫秒）
   * 用户必须在此时间内完成所有步骤
   * @default 3600000 (1小时)
   */
  timeWindow?: number
}

/**
 * 漏斗结果接口
 */
export interface FunnelResult {
  /**
   * 漏斗 ID
   */
  funnelId: string

  /**
   * 每个步骤的数据
   */
  steps: Array<{
    /**
     * 步骤名称
     */
    name: string

    /**
     * 到达人数
     */
    count: number

    /**
     * 转化率（相对于上一步）
     */
    conversionRate: number

    /**
     * 流失率
     */
    dropOffRate: number

    /**
     * 累计转化率（相对于第一步）
     */
    cumulativeConversionRate: number
  }>

  /**
   * 总转化率
   */
  totalConversionRate: number

  /**
   * 分析的用户数
   */
  totalUsers: number
}

/**
 * 漏斗分析器类
 */
export class FunnelAnalyzer {
  /**
   * 漏斗定义列表
   */
  private funnels: Map<string, FunnelDefinition> = new Map()

  /**
   * 用户事件记录
   * userId -> events
   */
  private userEvents: Map<string, Array<{ event: string; timestamp: number }>> = new Map()

  /**
   * 定义漏斗
   */
  defineFunnel(funnel: FunnelDefinition): void {
    this.funnels.set(funnel.id, {
      ...funnel,
      timeWindow: funnel.timeWindow ?? 3600000,
    })
  }

  /**
   * 记录用户事件
   */
  trackEvent(userId: string, event: string, timestamp: number): void {
    if (!this.userEvents.has(userId)) {
      this.userEvents.set(userId, [])
    }

    this.userEvents.get(userId)!.push({ event, timestamp })
  }

  /**
   * 分析漏斗
   */
  analyze(funnelId: string): FunnelResult | null {
    const funnel = this.funnels.get(funnelId)
    if (!funnel) {
      return null
    }

    const stepResults: FunnelResult['steps'] = []
    const usersByStep: Map<number, Set<string>> = new Map()

    // 初始化每个步骤的用户集合
    funnel.steps.forEach((_, index) => {
      usersByStep.set(index, new Set())
    })

    // 遍历所有用户的事件
    this.userEvents.forEach((events, userId) => {
      let currentStep = 0
      let lastStepTime = 0

      for (const { event, timestamp } of events) {
        if (currentStep >= funnel.steps.length) {
          break
        }

        const step = funnel.steps[currentStep]

        // 检查是否匹配当前步骤
        if (event === step.event) {
          // 检查时间窗口
          if (currentStep > 0) {
            const timeSinceLastStep = timestamp - lastStepTime
            if (timeSinceLastStep > funnel.timeWindow!) {
              // 超出时间窗口，放弃该用户
              break
            }
          }

          usersByStep.get(currentStep)!.add(userId)
          lastStepTime = timestamp
          currentStep++
        }
      }
    })

    // 计算每个步骤的统计数据
    const firstStepUsers = usersByStep.get(0)!.size

    funnel.steps.forEach((step, index) => {
      const currentUsers = usersByStep.get(index)!.size
      const previousUsers = index > 0 ? usersByStep.get(index - 1)!.size : currentUsers

      stepResults.push({
        name: step.name,
        count: currentUsers,
        conversionRate: previousUsers > 0 ? currentUsers / previousUsers : 0,
        dropOffRate: previousUsers > 0 ? 1 - currentUsers / previousUsers : 0,
        cumulativeConversionRate: firstStepUsers > 0 ? currentUsers / firstStepUsers : 0,
      })
    })

    return {
      funnelId,
      steps: stepResults,
      totalConversionRate: stepResults.length > 0
        ? stepResults[stepResults.length - 1].cumulativeConversionRate
        : 0,
      totalUsers: firstStepUsers,
    }
  }

  /**
   * 获取漏斗列表
   */
  getFunnels(): FunnelDefinition[] {
    return Array.from(this.funnels.values())
  }

  /**
   * 删除漏斗
   */
  deleteFunnel(funnelId: string): void {
    this.funnels.delete(funnelId)
  }

  /**
   * 清空数据
   */
  clear(): void {
    this.userEvents.clear()
  }
}

/**
 * 创建漏斗分析器实例
 */
export function createFunnelAnalyzer(): FunnelAnalyzer {
  return new FunnelAnalyzer()
}

/**
 * useMonitor hook
 */
export { useMonitor }

/**
 * usePageTracking hook
 */
export { usePageTracking }

/**
 * useEventTracking hook
 */
export { useEventTracking }





























