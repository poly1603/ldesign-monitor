/**
 * @ldesign/monitor - 首屏渲染优化建议分析器
 * 
 * 分析首屏性能并提供优化建议
 */

import type { PerformanceMetric } from '../../types'

export interface OptimizationSuggestion {
  /**
   * 建议类型
   */
  type: 'critical' | 'important' | 'optional'

  /**
   * 建议分类
   */
  category: 'resource' | 'render' | 'script' | 'style' | 'image' | 'font' | 'network'

  /**
   * 建议标题
   */
  title: string

  /**
   * 建议描述
   */
  description: string

  /**
   * 预估收益（毫秒）
   */
  estimatedGain?: number

  /**
   * 相关资源
   */
  resources?: string[]

  /**
   * 实施难度
   */
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface PerformanceAnalysis {
  /**
   * 首屏渲染时间 (FCP)
   */
  fcp?: number

  /**
   * 最大内容渲染时间 (LCP)
   */
  lcp?: number

  /**
   * 首次输入延迟 (FID)
   */
  fid?: number

  /**
   * 累积布局偏移 (CLS)
   */
  cls?: number

  /**
   * 优化建议
   */
  suggestions: OptimizationSuggestion[]

  /**
   * 性能评分 (0-100)
   */
  score: number

  /**
   * 分析时间
   */
  timestamp: number
}

export class RenderOptimizationAdvisor {
  private resourceTimings: PerformanceResourceTiming[] = []
  private navigationTiming: PerformanceNavigationTiming | null = null
  private webVitals: Map<string, number> = new Map()

  /**
   * 分析性能并生成建议
   */
  analyze(): PerformanceAnalysis {
    this.collectData()

    const suggestions: OptimizationSuggestion[] = []

    // 分析资源加载
    suggestions.push(...this.analyzeResources())

    // 分析渲染性能
    suggestions.push(...this.analyzeRendering())

    // 分析脚本执行
    suggestions.push(...this.analyzeScripts())

    // 分析样式
    suggestions.push(...this.analyzeStyles())

    // 分析图片
    suggestions.push(...this.analyzeImages())

    // 分析字体
    suggestions.push(...this.analyzeFonts())

    // 分析网络
    suggestions.push(...this.analyzeNetwork())

    // 按优先级排序
    const sortedSuggestions = this.prioritizeSuggestions(suggestions)

    // 计算性能评分
    const score = this.calculateScore()

    return {
      fcp: this.webVitals.get('FCP'),
      lcp: this.webVitals.get('LCP'),
      fid: this.webVitals.get('FID'),
      cls: this.webVitals.get('CLS'),
      suggestions: sortedSuggestions,
      score,
      timestamp: Date.now(),
    }
  }

  /**
   * 更新 Web Vitals
   */
  updateWebVital(name: string, value: number): void {
    this.webVitals.set(name, value)
  }

  /**
   * 收集数据
   */
  private collectData(): void {
    if (typeof performance === 'undefined') {
      return
    }

    // 收集资源时序
    this.resourceTimings = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    // 收集导航时序
    const navEntries = performance.getEntriesByType('navigation')
    if (navEntries.length > 0) {
      this.navigationTiming = navEntries[0] as PerformanceNavigationTiming
    }
  }

  /**
   * 分析资源加载
   */
  private analyzeResources(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    // 检查资源数量
    if (this.resourceTimings.length > 50) {
      suggestions.push({
        type: 'important',
        category: 'resource',
        title: '资源数量过多',
        description: `页面加载了 ${this.resourceTimings.length} 个资源，建议合并或延迟加载非关键资源`,
        estimatedGain: 500,
        difficulty: 'medium',
      })
    }

    // 检查大文件
    const largeFiles = this.resourceTimings.filter(
      r => r.transferSize && r.transferSize > 500 * 1024
    )

    if (largeFiles.length > 0) {
      suggestions.push({
        type: 'critical',
        category: 'resource',
        title: '存在大文件',
        description: `发现 ${largeFiles.length} 个超过 500KB 的文件，建议压缩或分割`,
        estimatedGain: 1000,
        resources: largeFiles.map(r => r.name).slice(0, 5),
        difficulty: 'easy',
      })
    }

    // 检查未缓存的资源
    const uncachedResources = this.resourceTimings.filter(
      r => r.transferSize > 0 && !this.isResourceCached(r)
    )

    if (uncachedResources.length > 10) {
      suggestions.push({
        type: 'important',
        category: 'resource',
        title: '缓存利用率低',
        description: `${uncachedResources.length} 个资源未使用缓存，建议配置缓存策略`,
        estimatedGain: 800,
        difficulty: 'easy',
      })
    }

    return suggestions
  }

  /**
   * 分析渲染性能
   */
  private analyzeRendering(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    const lcp = this.webVitals.get('LCP')
    const fcp = this.webVitals.get('FCP')
    const cls = this.webVitals.get('CLS')

    // 检查 LCP
    if (lcp && lcp > 2500) {
      suggestions.push({
        type: 'critical',
        category: 'render',
        title: 'LCP 过慢',
        description: `最大内容渲染时间为 ${lcp.toFixed(0)}ms，建议优化关键资源加载`,
        estimatedGain: lcp - 2500,
        difficulty: 'medium',
      })
    }

    // 检查 FCP
    if (fcp && fcp > 1800) {
      suggestions.push({
        type: 'important',
        category: 'render',
        title: 'FCP 过慢',
        description: `首次内容渲染时间为 ${fcp.toFixed(0)}ms，建议优化关键渲染路径`,
        estimatedGain: fcp - 1800,
        difficulty: 'medium',
      })
    }

    // 检查 CLS
    if (cls && cls > 0.1) {
      suggestions.push({
        type: 'important',
        category: 'render',
        title: '布局不稳定',
        description: `累积布局偏移为 ${cls.toFixed(3)}，建议为图片和广告预留空间`,
        difficulty: 'easy',
      })
    }

    return suggestions
  }

  /**
   * 分析脚本执行
   */
  private analyzeScripts(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    const scripts = this.resourceTimings.filter(r => 
      r.initiatorType === 'script' || r.name.endsWith('.js')
    )

    // 检查阻塞脚本
    const blockingScripts = scripts.filter(s => 
      s.renderBlockingStatus === 'blocking'
    )

    if (blockingScripts.length > 0) {
      suggestions.push({
        type: 'critical',
        category: 'script',
        title: '存在阻塞脚本',
        description: `${blockingScripts.length} 个脚本阻塞了渲染，建议使用 async 或 defer`,
        estimatedGain: 500,
        resources: blockingScripts.map(s => s.name).slice(0, 3),
        difficulty: 'easy',
      })
    }

    // 检查第三方脚本
    const thirdPartyScripts = scripts.filter(s => !this.isFirstParty(s.name))

    if (thirdPartyScripts.length > 5) {
      suggestions.push({
        type: 'important',
        category: 'script',
        title: '第三方脚本过多',
        description: `页面包含 ${thirdPartyScripts.length} 个第三方脚本，建议延迟加载或移除不必要的脚本`,
        estimatedGain: 300,
        difficulty: 'medium',
      })
    }

    return suggestions
  }

  /**
   * 分析样式
   */
  private analyzeStyles(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    const styles = this.resourceTimings.filter(r => 
      r.initiatorType === 'css' || r.name.endsWith('.css')
    )

    // 检查关键 CSS
    const largeCSS = styles.filter(s => s.transferSize && s.transferSize > 50 * 1024)

    if (largeCSS.length > 0) {
      suggestions.push({
        type: 'important',
        category: 'style',
        title: 'CSS 文件过大',
        description: `${largeCSS.length} 个 CSS 文件超过 50KB，建议提取关键 CSS 内联`,
        estimatedGain: 400,
        resources: largeCSS.map(s => s.name),
        difficulty: 'medium',
      })
    }

    // 检查未使用的 CSS
    if (styles.length > 5) {
      suggestions.push({
        type: 'optional',
        category: 'style',
        title: 'CSS 文件较多',
        description: `页面加载了 ${styles.length} 个 CSS 文件，考虑合并或按需加载`,
        estimatedGain: 200,
        difficulty: 'medium',
      })
    }

    return suggestions
  }

  /**
   * 分析图片
   */
  private analyzeImages(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    const images = this.resourceTimings.filter(r => 
      ['img', 'image'].includes(r.initiatorType) ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(r.name)
    )

    // 检查大图片
    const largeImages = images.filter(img => img.transferSize && img.transferSize > 200 * 1024)

    if (largeImages.length > 0) {
      suggestions.push({
        type: 'critical',
        category: 'image',
        title: '图片未优化',
        description: `${largeImages.length} 张图片超过 200KB，建议压缩或使用现代格式 (WebP)`,
        estimatedGain: 600,
        resources: largeImages.map(img => img.name).slice(0, 3),
        difficulty: 'easy',
      })
    }

    // 检查图片数量
    if (images.length > 20) {
      suggestions.push({
        type: 'important',
        category: 'image',
        title: '图片数量过多',
        description: `页面包含 ${images.length} 张图片，建议使用懒加载`,
        estimatedGain: 400,
        difficulty: 'easy',
      })
    }

    return suggestions
  }

  /**
   * 分析字体
   */
  private analyzeFonts(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    const fonts = this.resourceTimings.filter(r => 
      r.initiatorType === 'font' || /\.(woff|woff2|ttf|otf)$/i.test(r.name)
    )

    if (fonts.length > 0) {
      // 检查字体加载时间
      const slowFonts = fonts.filter(f => f.duration > 500)

      if (slowFonts.length > 0) {
        suggestions.push({
          type: 'important',
          category: 'font',
          title: '字体加载慢',
          description: `${slowFonts.length} 个字体加载超过 500ms，建议使用 font-display: swap`,
          estimatedGain: 300,
          resources: slowFonts.map(f => f.name),
          difficulty: 'easy',
        })
      }

      // 检查字体数量
      if (fonts.length > 3) {
        suggestions.push({
          type: 'optional',
          category: 'font',
          title: '字体文件过多',
          description: `页面加载了 ${fonts.length} 个字体文件，建议减少字体种类`,
          estimatedGain: 200,
          difficulty: 'easy',
        })
      }
    }

    return suggestions
  }

  /**
   * 分析网络
   */
  private analyzeNetwork(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    if (!this.navigationTiming) {
      return suggestions
    }

    // 检查 DNS 查询时间
    const dnsTime = this.navigationTiming.domainLookupEnd - this.navigationTiming.domainLookupStart
    if (dnsTime > 200) {
      suggestions.push({
        type: 'optional',
        category: 'network',
        title: 'DNS 查询慢',
        description: `DNS 查询耗时 ${dnsTime.toFixed(0)}ms，建议使用 DNS 预解析`,
        estimatedGain: dnsTime - 100,
        difficulty: 'easy',
      })
    }

    // 检查 TCP 连接时间
    const tcpTime = this.navigationTiming.connectEnd - this.navigationTiming.connectStart
    if (tcpTime > 300) {
      suggestions.push({
        type: 'optional',
        category: 'network',
        title: 'TCP 连接慢',
        description: `TCP 连接耗时 ${tcpTime.toFixed(0)}ms，建议使用 preconnect`,
        estimatedGain: tcpTime - 150,
        difficulty: 'easy',
      })
    }

    // 检查 TTFB
    const ttfb = this.navigationTiming.responseStart - this.navigationTiming.requestStart
    if (ttfb > 600) {
      suggestions.push({
        type: 'critical',
        category: 'network',
        title: 'TTFB 过高',
        description: `服务器响应时间为 ${ttfb.toFixed(0)}ms，建议优化服务器性能或使用 CDN`,
        estimatedGain: ttfb - 600,
        difficulty: 'hard',
      })
    }

    return suggestions
  }

  /**
   * 优先级排序
   */
  private prioritizeSuggestions(suggestions: OptimizationSuggestion[]): OptimizationSuggestion[] {
    const typeOrder = { critical: 0, important: 1, optional: 2 }
    
    return suggestions.sort((a, b) => {
      // 先按类型排序
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type]
      }
      // 再按预估收益排序
      return (b.estimatedGain || 0) - (a.estimatedGain || 0)
    })
  }

  /**
   * 计算性能评分
   */
  private calculateScore(): number {
    let score = 100

    const lcp = this.webVitals.get('LCP')
    const fcp = this.webVitals.get('FCP')
    const fid = this.webVitals.get('FID')
    const cls = this.webVitals.get('CLS')

    // LCP 评分 (40%)
    if (lcp) {
      if (lcp > 4000) score -= 40
      else if (lcp > 2500) score -= 20 * (lcp - 2500) / 1500
    }

    // FCP 评分 (20%)
    if (fcp) {
      if (fcp > 3000) score -= 20
      else if (fcp > 1800) score -= 10 * (fcp - 1800) / 1200
    }

    // FID 评分 (20%)
    if (fid) {
      if (fid > 300) score -= 20
      else if (fid > 100) score -= 10 * (fid - 100) / 200
    }

    // CLS 评分 (20%)
    if (cls) {
      if (cls > 0.25) score -= 20
      else if (cls > 0.1) score -= 10 * (cls - 0.1) / 0.15
    }

    return Math.max(0, Math.round(score))
  }

  /**
   * 检查资源是否被缓存
   */
  private isResourceCached(resource: PerformanceResourceTiming): boolean {
    return resource.transferSize === 0 && resource.decodedBodySize > 0
  }

  /**
   * 检查是否为第一方资源
   */
  private isFirstParty(url: string): boolean {
    try {
      const resourceOrigin = new URL(url).origin
      const pageOrigin = window.location.origin
      return resourceOrigin === pageOrigin
    } catch {
      return false
    }
  }
}
