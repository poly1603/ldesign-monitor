/**
 * @ldesign/monitor - 数据脱敏
 * 
 * 自动检测和脱敏敏感信息，保护用户隐私
 */

/**
 * 脱敏规则配置
 */
export interface MaskingRule {
  /**
   * 规则名称
   */
  name: string

  /**
   * 匹配正则表达式
   */
  pattern: RegExp

  /**
   * 替换方式
   */
  replacement: string | ((match: string) => string)

  /**
   * 是否启用
   * @default true
   */
  enabled?: boolean
}

/**
 * 内置脱敏规则
 */
const builtInRules: MaskingRule[] = [
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '***@***.***',
  },
  {
    name: 'phone',
    pattern: /\b1[3-9]\d{9}\b/g,
    replacement: (match) => match.slice(0, 3) + '****' + match.slice(-4),
  },
  {
    name: 'idCard',
    pattern: /\b\d{17}[\dXx]\b/g,
    replacement: (match) => match.slice(0, 6) + '********' + match.slice(-4),
  },
  {
    name: 'creditCard',
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: (match) => {
      const cleaned = match.replace(/[\s-]/g, '')
      return cleaned.slice(0, 4) + ' **** **** ' + cleaned.slice(-4)
    },
  },
  {
    name: 'password',
    pattern: /("password":\s*")[^"]*"/gi,
    replacement: '$1********"',
  },
  {
    name: 'token',
    pattern: /("token":\s*"|"authorization":\s*"Bearer\s+)[^"]*"/gi,
    replacement: '$1********"',
  },
  {
    name: 'apiKey',
    pattern: /("api[_-]?key":\s*")[^"]*"/gi,
    replacement: '$1********"',
  },
]

/**
 * 敏感字段名称
 */
const sensitiveFields = new Set([
  'password',
  'pwd',
  'passwd',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'secretKey',
  'private_key',
  'privateKey',
  'creditCard',
  'cvv',
  'ssn',
])

/**
 * 数据脱敏器
 */
export class DataMasker {
  private rules: MaskingRule[] = []
  private customRules: MaskingRule[] = []

  constructor() {
    this.rules = [...builtInRules]
  }

  /**
   * 添加自定义脱敏规则
   * 
   * @param rule - 脱敏规则
   */
  addRule(rule: MaskingRule): void {
    this.customRules.push({
      ...rule,
      enabled: rule.enabled ?? true,
    })
  }

  /**
   * 移除自定义规则
   * 
   * @param name - 规则名称
   */
  removeRule(name: string): void {
    this.customRules = this.customRules.filter(rule => rule.name !== name)
  }

  /**
   * 启用/禁用内置规则
   * 
   * @param name - 规则名称
   * @param enabled - 是否启用
   */
  setRuleEnabled(name: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.name === name)
    if (rule) {
      rule.enabled = enabled
    }

    const customRule = this.customRules.find(r => r.name === name)
    if (customRule) {
      customRule.enabled = enabled
    }
  }

  /**
   * 脱敏文本
   * 
   * @param text - 要脱敏的文本
   * @returns 脱敏后的文本
   */
  maskText(text: string): string {
    if (!text || typeof text !== 'string') {
      return text
    }

    let masked = text
    const allRules = [...this.rules, ...this.customRules]

    for (const rule of allRules) {
      if (rule.enabled === false) {
        continue
      }

      if (typeof rule.replacement === 'function') {
        masked = masked.replace(rule.pattern, rule.replacement)
      } else {
        masked = masked.replace(rule.pattern, rule.replacement)
      }
    }

    return masked
  }

  /**
   * 脱敏对象
   * 递归处理对象中的所有字符串值和敏感字段
   * 
   * @param obj - 要脱敏的对象
   * @returns 脱敏后的对象
   */
  maskObject<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'string') {
      return this.maskText(obj) as T
    }

    if (typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskObject(item)) as T
    }

    const masked: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // 检查是否是敏感字段
      if (sensitiveFields.has(key) || this.isSensitiveField(key)) {
        masked[key] = '********'
      } else if (typeof value === 'string') {
        masked[key] = this.maskText(value)
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskObject(value)
      } else {
        masked[key] = value
      }
    }

    return masked as T
  }

  /**
   * 检查字段名是否可能包含敏感信息
   * 
   * @param fieldName - 字段名
   * @returns 是否为敏感字段
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerName = fieldName.toLowerCase()

    return (
      lowerName.includes('password') ||
      lowerName.includes('secret') ||
      lowerName.includes('token') ||
      lowerName.includes('key') ||
      lowerName.includes('credit') ||
      lowerName.includes('card')
    )
  }

  /**
   * 脱敏 URL
   * 移除查询参数中的敏感信息
   * 
   * @param url - URL 字符串
   * @returns 脱敏后的 URL
   */
  maskUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const params = new URLSearchParams(urlObj.search)

      for (const [key, value] of params.entries()) {
        if (this.isSensitiveField(key)) {
          params.set(key, '********')
        } else if (typeof value === 'string') {
          params.set(key, this.maskText(value))
        }
      }

      urlObj.search = params.toString()
      return urlObj.toString()
    } catch {
      // 不是有效的 URL，直接脱敏文本
      return this.maskText(url)
    }
  }

  /**
   * 脱敏 Headers
   * 
   * @param headers - HTTP Headers
   * @returns 脱敏后的 Headers
   */
  maskHeaders(headers: Record<string, string>): Record<string, string> {
    const masked: Record<string, string> = {}

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase()

      if (
        lowerKey === 'authorization' ||
        lowerKey === 'cookie' ||
        lowerKey === 'set-cookie' ||
        this.isSensitiveField(key)
      ) {
        masked[key] = '********'
      } else {
        masked[key] = this.maskText(value)
      }
    }

    return masked
  }

  /**
   * 重置为默认规则
   */
  reset(): void {
    this.rules = [...builtInRules]
    this.customRules = []
  }
}

/**
 * 创建数据脱敏器实例
 * 
 * @returns 数据脱敏器实例
 */
export function createDataMasker(): DataMasker {
  return new DataMasker()
}

/**
 * 默认数据脱敏器实例
 */
export const defaultMasker = createDataMasker()

