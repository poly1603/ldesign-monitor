/**
 * 漏斗分析器测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FunnelAnalyzer } from '../funnel/FunnelAnalyzer'

describe('FunnelAnalyzer', () => {
  let analyzer: FunnelAnalyzer

  beforeEach(() => {
    analyzer = new FunnelAnalyzer()
  })

  describe('漏斗定义', () => {
    it('应该能定义漏斗', () => {
      analyzer.defineFunnel({
        id: 'test-funnel',
        name: 'Test Funnel',
        steps: [
          { name: 'Step 1', event: 'event1' },
          { name: 'Step 2', event: 'event2' },
        ],
      })

      const funnels = analyzer.getFunnels()
      expect(funnels).toHaveLength(1)
      expect(funnels[0].id).toBe('test-funnel')
    })

    it('应该能删除漏斗', () => {
      analyzer.defineFunnel({
        id: 'test-funnel',
        name: 'Test Funnel',
        steps: [],
      })

      analyzer.deleteFunnel('test-funnel')

      const funnels = analyzer.getFunnels()
      expect(funnels).toHaveLength(0)
    })
  })

  describe('事件追踪', () => {
    beforeEach(() => {
      analyzer.defineFunnel({
        id: 'purchase',
        name: 'Purchase Funnel',
        steps: [
          { name: 'View', event: 'view' },
          { name: 'Add to Cart', event: 'add' },
          { name: 'Checkout', event: 'checkout' },
          { name: 'Purchase', event: 'purchase' },
        ],
      })
    })

    it('应该记录用户事件', () => {
      analyzer.trackEvent('user1', 'view', 1000)
      analyzer.trackEvent('user1', 'add', 2000)

      const result = analyzer.analyze('purchase')
      expect(result).toBeDefined()
    })

    it('应该正确计算转化率', () => {
      // User 1: 完整流程
      analyzer.trackEvent('user1', 'view', 1000)
      analyzer.trackEvent('user1', 'add', 2000)
      analyzer.trackEvent('user1', 'checkout', 3000)
      analyzer.trackEvent('user1', 'purchase', 4000)

      // User 2: 只完成前两步
      analyzer.trackEvent('user2', 'view', 1000)
      analyzer.trackEvent('user2', 'add', 2000)

      // User 3: 只完成第一步
      analyzer.trackEvent('user3', 'view', 1000)

      const result = analyzer.analyze('purchase')!

      expect(result.totalUsers).toBe(3) // 第一步 3 个用户
      expect(result.steps[0].count).toBe(3) // View: 3
      expect(result.steps[1].count).toBe(2) // Add: 2
      expect(result.steps[2].count).toBe(1) // Checkout: 1
      expect(result.steps[3].count).toBe(1) // Purchase: 1

      // 总转化率应该是 1/3 = 33.33%
      expect(result.totalConversionRate).toBeCloseTo(0.333, 2)
    })

    it('应该处理时间窗口', () => {
      const funnel = {
        id: 'short-window',
        name: 'Short Window',
        steps: [
          { name: 'Step 1', event: 'event1' },
          { name: 'Step 2', event: 'event2' },
        ],
        timeWindow: 1000, // 1 秒
      }

      analyzer.defineFunnel(funnel)

      // 用户在时间窗口内完成
      analyzer.trackEvent('user1', 'event1', 1000)
      analyzer.trackEvent('user1', 'event2', 1500)

      // 用户超出时间窗口
      analyzer.trackEvent('user2', 'event1', 1000)
      analyzer.trackEvent('user2', 'event2', 3000) // 超时

      const result = analyzer.analyze('short-window')!

      expect(result.steps[0].count).toBe(2) // 两个用户都完成第一步
      expect(result.steps[1].count).toBe(1) // 只有一个用户在时间窗口内完成
    })
  })

  describe('转化率计算', () => {
    beforeEach(() => {
      analyzer.defineFunnel({
        id: 'test',
        name: 'Test',
        steps: [
          { name: 'A', event: 'a' },
          { name: 'B', event: 'b' },
          { name: 'C', event: 'c' },
        ],
      })
    })

    it('应该正确计算相对转化率', () => {
      analyzer.trackEvent('user1', 'a', 1000)
      analyzer.trackEvent('user1', 'b', 2000)
      analyzer.trackEvent('user1', 'c', 3000)

      analyzer.trackEvent('user2', 'a', 1000)
      analyzer.trackEvent('user2', 'b', 2000)

      analyzer.trackEvent('user3', 'a', 1000)

      const result = analyzer.analyze('test')!

      // A -> B: 2/3 = 66.67%
      expect(result.steps[1].conversionRate).toBeCloseTo(0.667, 2)

      // B -> C: 1/2 = 50%
      expect(result.steps[2].conversionRate).toBeCloseTo(0.5, 2)
    })

    it('应该正确计算累计转化率', () => {
      analyzer.trackEvent('user1', 'a', 1000)
      analyzer.trackEvent('user1', 'b', 2000)
      analyzer.trackEvent('user1', 'c', 3000)

      analyzer.trackEvent('user2', 'a', 1000)

      const result = analyzer.analyze('test')!

      // A 的累计转化率应该是 100%
      expect(result.steps[0].cumulativeConversionRate).toBe(1)

      // B 的累计转化率应该是 50%
      expect(result.steps[1].cumulativeConversionRate).toBe(0.5)

      // C 的累计转化率应该是 50%
      expect(result.steps[2].cumulativeConversionRate).toBe(0.5)
    })
  })
})




















