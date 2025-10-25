/**
 * 告警引擎测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AlertEngine } from '../alert/AlertEngine'
import { sleep } from '../utils'

describe('AlertEngine', () => {
  let engine: AlertEngine

  beforeEach(() => {
    engine = new AlertEngine()
  })

  describe('规则管理', () => {
    it('应该能添加规则', () => {
      engine.addRule({
        id: 'rule1',
        name: 'Test Rule',
        type: 'error_rate',
        condition: {
          metric: 'error_rate',
          operator: '>',
          threshold: 0.05,
        },
        channels: ['email'],
      })

      const rules = engine.getRules()
      expect(rules).toHaveLength(1)
      expect(rules[0].id).toBe('rule1')
    })

    it('应该能删除规则', () => {
      engine.addRule({
        id: 'rule1',
        name: 'Test Rule',
        type: 'error_rate',
        condition: {
          metric: 'test',
          operator: '>',
          threshold: 0,
        },
        channels: [],
      })

      engine.deleteRule('rule1')

      const rules = engine.getRules()
      expect(rules).toHaveLength(0)
    })
  })

  describe('指标更新和告警', () => {
    it('应该在条件满足时触发告警', () => {
      const callback = vi.fn()

      engine.addRule({
        id: 'rule1',
        name: 'High Error Rate',
        type: 'error_rate',
        condition: {
          metric: 'error_rate',
          operator: '>',
          threshold: 0.05,
        },
        channels: ['email'],
      })

      engine.onAlert(callback)

      // 更新指标，超过阈值
      engine.updateMetric('error_rate', 0.08)

      expect(callback).toHaveBeenCalled()
      const alert = callback.mock.calls[0][0]
      expect(alert.ruleId).toBe('rule1')
      expect(alert.value).toBe(0.08)
      expect(alert.threshold).toBe(0.05)
    })

    it('应该在条件不满足时不触发告警', () => {
      const callback = vi.fn()

      engine.addRule({
        id: 'rule1',
        name: 'High Error Rate',
        type: 'error_rate',
        condition: {
          metric: 'error_rate',
          operator: '>',
          threshold: 0.05,
        },
        channels: [],
      })

      engine.onAlert(callback)

      // 更新指标，未超过阈值
      engine.updateMetric('error_rate', 0.03)

      expect(callback).not.toHaveBeenCalled()
    })

    it('应该支持不同的操作符', () => {
      const callback = vi.fn()
      engine.onAlert(callback)

      // < 操作符
      engine.addRule({
        id: 'rule-lt',
        name: 'Low Performance',
        type: 'performance',
        condition: {
          metric: 'lcp',
          operator: '<',
          threshold: 1000,
        },
        channels: [],
      })

      engine.updateMetric('lcp', 500)
      expect(callback).toHaveBeenCalled()

      callback.mockClear()

      // >= 操作符
      engine.addRule({
        id: 'rule-gte',
        name: 'Min Threshold',
        type: 'custom',
        condition: {
          metric: 'custom',
          operator: '>=',
          threshold: 100,
        },
        channels: [],
      })

      engine.updateMetric('custom', 100)
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('告警节流', () => {
    it('应该在节流期内不重复告警', async () => {
      const callback = vi.fn()

      engine.addRule({
        id: 'rule1',
        name: 'Test Rule',
        type: 'error_rate',
        condition: {
          metric: 'test',
          operator: '>',
          threshold: 0,
        },
        channels: [],
        throttle: 100, // 100ms 节流
      })

      engine.onAlert(callback)

      // 第一次触发
      engine.updateMetric('test', 1)
      expect(callback).toHaveBeenCalledTimes(1)

      // 立即再次触发（应该被节流）
      engine.updateMetric('test', 2)
      expect(callback).toHaveBeenCalledTimes(1)

      // 等待节流时间后再次触发
      await sleep(150)
      engine.updateMetric('test', 3)
      expect(callback).toHaveBeenCalledTimes(2)
    })
  })

  describe('严重程度判断', () => {
    it('应该正确判断严重程度', () => {
      const callback = vi.fn()

      engine.addRule({
        id: 'rule1',
        name: 'Test Rule',
        type: 'error_rate',
        condition: {
          metric: 'test',
          operator: '>',
          threshold: 100,
        },
        channels: [],
      })

      engine.onAlert(callback)

      // Critical (ratio > 1.0)
      engine.updateMetric('test', 250)
      expect(callback.mock.calls[0][0].severity).toBe('critical')

      callback.mockClear()

      // High (ratio > 0.5)
      engine.updateMetric('test', 180)
      expect(callback.mock.calls[0][0].severity).toBe('high')

      callback.mockClear()

      // Medium (ratio > 0.2)
      engine.updateMetric('test', 130)
      expect(callback.mock.calls[0][0].severity).toBe('medium')

      callback.mockClear()

      // Low (ratio <= 0.2)
      engine.updateMetric('test', 110)
      expect(callback.mock.calls[0][0].severity).toBe('low')
    })
  })
})


















