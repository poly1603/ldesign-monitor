/**
 * AI 异常检测器测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AnomalyDetector } from '../ai/AnomalyDetector'

describe('AnomalyDetector', () => {
  let detector: AnomalyDetector

  beforeEach(() => {
    detector = new AnomalyDetector()
  })

  describe('异常检测', () => {
    it('应该在数据不足时不报告异常', () => {
      const result = detector.detect({
        timestamp: Date.now(),
        value: 100,
      })

      expect(result.isAnomaly).toBe(false)
      expect(result.confidence).toBe(0)
    })

    it('应该检测到突增（spike）', () => {
      // 添加正常数据
      for (let i = 0; i < 20; i++) {
        detector.detect({
          timestamp: Date.now() + i,
          value: 100 + Math.random() * 10, // 100 ± 5
        })
      }

      // 添加异常高值
      const result = detector.detect({
        timestamp: Date.now() + 21,
        value: 500, // 远高于平均值
      })

      expect(result.isAnomaly).toBe(true)
      expect(result.type).toBe('spike')
      expect(result.score).toBeGreaterThan(0)
    })

    it('应该检测到骤降（drop）', () => {
      // 添加正常数据
      for (let i = 0; i < 20; i++) {
        detector.detect({
          timestamp: Date.now() + i,
          value: 100 + Math.random() * 10,
        })
      }

      // 添加异常低值
      const result = detector.detect({
        timestamp: Date.now() + 21,
        value: 10, // 远低于平均值
      })

      expect(result.isAnomaly).toBe(true)
      expect(result.type).toBe('drop')
    })

    it('应该在正常数据时不报告异常', () => {
      // 添加正常数据
      for (let i = 0; i < 30; i++) {
        const result = detector.detect({
          timestamp: Date.now() + i,
          value: 100 + Math.random() * 10,
        })

        // 前10个数据点置信度不足，之后应该都是正常的
        if (i >= 10) {
          expect(result.isAnomaly).toBe(false)
        }
      }
    })

    it('置信度应该随着数据增加而提高', () => {
      const confidences: number[] = []

      for (let i = 0; i < 100; i++) {
        const result = detector.detect({
          timestamp: Date.now() + i,
          value: 100,
        })
        confidences.push(result.confidence)
      }

      // 置信度应该递增
      expect(confidences[10]).toBeLessThan(confidences[50])
      expect(confidences[50]).toBeLessThan(confidences[99])
      expect(confidences[99]).toBe(1.0) // 达到最大置信度
    })
  })

  describe('重置', () => {
    it('应该能重置检测器', () => {
      // 添加数据
      for (let i = 0; i < 20; i++) {
        detector.detect({
          timestamp: Date.now() + i,
          value: 100,
        })
      }

      // 重置
      detector.reset()

      // 重置后应该像新检测器一样
      const result = detector.detect({
        timestamp: Date.now(),
        value: 100,
      })

      expect(result.confidence).toBe(0)
    })
  })
})



