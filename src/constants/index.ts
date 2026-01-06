/**
 * @ldesign/monitor - 常量定义
 * @packageDocumentation
 */

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  /** 默认采样率 */
  SAMPLE_RATE: 1.0,
  /** 默认环境 */
  ENVIRONMENT: 'production',
  /** 默认批量大小 */
  BATCH_SIZE: 10,
  /** 默认批量间隔（毫秒） */
  BATCH_INTERVAL: 5000,
  /** 默认最大队列大小 */
  MAX_QUEUE_SIZE: 100,
  /** 默认最大重试次数 */
  MAX_RETRIES: 3,
  /** 默认重试延迟（毫秒） */
  RETRY_DELAY: 1000,
  /** 默认超时时间（毫秒） */
  TIMEOUT: 5000,
  /** 默认面包屑最大数量 */
  MAX_BREADCRUMBS: 50,
} as const

/**
 * 性能阈值常量
 */
export const PERFORMANCE_THRESHOLDS = {
  /** FCP 良好阈值（毫秒） */
  FCP_GOOD: 1800,
  /** FCP 需要改进阈值（毫秒） */
  FCP_NEEDS_IMPROVEMENT: 3000,
  /** LCP 良好阈值（毫秒） */
  LCP_GOOD: 2500,
  /** LCP 需要改进阈值（毫秒） */
  LCP_NEEDS_IMPROVEMENT: 4000,
  /** FID 良好阈值（毫秒） */
  FID_GOOD: 100,
  /** FID 需要改进阈值（毫秒） */
  FID_NEEDS_IMPROVEMENT: 300,
  /** CLS 良好阈值 */
  CLS_GOOD: 0.1,
  /** CLS 需要改进阈值 */
  CLS_NEEDS_IMPROVEMENT: 0.25,
  /** TTFB 良好阈值（毫秒） */
  TTFB_GOOD: 800,
  /** TTFB 需要改进阈值（毫秒） */
  TTFB_NEEDS_IMPROVEMENT: 1800,
  /** INP 良好阈值（毫秒） */
  INP_GOOD: 200,
  /** INP 需要改进阈值（毫秒） */
  INP_NEEDS_IMPROVEMENT: 500,
  /** Long Task 阈值（毫秒） */
  LONG_TASK_THRESHOLD: 50,
  /** 低 FPS 阈值 */
  LOW_FPS_THRESHOLD: 30,
  /** FPS 冻结阈值 */
  FREEZE_FPS_THRESHOLD: 20,
} as const

/**
 * 内存阈值常量（字节）
 */
export const MEMORY_THRESHOLDS = {
  /** 警告阈值 (100MB) */
  WARNING: 100 * 1024 * 1024,
  /** 危险阈值 (200MB) */
  DANGER: 200 * 1024 * 1024,
  /** 严重阈值 (500MB) */
  CRITICAL: 500 * 1024 * 1024,
} as const

/**
 * 重试策略常量
 */
export const RETRY_CONFIG = {
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 基础延迟（毫秒） */
  BASE_DELAY: 1000,
  /** 退避因子 */
  BACKOFF_FACTOR: 2,
  /** 最大延迟（毫秒） */
  MAX_DELAY: 30000,
  /** 抖动因子 */
  JITTER_FACTOR: 0.1,
} as const

/**
 * 事件名称常量
 */
export const EVENT_NAMES = {
  // 生命周期事件
  INIT: 'init',
  DESTROY: 'destroy',
  ENABLE: 'enable',
  DISABLE: 'disable',
  
  // 数据事件
  REPORT: 'report',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  BEHAVIOR: 'behavior',
  EVENT: 'event',
  
  // 用户相关
  USER: 'user',
  CONTEXT: 'context',
  BREADCRUMB: 'breadcrumb',
  
  // 增强功能事件
  ENHANCED_INIT: 'enhanced:init',
  PERFORMANCE_MARK: 'performance:mark',
  PERFORMANCE_LONGTASK: 'performance:longtask',
  PERFORMANCE_MEMORY: 'performance:memory',
  PERFORMANCE_MEMORY_LEAK: 'performance:memory-leak',
  PERFORMANCE_FPS: 'performance:fps',
  PERFORMANCE_ANALYSIS: 'performance:analysis',
  BEHAVIOR_SCROLL: 'behavior:scroll',
  BEHAVIOR_TIME: 'behavior:time',
  BEHAVIOR_ELEMENT_VISIBLE: 'behavior:element-visible',
  BEHAVIOR_ELEMENT_TIME: 'behavior:element-time',
  API_GRAPHQL: 'api:graphql',
  API_WEBSOCKET_CONNECTION: 'api:websocket-connection',
  API_WEBSOCKET_MESSAGE: 'api:websocket-message',
  API_WEBSOCKET_METRICS: 'api:websocket-metrics',
} as const

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  /** 会话 ID */
  SESSION_ID: '@ldesign/monitor:session_id',
  /** 用户 ID */
  USER_ID: '@ldesign/monitor:user_id',
  /** 离线队列 */
  OFFLINE_QUEUE: '@ldesign/monitor:offline_queue',
  /** 配置 */
  CONFIG: '@ldesign/monitor:config',
} as const

/**
 * HTTP 状态码
 */
export const HTTP_STATUS = {
  /** 成功 */
  OK: 200,
  /** 已创建 */
  CREATED: 201,
  /** 无内容 */
  NO_CONTENT: 204,
  /** 错误请求 */
  BAD_REQUEST: 400,
  /** 未授权 */
  UNAUTHORIZED: 401,
  /** 禁止访问 */
  FORBIDDEN: 403,
  /** 未找到 */
  NOT_FOUND: 404,
  /** 请求超时 */
  TIMEOUT: 408,
  /** 请求过多 */
  TOO_MANY_REQUESTS: 429,
  /** 服务器错误 */
  INTERNAL_SERVER_ERROR: 500,
  /** 服务不可用 */
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * 版本信息
 */
export const VERSION = '0.1.0'

/**
 * 包名
 */
export const PACKAGE_NAME = '@ldesign/monitor'
