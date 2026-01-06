/**
 * @ldesign/monitor - 监控系统
 * 
 * 完整的前端监控解决方案，包括性能监控、错误追踪、用户行为分析、API监控等
 * 
 * @packageDocumentation
 */

// ============ 导出核心类 ============
export { Monitor, createMonitor } from './core/Monitor'
export { EnhancedMonitor, createEnhancedMonitor } from './core/EnhancedMonitor'
export { EventEmitter, TypedEventEmitter } from './core/EventEmitter'
export type { EventHandler, EventMap, Unsubscribe } from './core/EventEmitter'

// ============ 导出类型 ============
export type * from './types'

// ============ 导出收集器模块 ============
export * from './collectors'

// ============ 导出上报模块 ============
export * from './reporter'

// ============ 导出框架集成 ============
export * from './integrations'

// ============ 导出工具函数 ============
export * from './utils'

// ============ 导出配置模块 ============
export * from './config'

// ============ 导出常量 ============
export * from './constants'

// ============ 导出错误类 ============
export * from './errors'

// ============ 导出插件系统 ============
export * from './plugins'

// ============ 导出中间件系统 ============
export * from './middleware'

// ============ 导出弹性组件 ============
export * from './resilience'

// ============ 导出存储模块 ============
export * from './storage'

// ============ 版本信息 ============
export { VERSION, PACKAGE_NAME } from './constants'
