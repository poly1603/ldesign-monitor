/**
 * @ldesign/monitor - 监控系统
 * 
 * 完整的前端监控解决方案，包括性能监控、错误追踪、用户行为分析、API监控等
 * 
 * @packageDocumentation
 */

// ============ 导出核心类 ============
export { Monitor, createMonitor } from './core/Monitor'
export { EventEmitter } from './core/EventEmitter'

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

// ============ 版本信息 ============
export const VERSION = '0.1.0'
