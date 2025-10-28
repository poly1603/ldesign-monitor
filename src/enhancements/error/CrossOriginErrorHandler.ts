/**
 * 跨域错误详情增强模块
 * 
 * 功能：
 * 1. 检测跨域脚本错误 (Script Error)
 * 2. 尝试恢复跨域错误的详细信息
 * 3. 提供跨域资源配置检查
 * 4. 收集脚本 URL 和加载信息
 */

export interface CrossOriginErrorInfo {
  isCrossOrigin: boolean
  scriptUrl?: string
  scriptIntegrity?: string
  hasCrossOriginAttribute?: boolean
  errorMessage: string
  canRecover: boolean
  suggestions: string[]
}

export interface ScriptInfo {
  url: string
  crossOrigin: string | null
  integrity: string | null
  async: boolean
  defer: boolean
  type: string
  loadTime?: number
}

export class CrossOriginErrorHandler {
  private scriptRegistry = new Map<string, ScriptInfo>()
  private corsCheckCache = new Map<string, boolean>()
  
  constructor() {
    this.observeScriptLoading()
  }

  /**
   * 监听页面中所有脚本的加载
   */
  private observeScriptLoading(): void {
    if (typeof window === 'undefined') return

    // 记录已存在的脚本
    document.querySelectorAll('script[src]').forEach((script) => {
      this.registerScript(script as HTMLScriptElement)
    })

    // 监听新添加的脚本
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'SCRIPT') {
            this.registerScript(node as HTMLScriptElement)
          }
        })
      })
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  /**
   * 注册脚本信息
   */
  private registerScript(script: HTMLScriptElement): void {
    const src = script.src
    if (!src) return

    const info: ScriptInfo = {
      url: src,
      crossOrigin: script.crossOrigin,
      integrity: script.integrity,
      async: script.async,
      defer: script.defer,
      type: script.type,
    }

    this.scriptRegistry.set(src, info)

    // 记录加载时间
    const startTime = Date.now()
    script.addEventListener('load', () => {
      info.loadTime = Date.now() - startTime
    })
  }

  /**
   * 检测是否为跨域错误
   */
  isCrossOriginError(error: Error, source?: string): boolean {
    // "Script error." 是跨域错误的典型特征
    if (error.message === 'Script error.' || error.message === 'Script error') {
      return true
    }

    // 检查错误堆栈是否被浏览器隐藏
    if (!error.stack || error.stack === '') {
      return true
    }

    // 检查源 URL 是否跨域
    if (source && this.isUrlCrossOrigin(source)) {
      return true
    }

    return false
  }

  /**
   * 分析跨域错误并尝试恢复信息
   */
  analyzeCrossOriginError(
    error: Error,
    source?: string,
    lineno?: number,
    colno?: number,
  ): CrossOriginErrorInfo {
    const isCrossOrigin = this.isCrossOriginError(error, source)

    if (!isCrossOrigin) {
      return {
        isCrossOrigin: false,
        errorMessage: error.message,
        canRecover: true,
        suggestions: [],
      }
    }

    // 尝试从已注册的脚本中找到信息
    const scriptInfo = source ? this.scriptRegistry.get(source) : undefined
    const hasCORS = scriptInfo?.crossOrigin !== null

    const suggestions: string[] = []

    if (!hasCORS) {
      suggestions.push(
        `Add crossorigin="anonymous" attribute to script tag: <script src="${source}" crossorigin="anonymous"></script>`,
      )
    }

    if (source && !this.hasCORSHeaders(source)) {
      suggestions.push(
        `Configure server to send CORS headers: Access-Control-Allow-Origin: ${window.location.origin}`,
      )
    }

    if (scriptInfo?.integrity) {
      suggestions.push(
        'Subresource Integrity (SRI) is enabled. Ensure the script content matches the integrity hash.',
      )
    }

    return {
      isCrossOrigin: true,
      scriptUrl: source,
      scriptIntegrity: scriptInfo?.integrity,
      hasCrossOriginAttribute: hasCORS,
      errorMessage: 'Script error (cross-origin)',
      canRecover: false,
      suggestions,
    }
  }

  /**
   * 检查 URL 是否跨域
   */
  private isUrlCrossOrigin(url: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      const urlObj = new URL(url, window.location.href)
      return urlObj.origin !== window.location.origin
    } catch {
      return false
    }
  }

  /**
   * 检查脚本是否配置了 CORS 头
   */
  private hasCORSHeaders(url: string): boolean {
    // 从缓存中获取
    if (this.corsCheckCache.has(url)) {
      return this.corsCheckCache.get(url)!
    }

    // 注意：这里无法直接检测，只能通过实际加载来验证
    // 返回一个估计值
    const scriptInfo = this.scriptRegistry.get(url)
    const hasCORS = scriptInfo?.crossOrigin !== null

    this.corsCheckCache.set(url, hasCORS)
    return hasCORS
  }

  /**
   * 获取所有已注册的脚本信息
   */
  getScriptRegistry(): Map<string, ScriptInfo> {
    return new Map(this.scriptRegistry)
  }

  /**
   * 获取跨域脚本列表
   */
  getCrossOriginScripts(): ScriptInfo[] {
    const scripts: ScriptInfo[] = []

    this.scriptRegistry.forEach((info) => {
      if (this.isUrlCrossOrigin(info.url)) {
        scripts.push(info)
      }
    })

    return scripts
  }

  /**
   * 检查脚本配置建议
   */
  getConfigurationSuggestions(): string[] {
    const suggestions: string[] = []
    const crossOriginScripts = this.getCrossOriginScripts()

    const scriptsWithoutCORS = crossOriginScripts.filter(
      (script) => script.crossOrigin === null,
    )

    if (scriptsWithoutCORS.length > 0) {
      suggestions.push(
        `Found ${scriptsWithoutCORS.length} cross-origin script(s) without crossorigin attribute. Add crossorigin="anonymous" to enable detailed error reporting.`,
      )
    }

    return suggestions
  }

  /**
   * 生成错误恢复报告
   */
  generateRecoveryReport(error: Error, source?: string): {
    canRecover: boolean
    steps: string[]
  } {
    const analysis = this.analyzeCrossOriginError(error, source)

    if (!analysis.isCrossOrigin) {
      return {
        canRecover: true,
        steps: ['Error details are already available.'],
      }
    }

    const steps: string[] = [
      '1. Add crossorigin="anonymous" to the script tag',
      '2. Configure the server to send CORS headers',
      '3. Redeploy and test',
    ]

    if (analysis.hasCrossOriginAttribute) {
      steps[0] += ' ✓ (Already configured)'
    }

    return {
      canRecover: false,
      steps,
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.scriptRegistry.clear()
    this.corsCheckCache.clear()
  }
}

/**
 * 创建跨域错误处理器
 */
export function createCrossOriginErrorHandler(): CrossOriginErrorHandler {
  return new CrossOriginErrorHandler()
}
