/**
 * 堆栈解析器
 * 解析 JavaScript 错误堆栈，提取文件名、行号、列号等信息
 */

import type { StackFrame } from '../../types/error'

/**
 * 堆栈解析器类
 */
export class StackParser {
  /**
   * Chrome/Firefox 堆栈格式的正则表达式
   * 匹配格式: at functionName (filename:line:column)
   */
  private readonly chromeRegex = /^\s*at (?:(.*?) )?\(?(.+?):(\d+):(\d+)\)?$/

  /**
   * Firefox 堆栈格式的正则表达式
   * 匹配格式: functionName@filename:line:column
   */
  private readonly firefoxRegex = /^(.*)@(.+?):(\d+):(\d+)$/

  /**
   * Safari 堆栈格式的正则表达式
   */
  private readonly safariRegex = /^(.*?)@?(.+?):(\d+)(?::(\d+))?$/

  /**
   * 解析堆栈字符串
   * 
   * @param stack - 堆栈字符串
   * @returns 堆栈帧数组
   */
  parse(stack: string): StackFrame[] {
    if (!stack) {
      return []
    }

    const lines = stack.split('\n')
    const frames: StackFrame[] = []

    for (const line of lines) {
      const frame = this.parseLine(line)
      if (frame) {
        frames.push(frame)
      }
    }

    return frames
  }

  /**
   * 解析单行堆栈信息
   * 
   * @param line - 堆栈行
   * @returns 堆栈帧
   */
  private parseLine(line: string): StackFrame | null {
    // 跳过空行和错误消息行
    if (!line.trim() || line.includes('Error:')) {
      return null
    }

    // 尝试 Chrome 格式
    let match = line.match(this.chromeRegex)
    if (match) {
      return {
        functionName: match[1] || '<anonymous>',
        filename: this.normalizeFilename(match[2]),
        lineno: Number.parseInt(match[3], 10),
        colno: Number.parseInt(match[4], 10),
      }
    }

    // 尝试 Firefox 格式
    match = line.match(this.firefoxRegex)
    if (match) {
      return {
        functionName: match[1] || '<anonymous>',
        filename: this.normalizeFilename(match[2]),
        lineno: Number.parseInt(match[3], 10),
        colno: Number.parseInt(match[4], 10),
      }
    }

    // 尝试 Safari 格式
    match = line.match(this.safariRegex)
    if (match) {
      return {
        functionName: match[1] || '<anonymous>',
        filename: this.normalizeFilename(match[2]),
        lineno: Number.parseInt(match[3], 10),
        colno: match[4] ? Number.parseInt(match[4], 10) : 0,
      }
    }

    return null
  }

  /**
   * 规范化文件名
   * 移除协议前缀等
   * 
   * @param filename - 原始文件名
   * @returns 规范化后的文件名
   */
  private normalizeFilename(filename: string): string {
    if (!filename) {
      return '<unknown>'
    }

    // 移除 webpack:// 等前缀
    filename = filename.replace(/^webpack:\/\/\//, '')
    filename = filename.replace(/^webpack:\/\//, '')

    // 移除查询参数
    const queryIndex = filename.indexOf('?')
    if (queryIndex !== -1) {
      filename = filename.substring(0, queryIndex)
    }

    return filename
  }

  /**
   * 从 Error 对象解析堆栈
   * 
   * @param error - Error 对象
   * @returns 堆栈帧数组
   */
  parseFromError(error: Error): StackFrame[] {
    if (!error.stack) {
      return []
    }

    return this.parse(error.stack)
  }

  /**
   * 格式化堆栈帧为字符串
   * 
   * @param frames - 堆栈帧数组
   * @returns 格式化的堆栈字符串
   */
  format(frames: StackFrame[]): string {
    return frames
      .map((frame) => {
        const func = frame.functionName || '<anonymous>'
        const file = frame.filename
        const line = frame.lineno
        const col = frame.colno
        return `  at ${func} (${file}:${line}:${col})`
      })
      .join('\n')
  }

  /**
   * 获取堆栈的第一帧（错误发生的位置）
   * 
   * @param stack - 堆栈字符串
   * @returns 第一个堆栈帧
   */
  getFirstFrame(stack: string): StackFrame | null {
    const frames = this.parse(stack)
    return frames[0] || null
  }

  /**
   * 过滤堆栈帧
   * 移除不相关的帧（如库代码）
   * 
   * @param frames - 堆栈帧数组
   * @param filters - 文件名过滤器（包含这些字符串的帧会被移除）
   * @returns 过滤后的堆栈帧数组
   */
  filter(frames: StackFrame[], filters: string[] = []): StackFrame[] {
    if (filters.length === 0) {
      return frames
    }

    return frames.filter((frame) => {
      return !filters.some(filter => frame.filename.includes(filter))
    })
  }

  /**
   * 检查堆栈是否来自原生代码
   * 
   * @param stack - 堆栈字符串
   * @returns 是否来自原生代码
   */
  isNative(stack: string): boolean {
    return stack.includes('[native code]') || stack.includes('<anonymous>')
  }
}

/**
 * 创建堆栈解析器实例
 * 
 * @returns 堆栈解析器实例
 */
export function createStackParser(): StackParser {
  return new StackParser()
}

