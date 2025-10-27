/**
 * 告警引擎
 * 监控指标并触发告警
 */

import { now } from '../utils'

/**
 * 告警规则接口
 */
export interface AlertRule {
  /**
   * 规则 ID
   */
  id: string

  /**
   * 规则名称
   */
  name: string

  /**
   * 规则类型
   */
  type: 'error_rate' | 'performance' | 'custom'

  /**
   * 条件表达式
   */
  condition: {
    /**
     * 指标名称
     */
    metric: string

    /**
     * 操作符
     */
    operator: '>' | '<' | '>=' | '<=' | '=='

    /**
     * 阈值
     */
    threshold: number

    /**
     * 时间窗口（毫秒）
     */
    timeWindow?: number
  }

  /**
   * 通知渠道
   */
  channels: AlertChannel[]

  /**
   * 是否启用
   * @default true
   */
  enabled?: boolean

  /**
   * 告警节流（毫秒）
   * @default 300000 (5分钟)
   */
  throttle?: number
}

/**
 * 告警渠道类型
 */
export type AlertChannel = 'email' | 'dingtalk' | 'feishu' | 'webhook'

/**
 * 告警事件接口
 */
export interface AlertEvent {
  /**
   * 规则 ID
   */
  ruleId: string

  /**
   * 规则名称
   */
  ruleName: string

  /**
   * 触发值
   */
  value: number

  /**
   * 阈值
   */
  threshold: number

  /**
   * 消息
   */
  message: string

  /**
   * 严重程度
   */
  severity: 'low' | 'medium' | 'high' | 'critical'

  /**
   * 时间戳
   */
  timestamp: number
}

/**
 * 告警引擎类
 */
export class AlertEngine {
  /**
   * 规则列表
   */
  private rules: Map<string, AlertRule> = new Map()

  /**
   * 指标数据
   */
  private metrics: Map<string, number[]> = new Map()

  /**
   * 最后告警时间
   */
  private lastAlertTime: Map<string, number> = new Map()

  /**
   * 回调函数
   */
  private callbacks: Set<(alert: AlertEvent) => void> = new Set()

  /**
   * 添加规则
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, {
      ...rule,
      enabled: rule.enabled ?? true,
      throttle: rule.throttle ?? 300000,
    })
  }

  /**
   * 更新指标
   */
  updateMetric(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, [])
    }

    const values = this.metrics.get(metric)!
    values.push(value)

    // 限制数据量（只保留最近100个）
    if (values.length > 100) {
      values.shift()
    }

    // 检查所有规则
    this.checkRules(metric, value)
  }

  /**
   * 检查规则
   */
  private checkRules(metric: string, value: number): void {
    this.rules.forEach((rule) => {
      if (!rule.enabled || rule.condition.metric !== metric) {
        return
      }

      // 检查条件
      const triggered = this.evaluateCondition(rule.condition, value)

      if (triggered) {
        this.triggerAlert(rule, value)
      }
    })
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: AlertRule['condition'], value: number): boolean {
    switch (condition.operator) {
      case '>':
        return value > condition.threshold
      case '<':
        return value < condition.threshold
      case '>=':
        return value >= condition.threshold
      case '<=':
        return value <= condition.threshold
      case '==':
        return value === condition.threshold
      default:
        return false
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(rule: AlertRule, value: number): void {
    // 检查节流
    const lastTime = this.lastAlertTime.get(rule.id) || 0
    const elapsed = now() - lastTime

    if (elapsed < rule.throttle!) {
      return // 在节流期内，不发送告警
    }

    this.lastAlertTime.set(rule.id, now())

    const alert: AlertEvent = {
      ruleId: rule.id,
      ruleName: rule.name,
      value,
      threshold: rule.condition.threshold,
      message: `${rule.name}: ${value} ${rule.condition.operator} ${rule.condition.threshold}`,
      severity: this.determineSeverity(value, rule.condition.threshold),
      timestamp: now(),
    }

    this.emit(alert)
  }

  /**
   * 确定严重程度
   */
  private determineSeverity(value: number, threshold: number): AlertEvent['severity'] {
    const ratio = Math.abs(value - threshold) / threshold

    if (ratio > 1.0) return 'critical'
    if (ratio > 0.5) return 'high'
    if (ratio > 0.2) return 'medium'
    return 'low'
  }

  /**
   * 发射告警事件
   */
  private emit(alert: AlertEvent): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(alert)
      }
      catch (error) {
        console.error('[AlertEngine] Error in callback:', error)
      }
    })
  }

  /**
   * 添加回调
   */
  onAlert(callback: (alert: AlertEvent) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * 获取规则
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId)
  }

  /**
   * 获取所有规则
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * 删除规则
   */
  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId)
    this.lastAlertTime.delete(ruleId)
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.metrics.clear()
    this.lastAlertTime.clear()
  }
}

/**
 * 创建告警引擎实例
 */
export function createAlertEngine(): AlertEngine {
  return new AlertEngine()
}





















