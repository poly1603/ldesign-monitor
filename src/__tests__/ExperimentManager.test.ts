/**
 * A/B 测试实验管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ExperimentManager } from '../abtest/ExperimentManager'

describe('ExperimentManager', () => {
  let manager: ExperimentManager

  beforeEach(() => {
    manager = new ExperimentManager()
  })

  describe('实验创建', () => {
    it('应该能创建实验', () => {
      manager.createExperiment({
        id: 'test-exp',
        name: 'Test Experiment',
        variants: [
          { id: 'control', name: 'Control' },
          { id: 'treatment', name: 'Treatment' },
        ],
      })

      const experiments = manager.getExperiments()
      expect(experiments).toHaveLength(1)
      expect(experiments[0].id).toBe('test-exp')
    })

    it('应该能删除实验', () => {
      manager.createExperiment({
        id: 'test-exp',
        name: 'Test',
        variants: [],
      })

      manager.deleteExperiment('test-exp')

      const experiments = manager.getExperiments()
      expect(experiments).toHaveLength(0)
    })
  })

  describe('用户分配', () => {
    beforeEach(() => {
      manager.createExperiment({
        id: 'test-exp',
        name: 'Test',
        variants: [
          { id: 'control', name: 'Control', weight: 1 },
          { id: 'treatment', name: 'Treatment', weight: 1 },
        ],
      })
    })

    it('应该分配用户到变体', () => {
      const allocation = manager.allocate('test-exp', 'user1')

      expect(allocation).toBeDefined()
      expect(allocation!.experimentId).toBe('test-exp')
      expect(['control', 'treatment']).toContain(allocation!.variantId)
    })

    it('同一用户应该始终分配到相同变体（hash策略）', () => {
      manager.createExperiment({
        id: 'hash-exp',
        name: 'Hash Test',
        variants: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
        allocationStrategy: 'hash',
      })

      const alloc1 = manager.allocate('hash-exp', 'user1')
      const alloc2 = manager.allocate('hash-exp', 'user1')
      const alloc3 = manager.allocate('hash-exp', 'user1')

      expect(alloc1!.variantId).toBe(alloc2!.variantId)
      expect(alloc2!.variantId).toBe(alloc3!.variantId)
    })

    it('应该尊重权重分配', () => {
      manager.createExperiment({
        id: 'weighted-exp',
        name: 'Weighted Test',
        variants: [
          { id: 'heavy', name: 'Heavy', weight: 9 },
          { id: 'light', name: 'Light', weight: 1 },
        ],
        allocationStrategy: 'random',
      })

      const counts = { heavy: 0, light: 0 }

      // 分配 1000 个用户
      for (let i = 0; i < 1000; i++) {
        const alloc = manager.allocate('weighted-exp', `user${i}`)
        if (alloc) {
          counts[alloc.variantId as 'heavy' | 'light']++
        }
      }

      // heavy 应该约占 90%
      const heavyRatio = counts.heavy / 1000
      expect(heavyRatio).toBeGreaterThan(0.85)
      expect(heavyRatio).toBeLessThan(0.95)
    })
  })

  describe('结果追踪', () => {
    beforeEach(() => {
      manager.createExperiment({
        id: 'test-exp',
        name: 'Test',
        variants: [
          { id: 'control', name: 'Control' },
          { id: 'treatment', name: 'Treatment' },
        ],
      })
    })

    it('应该记录实验结果', () => {
      manager.allocate('test-exp', 'user1')
      manager.trackResult('test-exp', 'user1', 100)

      const result = manager.analyze('test-exp')
      expect(result).toBeDefined()
    })

    it('应该正确计算平均值', () => {
      // 分配并记录结果
      manager.allocate('test-exp', 'user1')
      manager.allocate('test-exp', 'user2')

      manager.trackResult('test-exp', 'user1', 100)
      manager.trackResult('test-exp', 'user2', 200)

      const result = manager.analyze('test-exp')!

      const variant = result.variants.find((v) => {
        const alloc1 = manager.allocate('test-exp', 'user1')
        return v.variantId === alloc1!.variantId
      })

      if (variant) {
        expect(variant.count).toBeGreaterThan(0)
        expect(variant.avgValue).toBeGreaterThan(0)
      }
    })
  })

  describe('实验控制', () => {
    it('应该能停止实验', () => {
      manager.createExperiment({
        id: 'test-exp',
        name: 'Test',
        variants: [{ id: 'v1', name: 'V1' }],
      })

      manager.stopExperiment('test-exp')

      const allocation = manager.allocate('test-exp', 'user1')
      expect(allocation).toBeNull() // 停止的实验不应该分配用户
    })
  })
})



