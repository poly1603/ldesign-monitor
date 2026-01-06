/**
 * 工具函数测试
 */

import { describe, it, expect, vi } from 'vitest'
import {
  generateId,
  generateUUID,
  hashCode,
  formatBytes,
  formatDuration,
  safeStringify,
  deepClone,
  throttle,
  debounce,
  sleep,
} from '../utils'

describe('工具函数', () => {
  describe('generateId', () => {
    it('应该生成唯一 ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('generateUUID', () => {
    it('应该生成 UUID 格式的字符串', () => {
      const uuid = generateUUID()
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    it('应该生成不同的 UUID', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('hashCode', () => {
    it('应该返回数字哈希值', () => {
      const hash = hashCode('test')
      expect(typeof hash).toBe('number')
      expect(hash).toBeGreaterThan(0)
    })

    it('相同字符串应该返回相同哈希值', () => {
      const hash1 = hashCode('test')
      const hash2 = hashCode('test')
      expect(hash1).toBe(hash2)
    })

    it('不同字符串应该返回不同哈希值', () => {
      const hash1 = hashCode('test1')
      const hash2 = hashCode('test2')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('formatBytes', () => {
    it('应该正确格式化字节', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(1024)).toContain('KB')
      expect(formatBytes(1024 * 1024)).toContain('MB')
    })
  })

  describe('formatDuration', () => {
    it('应该正确格式化时长', () => {
      expect(formatDuration(100)).toContain('ms')
      expect(formatDuration(1000)).toContain('s')
      expect(formatDuration(60000)).toContain('min')
    })
  })

  describe('safeStringify', () => {
    it('应该安全序列化对象', () => {
      const obj = { name: 'test', value: 123 }
      const str = safeStringify(obj)
      expect(str).toBe('{"name":"test","value":123}')
    })

    it('应该处理错误', () => {
      const result = safeStringify(undefined)
      expect(typeof result).toBe('string')
    })
  })

  describe('deepClone', () => {
    it('应该深度克隆对象', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = deepClone(obj)
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
    })

    it('应该克隆数组', () => {
      const arr = [1, 2, [3, 4]]
      const cloned = deepClone(arr)
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
    })

    it('应该克隆 Date', () => {
      const date = new Date()
      const cloned = deepClone(date)
      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
    })
  })

  describe('throttle', () => {
    it('应该节流函数调用', async () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)

      await sleep(150)
      throttled()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('debounce', () => {
    it('应该防抖函数调用', async () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()

      expect(fn).not.toHaveBeenCalled()

      await sleep(150)

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('sleep', () => {
    it('应该等待指定时间', async () => {
      const start = Date.now()
      await sleep(100)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(90)
    })
  })
})





























