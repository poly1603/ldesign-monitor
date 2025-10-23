/**
 * Source Map 解析器
 * 用于将打包后的代码位置映射回源代码位置
 * 
 * 注意：这是一个基础接口，完整实现将在 v0.3.0 中提供
 */

import type { SourceInfo, StackFrame } from '../../types/error'

/**
 * Source Map 解析器配置
 */
export interface SourceMapResolverConfig {
  /**
   * Source Map 文件的基础 URL
   */
  baseURL?: string

  /**
   * 是否启用缓存
   * @default true
   */
  cache?: boolean
}

/**
 * Source Map 解析器类
 */
export class SourceMapResolver {
  /**
   * 配置
   */
  private config: Required<SourceMapResolverConfig>

  /**
   * Source Map 缓存
   */
  private cache: Map<string, any> = new Map()

  constructor(config: SourceMapResolverConfig = {}) {
    this.config = {
      baseURL: config.baseURL ?? '',
      cache: config.cache ?? true,
    }
  }

  /**
   * 解析堆栈帧
   * 将打包后的位置映射到源代码位置
   * 
   * @param frame - 堆栈帧
   * @returns 源代码信息
   */
  async resolve(frame: StackFrame): Promise<SourceInfo | null> {
    // TODO: 在 v0.3.0 中实现完整的 Source Map 解析
    // 这里只是一个占位符
    console.warn('[SourceMapResolver] Source Map resolution not yet implemented')
    return null
  }

  /**
   * 批量解析堆栈帧
   * 
   * @param frames - 堆栈帧数组
   * @returns 源代码信息数组
   */
  async resolveAll(frames: StackFrame[]): Promise<Array<SourceInfo | null>> {
    return Promise.all(frames.map(frame => this.resolve(frame)))
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}

/**
 * 创建 Source Map 解析器实例
 * 
 * @param config - 配置
 * @returns Source Map 解析器实例
 */
export function createSourceMapResolver(config?: SourceMapResolverConfig): SourceMapResolver {
  return new SourceMapResolver(config)
}

