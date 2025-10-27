/**
 * 错误聚合器测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ErrorAggregator } from '../error/ErrorAggregator'
import { ErrorType, ErrorLevel } from '../types/error'

describe('ErrorAggregator', () => {
  let aggregator: ErrorAggregator

  beforeEach(() => {
    aggregator = new ErrorAggregator({
      maxGroups: 10,
      maxInstances: 5,
    })
  })

  describe('错误添加', () => {
    it('应该添加错误并生成指纹', () => {
      const error = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Test error',
        timestamp: Date.now(),
      }

      const fingerprint = aggregator.add(error)

      expect(fingerprint).toBeDefined()
      expect(fingerprint).toMatch(/^error-\d+$/)
    })

    it('相同错误应该有相同指纹', () => {
      const error1 = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Test error',
        filename: 'app.js',
        lineno: 10,
        colno: 5,
        timestamp: Date.now(),
      }

      const error2 = {
        ...error1,
        timestamp: Date.now() + 1000,
      }

      const fp1 = aggregator.add(error1)
      const fp2 = aggregator.add(error2)

      expect(fp1).toBe(fp2)
    })

    it('不同错误应该有不同指纹', () => {
      const error1 = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Error 1',
        timestamp: Date.now(),
      }

      const error2 = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Error 2',
        timestamp: Date.now(),
      }

      const fp1 = aggregator.add(error1)
      const fp2 = aggregator.add(error2)

      expect(fp1).not.toBe(fp2)
    })
  })

  describe('错误分组', () => {
    it('应该正确分组相同的错误', () => {
      const error = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Test error',
        timestamp: Date.now(),
      }

      aggregator.add(error)
      aggregator.add(error)
      aggregator.add(error)

      const groups = aggregator.getAllGroups()
      expect(groups).toHaveLength(1)
      expect(groups[0].count).toBe(3)
    })

    it('应该限制错误组数量', () => {
      for (let i = 0; i < 20; i++) {
        aggregator.add({
          type: ErrorType.JS_ERROR,
          level: ErrorLevel.ERROR,
          message: `Error ${i}`,
          timestamp: Date.now(),
        })
      }

      const groups = aggregator.getAllGroups()
      expect(groups.length).toBeLessThanOrEqual(10)
    })
  })

  describe('统计信息', () => {
    it('应该返回正确的统计信息', () => {
      aggregator.add({
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Error 1',
        timestamp: Date.now(),
      })

      aggregator.add({
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Error 1',
        timestamp: Date.now(),
      })

      aggregator.add({
        type: ErrorType.PROMISE_REJECTION,
        level: ErrorLevel.ERROR,
        message: 'Error 2',
        timestamp: Date.now(),
      })

      const stats = aggregator.getStats()

      expect(stats.totalGroups).toBe(2)
      expect(stats.totalErrors).toBe(3)
      expect(stats.unresolvedGroups).toBe(2)
    })
  })

  describe('错误状态管理', () => {
    it('应该能标记错误为已解决', () => {
      const error = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Test error',
        timestamp: Date.now(),
      }

      const fp = aggregator.add(error)
      aggregator.resolve(fp)

      const group = aggregator.getGroup(fp)
      expect(group?.status).toBe('resolved')

      const stats = aggregator.getStats()
      expect(stats.resolvedGroups).toBe(1)
      expect(stats.unresolvedGroups).toBe(0)
    })

    it('应该能标记错误为已忽略', () => {
      const error = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Test error',
        timestamp: Date.now(),
      }

      const fp = aggregator.add(error)
      aggregator.ignore(fp)

      const group = aggregator.getGroup(fp)
      expect(group?.status).toBe('ignored')
    })

    it('应该能删除错误组', () => {
      const error = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Test error',
        timestamp: Date.now(),
      }

      const fp = aggregator.add(error)
      aggregator.delete(fp)

      const group = aggregator.getGroup(fp)
      expect(group).toBeUndefined()
    })
  })

  describe('排序', () => {
    it('应该能按次数排序', () => {
      const error1 = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Error 1',
        timestamp: Date.now(),
      }

      const error2 = {
        type: ErrorType.JS_ERROR,
        level: ErrorLevel.ERROR,
        message: 'Error 2',
        timestamp: Date.now(),
      }

      // Error 1 发生 3 次
      aggregator.add(error1)
      aggregator.add(error1)
      aggregator.add(error1)

      // Error 2 发生 1 次
      aggregator.add(error2)

      const sorted = aggregator.getSortedGroups('count', 'desc')
      expect(sorted[0].count).toBe(3)
      expect(sorted[1].count).toBe(1)
    })
  })
})




















