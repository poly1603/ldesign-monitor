/**
 * 错误分析增强模块
 * 
 * 功能：
 * 1. 智能错误分组（基于堆栈相似度）
 * 2. 错误趋势分析
 * 3. 错误影响范围统计
 */

export interface ErrorGroup {
  id: string
  fingerprint: string
  count: number
  firstSeen: number
  lastSeen: number
  errors: ErrorRecord[]
  affectedUsers: Set<string>
  affectedSessions: Set<string>
  affectedPages: Set<string>
}

export interface ErrorRecord {
  id: string
  message: string
  stack?: string
  timestamp: number
  userId?: string
  sessionId?: string
  url?: string
  metadata?: Record<string, any>
}

export interface ErrorTrend {
  period: string
  count: number
  uniqueErrors: number
  affectedUsers: number
}

export interface ErrorImpact {
  totalErrors: number
  uniqueErrorTypes: number
  affectedUsers: number
  affectedSessions: number
  affectedPages: number
  errorRate: number
  topErrors: Array<{
    fingerprint: string
    count: number
    percentage: number
  }>
}

/**
 * 错误分组器
 */
export class ErrorGrouper {
  private groups = new Map<string, ErrorGroup>()
  private similarityThreshold = 0.8

  /**
   * 添加错误到分组
   */
  addError(error: ErrorRecord): string {
    const fingerprint = this.generateFingerprint(error)
    
    let group = this.groups.get(fingerprint)
    
    if (!group) {
      // 尝试找到相似的分组
      group = this.findSimilarGroup(error)
      
      if (!group) {
        // 创建新分组
        group = {
          id: this.generateGroupId(),
          fingerprint,
          count: 0,
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
          errors: [],
          affectedUsers: new Set(),
          affectedSessions: new Set(),
          affectedPages: new Set(),
        }
        this.groups.set(fingerprint, group)
      }
    }

    // 添加错误到分组
    group.count++
    group.lastSeen = error.timestamp
    group.errors.push(error)

    if (error.userId) group.affectedUsers.add(error.userId)
    if (error.sessionId) group.affectedSessions.add(error.sessionId)
    if (error.url) group.affectedPages.add(error.url)

    return group.id
  }

  /**
   * 生成错误指纹
   */
  private generateFingerprint(error: ErrorRecord): string {
    // 基于错误消息和堆栈的前几行生成指纹
    const message = this.normalizeMessage(error.message)
    const stack = this.normalizeStack(error.stack)
    
    return `${message}:${stack}`
  }

  /**
   * 规范化错误消息
   */
  private normalizeMessage(message: string): string {
    return message
      // 移除数字
      .replace(/\d+/g, '<number>')
      // 移除 URL
      .replace(/https?:\/\/[^\s]+/g, '<url>')
      // 移除 UUID
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')
      // 移除引号内容
      .replace(/"[^"]+"/g, '"<string>"')
      .trim()
  }

  /**
   * 规范化堆栈信息
   */
  private normalizeStack(stack?: string): string {
    if (!stack) return ''

    const lines = stack.split('\n').slice(0, 3) // 只取前3行
    
    return lines
      .map(line => {
        return line
          // 移除行号和列号
          .replace(/:\d+:\d+/g, '')
          // 移除文件路径，只保留文件名
          .replace(/.*\/([\w-]+\.js)/, '$1')
      })
      .join('|')
  }

  /**
   * 查找相似的错误分组
   */
  private findSimilarGroup(error: ErrorRecord): ErrorGroup | undefined {
    const errorStack = error.stack || ''
    let bestMatch: ErrorGroup | undefined
    let bestSimilarity = 0

    for (const group of this.groups.values()) {
      const firstError = group.errors[0]
      const similarity = this.calculateSimilarity(errorStack, firstError.stack || '')

      if (similarity > this.similarityThreshold && similarity > bestSimilarity) {
        bestMatch = group
        bestSimilarity = similarity
      }
    }

    return bestMatch
  }

  /**
   * 计算两个堆栈的相似度
   */
  private calculateSimilarity(stack1: string, stack2: string): number {
    if (!stack1 || !stack2) return 0

    const lines1 = stack1.split('\n').slice(0, 5)
    const lines2 = stack2.split('\n').slice(0, 5)

    let matchCount = 0
    const maxLines = Math.max(lines1.length, lines2.length)

    for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
      if (this.normalizeStack(lines1[i]) === this.normalizeStack(lines2[i])) {
        matchCount++
      }
    }

    return matchCount / maxLines
  }

  /**
   * 生成分组 ID
   */
  private generateGroupId(): string {
    return `error_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取所有分组
   */
  getGroups(): ErrorGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * 获取分组统计
   */
  getGroupStats(): {
    totalGroups: number
    totalErrors: number
    topGroups: ErrorGroup[]
  } {
    const groups = this.getGroups()
    const totalErrors = groups.reduce((sum, g) => sum + g.count, 0)
    const topGroups = groups.sort((a, b) => b.count - a.count).slice(0, 10)

    return {
      totalGroups: groups.length,
      totalErrors,
      topGroups,
    }
  }
}

/**
 * 错误趋势分析器
 */
export class ErrorTrendAnalyzer {
  private timeSeriesData: Map<string, ErrorTrend[]> = new Map()

  /**
   * 记录错误事件
   */
  recordError(error: ErrorRecord): void {
    const period = this.getPeriod(error.timestamp)
    const key = 'all'

    if (!this.timeSeriesData.has(key)) {
      this.timeSeriesData.set(key, [])
    }

    const trends = this.timeSeriesData.get(key)!
    let trend = trends.find(t => t.period === period)

    if (!trend) {
      trend = {
        period,
        count: 0,
        uniqueErrors: 0,
        affectedUsers: 0,
      }
      trends.push(trend)
    }

    trend.count++
  }

  /**
   * 获取时间段标识
   */
  private getPeriod(timestamp: number, interval: 'hour' | 'day' = 'hour'): string {
    const date = new Date(timestamp)

    if (interval === 'hour') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  /**
   * 获取趋势数据
   */
  getTrends(hours = 24): ErrorTrend[] {
    const trends = this.timeSeriesData.get('all') || []
    return trends.slice(-hours)
  }

  /**
   * 检测异常峰值
   */
  detectAnomalies(threshold = 2): Array<{ period: string; count: number; isAnomaly: boolean }> {
    const trends = this.getTrends()
    if (trends.length < 5) return []

    // 计算平均值和标准差
    const counts = trends.map(t => t.count)
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length
    const stdDev = Math.sqrt(
      counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length,
    )

    // 检测异常
    return trends.map(trend => ({
      period: trend.period,
      count: trend.count,
      isAnomaly: trend.count > mean + threshold * stdDev,
    }))
  }

  /**
   * 获取错误率变化
   */
  getErrorRateChange(): { current: number; previous: number; change: number } {
    const trends = this.getTrends(2)
    if (trends.length < 2) {
      return { current: 0, previous: 0, change: 0 }
    }

    const current = trends[trends.length - 1].count
    const previous = trends[trends.length - 2].count
    const change = previous === 0 ? 0 : ((current - previous) / previous) * 100

    return { current, previous, change }
  }
}

/**
 * 错误影响范围分析器
 */
export class ErrorImpactAnalyzer {
  private grouper: ErrorGrouper

  constructor(grouper: ErrorGrouper) {
    this.grouper = grouper
  }

  /**
   * 分析错误影响范围
   */
  analyzeImpact(): ErrorImpact {
    const groups = this.grouper.getGroups()
    
    const totalErrors = groups.reduce((sum, g) => sum + g.count, 0)
    const uniqueErrorTypes = groups.length

    const allUsers = new Set<string>()
    const allSessions = new Set<string>()
    const allPages = new Set<string>()

    groups.forEach(group => {
      group.affectedUsers.forEach(u => allUsers.add(u))
      group.affectedSessions.forEach(s => allSessions.add(s))
      group.affectedPages.forEach(p => allPages.add(p))
    })

    // 计算Top错误
    const sortedGroups = groups.sort((a, b) => b.count - a.count).slice(0, 10)
    const topErrors = sortedGroups.map(g => ({
      fingerprint: g.fingerprint,
      count: g.count,
      percentage: (g.count / totalErrors) * 100,
    }))

    return {
      totalErrors,
      uniqueErrorTypes,
      affectedUsers: allUsers.size,
      affectedSessions: allSessions.size,
      affectedPages: allPages.size,
      errorRate: 0, // 需要配合总会话数计算
      topErrors,
    }
  }

  /**
   * 获取最严重的错误
   */
  getCriticalErrors(limit = 5): ErrorGroup[] {
    return this.grouper
      .getGroups()
      .sort((a, b) => {
        // 按影响用户数和错误数综合排序
        const scoreA = a.affectedUsers.size * 10 + a.count
        const scoreB = b.affectedUsers.size * 10 + b.count
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  /**
   * 获取用户错误分布
   */
  getUserErrorDistribution(): Map<string, number> {
    const distribution = new Map<string, number>()
    const groups = this.grouper.getGroups()

    groups.forEach(group => {
      group.affectedUsers.forEach(userId => {
        distribution.set(userId, (distribution.get(userId) || 0) + group.count)
      })
    })

    return distribution
  }
}

/**
 * 错误分析管理器
 */
export class ErrorAnalytics {
  private grouper: ErrorGrouper
  private trendAnalyzer: ErrorTrendAnalyzer
  private impactAnalyzer: ErrorImpactAnalyzer

  constructor() {
    this.grouper = new ErrorGrouper()
    this.trendAnalyzer = new ErrorTrendAnalyzer()
    this.impactAnalyzer = new ErrorImpactAnalyzer(this.grouper)
  }

  /**
   * 添加错误
   */
  addError(error: ErrorRecord): string {
    this.trendAnalyzer.recordError(error)
    return this.grouper.addError(error)
  }

  /**
   * 获取分组统计
   */
  getGroupStats() {
    return this.grouper.getGroupStats()
  }

  /**
   * 获取趋势数据
   */
  getTrends(hours?: number) {
    return this.trendAnalyzer.getTrends(hours)
  }

  /**
   * 检测异常
   */
  detectAnomalies(threshold?: number) {
    return this.trendAnalyzer.detectAnomalies(threshold)
  }

  /**
   * 获取影响范围
   */
  getImpact() {
    return this.impactAnalyzer.analyzeImpact()
  }

  /**
   * 获取严重错误
   */
  getCriticalErrors(limit?: number) {
    return this.impactAnalyzer.getCriticalErrors(limit)
  }

  /**
   * 获取完整报告
   */
  getReport() {
    return {
      groups: this.getGroupStats(),
      trends: this.getTrends(24),
      anomalies: this.detectAnomalies(),
      impact: this.getImpact(),
      critical: this.getCriticalErrors(),
      rateChange: this.trendAnalyzer.getErrorRateChange(),
    }
  }
}

/**
 * 创建错误分析器
 */
export function createErrorAnalytics(): ErrorAnalytics {
  return new ErrorAnalytics()
}
