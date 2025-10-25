/**
 * Monitor 核心类测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Monitor, createMonitor } from '../core/Monitor'

describe('Monitor', () => {
  let monitor: Monitor

  beforeEach(() => {
    monitor = createMonitor({
      dsn: 'https://test.com/api/monitor',
      projectId: 'test-project',
      environment: 'test',
      debug: false,
    })
  })

  describe('初始化', () => {
    it('应该正确创建 Monitor 实例', () => {
      expect(monitor).toBeInstanceOf(Monitor)
    })

    it('应该返回正确的配置', () => {
      const config = monitor.getConfig()
      expect(config.projectId).toBe('test-project')
      expect(config.environment).toBe('test')
    })

    it('应该生成会话 ID', () => {
      const config = monitor.getConfig()
      expect(config).toBeDefined()
    })
  })

  describe('性能追踪', () => {
    it('应该追踪性能指标', () => {
      const spy = vi.fn()
      monitor.on('performance', spy)

      monitor.trackPerformance('custom-metric', 1234)

      expect(spy).toHaveBeenCalled()
      const data = spy.mock.calls[0][0]
      expect(data.type).toBe('performance')
      expect(data.data.name).toBe('custom-metric')
      expect(data.data.value).toBe(1234)
    })

    it('应该在禁用时不追踪', () => {
      const spy = vi.fn()
      monitor.on('performance', spy)

      monitor.disable()
      monitor.trackPerformance('test', 100)

      expect(spy).not.toHaveBeenCalled()

      monitor.enable()
      monitor.trackPerformance('test', 100)

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('错误追踪', () => {
    it('应该追踪错误', () => {
      const spy = vi.fn()
      monitor.on('error', spy)

      const error = new Error('Test error')
      monitor.trackError(error)

      expect(spy).toHaveBeenCalled()
      const data = spy.mock.calls[0][0]
      expect(data.type).toBe('error')
      expect(data.data.message).toBe('Test error')
    })

    it('应该包含错误上下文', () => {
      const spy = vi.fn()
      monitor.on('error', spy)

      const error = new Error('Test error')
      monitor.trackError(error, { action: 'button-click' })

      expect(spy).toHaveBeenCalled()
      const data = spy.mock.calls[0][0]
      expect(data.data.action).toBe('button-click')
    })
  })

  describe('事件追踪', () => {
    it('应该追踪自定义事件', () => {
      const spy = vi.fn()
      monitor.on('event', spy)

      monitor.trackEvent('button-click', { buttonId: 'submit' })

      expect(spy).toHaveBeenCalled()
      const data = spy.mock.calls[0][0]
      expect(data.type).toBe('behavior')
      expect(data.data.name).toBe('button-click')
      expect(data.data.properties.buttonId).toBe('submit')
    })
  })

  describe('页面浏览', () => {
    it('应该追踪页面浏览', () => {
      const spy = vi.fn()
      monitor.on('event', spy)

      monitor.trackPageView('/dashboard')

      expect(spy).toHaveBeenCalled()
    })

    it('应该添加面包屑', () => {
      const spy = vi.fn()
      monitor.on('breadcrumb', spy)

      monitor.trackPageView('/dashboard')

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('用户管理', () => {
    it('应该设置用户信息', () => {
      const spy = vi.fn()
      monitor.on('user', spy)

      monitor.setUser({
        id: 'user-123',
        name: 'John Doe',
      })

      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0].id).toBe('user-123')
    })
  })

  describe('上下文管理', () => {
    it('应该设置上下文', () => {
      const spy = vi.fn()
      monitor.on('context', spy)

      monitor.setContext({ page: 'dashboard' })

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('面包屑', () => {
    it('应该添加面包屑', () => {
      const spy = vi.fn()
      monitor.on('breadcrumb', spy)

      monitor.addBreadcrumb({
        type: 'navigation',
        message: 'Test breadcrumb',
        timestamp: Date.now(),
      })

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('启用/禁用', () => {
    it('应该能启用和禁用', () => {
      const spyEnable = vi.fn()
      const spyDisable = vi.fn()

      monitor.on('enable', spyEnable)
      monitor.on('disable', spyDisable)

      monitor.disable()
      expect(spyDisable).toHaveBeenCalled()

      monitor.enable()
      expect(spyEnable).toHaveBeenCalled()
    })
  })

  describe('Hook 系统', () => {
    it('应该调用 afterPerformance hook', () => {
      const hookSpy = vi.fn()

      const m = createMonitor({
        dsn: 'https://test.com',
        projectId: 'test',
        hooks: {
          afterPerformance: hookSpy,
        },
      })

      m.trackPerformance('test', 100)

      expect(hookSpy).toHaveBeenCalled()
    })

    it('应该调用 afterError hook', () => {
      const hookSpy = vi.fn()

      const m = createMonitor({
        dsn: 'https://test.com',
        projectId: 'test',
        hooks: {
          afterError: hookSpy,
        },
      })

      m.trackError(new Error('Test'))

      expect(hookSpy).toHaveBeenCalled()
    })

    it('beforeSend hook 可以拦截数据', () => {
      const reportSpy = vi.fn()

      const m = createMonitor({
        dsn: 'https://test.com',
        projectId: 'test',
        hooks: {
          beforeSend: () => null, // 拦截所有数据
        },
      })

      m.on('report', reportSpy)
      m.trackPerformance('test', 100)

      // beforeSend 返回 null，所以不应该触发 report 事件
      expect(reportSpy).not.toHaveBeenCalled()
    })
  })

  describe('采样控制', () => {
    it('应该根据采样率丢弃数据', () => {
      const spy = vi.fn()

      // 0% 采样率
      const m = createMonitor({
        dsn: 'https://test.com',
        projectId: 'test',
        sampleRate: 0,
      })

      m.on('performance', spy)
      m.trackPerformance('test', 100)

      expect(spy).not.toHaveBeenCalled()
    })

    it('应该在 100% 采样率时追踪所有数据', () => {
      const spy = vi.fn()

      const m = createMonitor({
        dsn: 'https://test.com',
        projectId: 'test',
        sampleRate: 1.0,
      })

      m.on('performance', spy)
      m.trackPerformance('test', 100)

      expect(spy).toHaveBeenCalled()
    })
  })
})


















