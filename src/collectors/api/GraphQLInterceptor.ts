/**
 * @ldesign/monitor - GraphQL 监控拦截器
 * 
 * 监控 GraphQL 请求的性能、错误和元数据
 */

export interface GraphQLInterceptorOptions {
  /**
   * 是否记录变量
   * @default true
   */
  logVariables?: boolean

  /**
   * 是否记录响应数据
   * @default false
   */
  logResponse?: boolean

  /**
   * 最大变量大小（字节）
   * @default 10240
   */
  maxVariableSize?: number

  /**
   * 最大响应大小（字节）
   * @default 102400
   */
  maxResponseSize?: number

  /**
   * 慢查询阈值（毫秒）
   * @default 1000
   */
  slowQueryThreshold?: number

  /**
   * 是否追踪字段使用
   * @default true
   */
  trackFieldUsage?: boolean
}

export interface GraphQLRequest {
  /**
   * 操作名称
   */
  operationName?: string

  /**
   * 查询字符串
   */
  query: string

  /**
   * 变量
   */
  variables?: Record<string, any>

  /**
   * 扩展
   */
  extensions?: Record<string, any>
}

export interface GraphQLResponse {
  /**
   * 数据
   */
  data?: any

  /**
   * 错误
   */
  errors?: GraphQLError[]

  /**
   * 扩展
   */
  extensions?: Record<string, any>
}

export interface GraphQLError {
  /**
   * 错误消息
   */
  message: string

  /**
   * 位置
   */
  locations?: Array<{ line: number; column: number }>

  /**
   * 路径
   */
  path?: Array<string | number>

  /**
   * 扩展
   */
  extensions?: Record<string, any>
}

export interface GraphQLMetrics {
  /**
   * 操作名称
   */
  operationName?: string

  /**
   * 操作类型
   */
  operationType: 'query' | 'mutation' | 'subscription' | 'unknown'

  /**
   * 查询复杂度（字段数）
   */
  complexity: number

  /**
   * 持续时间（毫秒）
   */
  duration: number

  /**
   * 请求大小（字节）
   */
  requestSize: number

  /**
   * 响应大小（字节）
   */
  responseSize: number

  /**
   * 是否成功
   */
  success: boolean

  /**
   * 错误
   */
  errors?: GraphQLError[]

  /**
   * 变量（可选）
   */
  variables?: Record<string, any>

  /**
   * 响应数据（可选）
   */
  response?: any

  /**
   * 使用的字段
   */
  fieldsUsed?: string[]

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 端点URL
   */
  endpoint: string

  /**
   * 状态码
   */
  statusCode?: number
}

export class GraphQLInterceptor {
  private options: Required<GraphQLInterceptorOptions>
  private onMetrics?: (metrics: GraphQLMetrics) => void
  private originalFetch: typeof fetch

  // 字段使用统计
  private fieldUsageMap: Map<string, number> = new Map()

  constructor(options: GraphQLInterceptorOptions = {}) {
    this.options = {
      logVariables: options.logVariables ?? true,
      logResponse: options.logResponse ?? false,
      maxVariableSize: options.maxVariableSize ?? 10240,
      maxResponseSize: options.maxResponseSize ?? 102400,
      slowQueryThreshold: options.slowQueryThreshold ?? 1000,
      trackFieldUsage: options.trackFieldUsage ?? true,
    }

    this.originalFetch = window.fetch
  }

  /**
   * 启动拦截
   */
  start(callback: (metrics: GraphQLMetrics) => void): void {
    this.onMetrics = callback
    this.interceptFetch()
  }

  /**
   * 停止拦截
   */
  stop(): void {
    window.fetch = this.originalFetch
  }

  /**
   * 获取字段使用统计
   */
  getFieldUsageStats(): Array<{ field: string; count: number }> {
    return Array.from(this.fieldUsageMap.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.fieldUsageMap.clear()
  }

  /**
   * 拦截 fetch
   */
  private interceptFetch(): void {
    const self = this

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      // 检查是否是 GraphQL 请求
      if (!self.isGraphQLRequest(input, init)) {
        return self.originalFetch(input, init)
      }

      const startTime = performance.now()
      const endpoint = typeof input === 'string' ? input : input.toString()

      try {
        // 解析请求
        const request = self.parseGraphQLRequest(init)
        const requestSize = self.calculateSize(init?.body)

        // 发送请求
        const response = await self.originalFetch(input, init)
        const responseClone = response.clone()

        // 解析响应
        const graphqlResponse: GraphQLResponse = await responseClone.json()
        const responseSize = self.calculateSize(JSON.stringify(graphqlResponse))

        const duration = performance.now() - startTime

        // 收集指标
        const metrics = self.collectMetrics(
          request,
          graphqlResponse,
          duration,
          requestSize,
          responseSize,
          endpoint,
          response.status
        )

        // 上报指标
        if (self.onMetrics) {
          self.onMetrics(metrics)
        }

        return response
      } catch (error) {
        // 错误处理
        const duration = performance.now() - startTime

        if (self.onMetrics) {
          self.onMetrics({
            operationName: 'unknown',
            operationType: 'unknown',
            complexity: 0,
            duration,
            requestSize: 0,
            responseSize: 0,
            success: false,
            errors: [{ message: (error as Error).message }],
            timestamp: Date.now(),
            endpoint,
          })
        }

        throw error
      }
    }
  }

  /**
   * 检查是否是 GraphQL 请求
   */
  private isGraphQLRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
    // 检查 URL 是否包含 graphql
    const url = typeof input === 'string' ? input : input.toString()
    if (url.includes('/graphql')) {
      return true
    }

    // 检查 Content-Type
    const contentType = init?.headers 
      ? this.getHeader(init.headers, 'content-type')
      : null

    if (contentType?.includes('application/graphql')) {
      return true
    }

    // 检查请求体
    if (init?.body && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body)
        return 'query' in body || 'mutation' in body
      } catch {
        return false
      }
    }

    return false
  }

  /**
   * 解析 GraphQL 请求
   */
  private parseGraphQLRequest(init?: RequestInit): GraphQLRequest {
    if (!init?.body) {
      return { query: '' }
    }

    try {
      const body = typeof init.body === 'string' 
        ? JSON.parse(init.body)
        : init.body

      return {
        operationName: body.operationName,
        query: body.query || '',
        variables: body.variables,
        extensions: body.extensions,
      }
    } catch {
      return { query: '' }
    }
  }

  /**
   * 收集指标
   */
  private collectMetrics(
    request: GraphQLRequest,
    response: GraphQLResponse,
    duration: number,
    requestSize: number,
    responseSize: number,
    endpoint: string,
    statusCode: number
  ): GraphQLMetrics {
    const operationType = this.parseOperationType(request.query)
    const complexity = this.calculateComplexity(request.query)
    const fieldsUsed = this.extractFields(request.query)

    // 更新字段使用统计
    if (this.options.trackFieldUsage && fieldsUsed) {
      fieldsUsed.forEach(field => {
        this.fieldUsageMap.set(field, (this.fieldUsageMap.get(field) || 0) + 1)
      })
    }

    const metrics: GraphQLMetrics = {
      operationName: request.operationName,
      operationType,
      complexity,
      duration,
      requestSize,
      responseSize,
      success: !response.errors || response.errors.length === 0,
      errors: response.errors,
      timestamp: Date.now(),
      endpoint,
      statusCode,
      fieldsUsed,
    }

    // 根据配置添加变量和响应
    if (this.options.logVariables && request.variables) {
      const variablesStr = JSON.stringify(request.variables)
      if (variablesStr.length <= this.options.maxVariableSize) {
        metrics.variables = request.variables
      }
    }

    if (this.options.logResponse && response.data) {
      const responseStr = JSON.stringify(response.data)
      if (responseStr.length <= this.options.maxResponseSize) {
        metrics.response = response.data
      }
    }

    return metrics
  }

  /**
   * 解析操作类型
   */
  private parseOperationType(query: string): 'query' | 'mutation' | 'subscription' | 'unknown' {
    const trimmed = query.trim()
    
    if (trimmed.startsWith('query') || trimmed.startsWith('{')) {
      return 'query'
    }
    if (trimmed.startsWith('mutation')) {
      return 'mutation'
    }
    if (trimmed.startsWith('subscription')) {
      return 'subscription'
    }
    
    return 'unknown'
  }

  /**
   * 计算查询复杂度（简单的字段计数）
   */
  private calculateComplexity(query: string): number {
    // 移除注释
    const withoutComments = query.replace(/#.*$/gm, '')
    
    // 计算字段选择器数量
    const fieldMatches = withoutComments.match(/\b\w+\s*(?=[\s{,)])/g)
    
    return fieldMatches ? fieldMatches.length : 0
  }

  /**
   * 提取查询中使用的字段
   */
  private extractFields(query: string): string[] | undefined {
    if (!this.options.trackFieldUsage) {
      return undefined
    }

    const fields: string[] = []
    
    // 简单的字段提取（可以根据需要改进）
    const fieldMatches = query.match(/\b(\w+)\s*(?=[{,\s])/g)
    
    if (fieldMatches) {
      const uniqueFields = Array.from(new Set(fieldMatches))
      // 过滤掉 GraphQL 关键字
      const keywords = ['query', 'mutation', 'subscription', 'fragment', 'on']
      fields.push(...uniqueFields.filter(f => !keywords.includes(f.toLowerCase())))
    }

    return fields
  }

  /**
   * 计算大小
   */
  private calculateSize(data: any): number {
    if (!data) return 0
    
    if (typeof data === 'string') {
      return new Blob([data]).size
    }
    
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      return 0
    }
  }

  /**
   * 获取请求头
   */
  private getHeader(headers: HeadersInit, name: string): string | null {
    if (headers instanceof Headers) {
      return headers.get(name)
    }
    
    if (Array.isArray(headers)) {
      const header = headers.find(([key]) => key.toLowerCase() === name.toLowerCase())
      return header ? header[1] : null
    }
    
    if (typeof headers === 'object') {
      const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase())
      return key ? (headers as any)[key] : null
    }
    
    return null
  }
}

/**
 * GraphQL 查询分析器
 */
export class GraphQLQueryAnalyzer {
  /**
   * 分析查询性能
   */
  static analyzeQuery(query: string): {
    complexity: number
    depth: number
    breadth: number
    estimatedCost: number
  } {
    const complexity = this.calculateComplexity(query)
    const depth = this.calculateDepth(query)
    const breadth = this.calculateBreadth(query)
    
    // 估算查询成本（简单的启发式）
    const estimatedCost = complexity * depth * 0.1 + breadth * 0.5

    return {
      complexity,
      depth,
      breadth,
      estimatedCost,
    }
  }

  /**
   * 计算查询深度
   */
  private static calculateDepth(query: string): number {
    let maxDepth = 0
    let currentDepth = 0

    for (const char of query) {
      if (char === '{') {
        currentDepth++
        maxDepth = Math.max(maxDepth, currentDepth)
      } else if (char === '}') {
        currentDepth--
      }
    }

    return maxDepth
  }

  /**
   * 计算查询广度
   */
  private static calculateBreadth(query: string): number {
    // 计算同一级别的最大字段数
    const lines = query.split('\n')
    let maxFields = 0

    for (const line of lines) {
      const fields = line.match(/\b\w+\s*(?=[{,\s])/g)
      if (fields) {
        maxFields = Math.max(maxFields, fields.length)
      }
    }

    return maxFields
  }

  /**
   * 计算复杂度
   */
  private static calculateComplexity(query: string): number {
    const fieldMatches = query.match(/\b\w+\s*(?=[{,\s])/g)
    return fieldMatches ? fieldMatches.length : 0
  }

  /**
   * 检测 N+1 查询问题
   */
  static detectNPlusOne(queries: GraphQLMetrics[]): boolean {
    if (queries.length < 2) return false

    // 检查是否有相似的查询在短时间内重复执行
    const timeWindow = 1000 // 1秒
    const similarityThreshold = 0.8

    for (let i = 0; i < queries.length - 1; i++) {
      const q1 = queries[i]
      let similarCount = 1

      for (let j = i + 1; j < queries.length; j++) {
        const q2 = queries[j]
        
        if (q2.timestamp - q1.timestamp > timeWindow) {
          break
        }

        if (this.areSimilarQueries(q1, q2, similarityThreshold)) {
          similarCount++
        }
      }

      // 如果在短时间内有多个相似查询，可能是 N+1 问题
      if (similarCount > 3) {
        return true
      }
    }

    return false
  }

  /**
   * 检查两个查询是否相似
   */
  private static areSimilarQueries(
    q1: GraphQLMetrics,
    q2: GraphQLMetrics,
    threshold: number
  ): boolean {
    // 比较操作名称
    if (q1.operationName === q2.operationName) {
      return true
    }

    // 比较字段使用
    if (q1.fieldsUsed && q2.fieldsUsed) {
      const intersection = q1.fieldsUsed.filter(f => q2.fieldsUsed!.includes(f))
      const union = Array.from(new Set([...q1.fieldsUsed, ...q2.fieldsUsed]))
      const similarity = intersection.length / union.length

      return similarity >= threshold
    }

    return false
  }
}
