/**
 * @ldesign/monitor - 中间件系统
 * 
 * 提供数据处理管道，支持对上报数据进行链式处理
 * @packageDocumentation
 */

import type { ReportData } from '../types'

/**
 * 中间件上下文
 * 在中间件之间传递的共享状态
 */
export interface MiddlewareContext {
  /** 原始数据 */
  readonly originalData: ReportData
  /** 当前处理的数据 */
  data: ReportData
  /** 是否已中止处理 */
  aborted: boolean
  /** 中止原因 */
  abortReason?: string
  /** 自定义元数据 */
  metadata: Record<string, unknown>
  /** 开始处理时间 */
  readonly startTime: number
}

/**
 * Next 函数类型
 * 调用下一个中间件
 */
export type NextFunction = () => Promise<void> | void

/**
 * 中间件函数类型
 */
export type MiddlewareFunction = (
  ctx: MiddlewareContext,
  next: NextFunction
) => Promise<void> | void

/**
 * 中间件接口
 */
export interface Middleware {
  /** 中间件名称 */
  readonly name: string
  /** 中间件优先级（数字越小优先级越高） */
  readonly priority?: number
  /** 处理函数 */
  handler: MiddlewareFunction
}

/**
 * 中间件管理器配置
 */
export interface MiddlewareManagerConfig {
  /** 是否启用调试日志 */
  debug?: boolean
  /** 超时时间（毫秒） */
  timeout?: number
  /** 错误处理策略 */
  errorStrategy?: 'continue' | 'abort' | 'throw'
}

/**
 * 中间件执行结果
 */
export interface MiddlewareResult {
  /** 是否成功 */
  success: boolean
  /** 处理后的数据 */
  data: ReportData | null
  /** 是否被中止 */
  aborted: boolean
  /** 中止原因 */
  abortReason?: string
  /** 执行耗时（毫秒） */
  duration: number
  /** 执行的中间件列表 */
  executedMiddlewares: string[]
  /** 错误信息（如果有） */
  errors: Array<{ middleware: string; error: Error }>
}

/**
 * 中间件管理器
 * 管理和执行数据处理中间件链
 * 
 * @example
 * ```typescript
 * const manager = new MiddlewareManager()
 * 
 * // 添加数据脱敏中间件
 * manager.use({
 *   name: 'data-masking',
 *   handler: async (ctx, next) => {
 *     ctx.data = maskSensitiveData(ctx.data)
 *     await next()
 *   }
 * })
 * 
 * // 添加数据验证中间件
 * manager.use({
 *   name: 'validation',
 *   handler: (ctx, next) => {
 *     if (!isValidData(ctx.data)) {
 *       ctx.aborted = true
 *       ctx.abortReason = 'Invalid data'
 *       return
 *     }
 *     next()
 *   }
 * })
 * 
 * // 执行中间件链
 * const result = await manager.execute(reportData)
 * ```
 */
export class MiddlewareManager {
  /** 中间件列表 */
  private readonly middlewares: Middleware[] = []
  /** 配置 */
  private readonly config: Required<MiddlewareManagerConfig>

  constructor(config: MiddlewareManagerConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      timeout: config.timeout ?? 30000,
      errorStrategy: config.errorStrategy ?? 'continue',
    }
  }

  /**
   * 添加中间件
   * 
   * @param middleware - 中间件实例或处理函数
   * @returns this，支持链式调用
   */
  use(middleware: Middleware | MiddlewareFunction): this {
    const mw: Middleware = typeof middleware === 'function'
      ? { name: `middleware-${this.middlewares.length}`, handler: middleware }
      : middleware

    // 检查重复
    if (this.middlewares.some(m => m.name === mw.name)) {
      console.warn(`[MiddlewareManager] Middleware "${mw.name}" already exists, skipping`)
      return this
    }

    this.middlewares.push(mw)
    // 按优先级排序
    this.middlewares.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))

    if (this.config.debug) {
      console.log(`[MiddlewareManager] Added middleware "${mw.name}"`)
    }

    return this
  }

  /**
   * 移除中间件
   * 
   * @param name - 中间件名称
   */
  remove(name: string): boolean {
    const index = this.middlewares.findIndex(m => m.name === name)
    if (index !== -1) {
      this.middlewares.splice(index, 1)
      if (this.config.debug) {
        console.log(`[MiddlewareManager] Removed middleware "${name}"`)
      }
      return true
    }
    return false
  }

  /**
   * 执行中间件链
   * 
   * @param data - 要处理的数据
   * @returns 处理结果
   */
  async execute(data: ReportData): Promise<MiddlewareResult> {
    const startTime = Date.now()
    const executedMiddlewares: string[] = []
    const errors: Array<{ middleware: string; error: Error }> = []

    // 创建上下文
    const ctx: MiddlewareContext = {
      originalData: { ...data },
      data: { ...data },
      aborted: false,
      metadata: {},
      startTime,
    }

    // 构建中间件链
    let index = 0

    const executeNext = async (): Promise<void> => {
      if (ctx.aborted) {
        return
      }

      if (index >= this.middlewares.length) {
        return
      }

      const middleware = this.middlewares[index]
      index++

      if (this.config.debug) {
        console.log(`[MiddlewareManager] Executing middleware "${middleware.name}"`)
      }

      try {
        // 设置超时
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Middleware "${middleware.name}" timed out after ${this.config.timeout}ms`))
          }, this.config.timeout)
        })

        await Promise.race([
          Promise.resolve(middleware.handler(ctx, executeNext)),
          timeoutPromise,
        ])

        executedMiddlewares.push(middleware.name)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errors.push({ middleware: middleware.name, error: err })

        if (this.config.debug) {
          console.error(`[MiddlewareManager] Error in middleware "${middleware.name}":`, error)
        }

        switch (this.config.errorStrategy) {
          case 'abort':
            ctx.aborted = true
            ctx.abortReason = `Error in middleware "${middleware.name}": ${err.message}`
            break
          case 'throw':
            throw error
          case 'continue':
          default:
            // 继续执行下一个中间件
            await executeNext()
            break
        }
      }
    }

    // 执行中间件链
    await executeNext()

    const duration = Date.now() - startTime

    if (this.config.debug) {
      console.log(`[MiddlewareManager] Execution completed in ${duration}ms`, {
        aborted: ctx.aborted,
        executedMiddlewares,
        errors: errors.length,
      })
    }

    return {
      success: !ctx.aborted && errors.length === 0,
      data: ctx.aborted ? null : ctx.data,
      aborted: ctx.aborted,
      abortReason: ctx.abortReason,
      duration,
      executedMiddlewares,
      errors,
    }
  }

  /**
   * 获取所有中间件名称
   */
  getMiddlewareNames(): string[] {
    return this.middlewares.map(m => m.name)
  }

  /**
   * 获取中间件数量
   */
  get count(): number {
    return this.middlewares.length
  }

  /**
   * 清空所有中间件
   */
  clear(): void {
    this.middlewares.length = 0
  }
}

// ============ 内置中间件 ============

/**
 * 数据脱敏中间件
 * 自动脱敏敏感数据
 * 
 * @param options - 脱敏选项
 */
export function dataMaskingMiddleware(options: {
  /** 需要脱敏的字段名模式 */
  patterns?: RegExp[]
  /** 自定义脱敏函数 */
  maskFn?: (value: unknown, key: string) => unknown
} = {}): Middleware {
  const defaultPatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /api[_-]?key/i,
    /credit[_-]?card/i,
    /ssn/i,
    /phone/i,
    /email/i,
  ]

  const patterns = options.patterns ?? defaultPatterns

  const maskValue = options.maskFn ?? ((value: unknown, _key: string): unknown => {
    if (typeof value === 'string') {
      if (value.length <= 4) return '***'
      return value.substring(0, 2) + '***' + value.substring(value.length - 2)
    }
    return '***'
  })

  const maskObject = (obj: unknown, path: string = ''): unknown => {
    if (obj === null || obj === undefined) return obj

    if (typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => maskObject(item, `${path}[${index}]`))
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const fullPath = path ? `${path}.${key}` : key
      const shouldMask = patterns.some(pattern => pattern.test(key))
      
      if (shouldMask) {
        result[key] = maskValue(value, key)
      } else if (typeof value === 'object') {
        result[key] = maskObject(value, fullPath)
      } else {
        result[key] = value
      }
    }

    return result
  }

  return {
    name: 'data-masking',
    priority: 10,
    handler: (ctx, next) => {
      ctx.data = maskObject(ctx.data) as ReportData
      next()
    },
  }
}

/**
 * 数据过滤中间件
 * 根据条件过滤数据
 * 
 * @param predicate - 过滤条件
 */
export function dataFilterMiddleware(
  predicate: (data: ReportData) => boolean
): Middleware {
  return {
    name: 'data-filter',
    priority: 20,
    handler: (ctx, next) => {
      if (!predicate(ctx.data)) {
        ctx.aborted = true
        ctx.abortReason = 'Data filtered out'
        return
      }
      next()
    },
  }
}

/**
 * 数据转换中间件
 * 
 * @param transformer - 转换函数
 */
export function dataTransformMiddleware(
  transformer: (data: ReportData) => ReportData
): Middleware {
  return {
    name: 'data-transform',
    priority: 50,
    handler: (ctx, next) => {
      ctx.data = transformer(ctx.data)
      next()
    },
  }
}

/**
 * 数据验证中间件
 * 
 * @param validator - 验证函数
 */
export function dataValidationMiddleware(
  validator: (data: ReportData) => boolean | string
): Middleware {
  return {
    name: 'data-validation',
    priority: 30,
    handler: (ctx, next) => {
      const result = validator(ctx.data)
      if (result === false) {
        ctx.aborted = true
        ctx.abortReason = 'Data validation failed'
        return
      }
      if (typeof result === 'string') {
        ctx.aborted = true
        ctx.abortReason = result
        return
      }
      next()
    },
  }
}

/**
 * 采样中间件
 * 根据采样率决定是否处理数据
 * 
 * @param sampleRate - 采样率 (0-1)
 */
export function samplingMiddleware(sampleRate: number): Middleware {
  return {
    name: 'sampling',
    priority: 5,
    handler: (ctx, next) => {
      if (Math.random() > sampleRate) {
        ctx.aborted = true
        ctx.abortReason = 'Sampled out'
        return
      }
      next()
    },
  }
}

/**
 * 日志中间件
 * 记录数据处理过程
 */
export function loggingMiddleware(
  logger: (message: string, data?: unknown) => void = console.log
): Middleware {
  return {
    name: 'logging',
    priority: 1,
    handler: async (ctx, next) => {
      logger('[Monitor] Processing data:', ctx.data.type)
      const startTime = Date.now()
      await next()
      const duration = Date.now() - startTime
      logger(`[Monitor] Data processed in ${duration}ms`, {
        type: ctx.data.type,
        aborted: ctx.aborted,
      })
    },
  }
}

/**
 * 创建中间件管理器
 * 
 * @param config - 配置选项
 */
export function createMiddlewareManager(config?: MiddlewareManagerConfig): MiddlewareManager {
  return new MiddlewareManager(config)
}
