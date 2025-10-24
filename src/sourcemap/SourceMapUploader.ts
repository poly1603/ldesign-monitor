/**
 * Source Map 上传器
 * 用于在构建时上传 Source Map 文件
 */

/**
 * Source Map 上传配置
 */
export interface SourceMapUploadConfig {
  /**
   * 上传端点 URL
   */
  url: string

  /**
   * 项目 ID
   */
  projectId: string

  /**
   * 版本号
   */
  version: string

  /**
   * API Key
   */
  apiKey?: string

  /**
   * Source Map 文件路径列表
   */
  files: string[]

  /**
   * 并发上传数
   * @default 5
   */
  concurrency?: number
}

/**
 * 上传结果接口
 */
export interface UploadResult {
  /**
   * 成功数量
   */
  successCount: number

  /**
   * 失败数量
   */
  failedCount: number

  /**
   * 失败的文件列表
   */
  failedFiles: string[]

  /**
   * 总耗时（毫秒）
   */
  duration: number
}

/**
 * Source Map 上传器类
 */
export class SourceMapUploader {
  /**
   * 配置
   */
  private config: Required<SourceMapUploadConfig>

  constructor(config: SourceMapUploadConfig) {
    this.config = {
      ...config,
      concurrency: config.concurrency ?? 5,
    }
  }

  /**
   * 上传所有 Source Map 文件
   */
  async uploadAll(): Promise<UploadResult> {
    const startTime = Date.now()
    const failedFiles: string[] = []
    let successCount = 0
    let failedCount = 0

    // 分批上传
    const batches = this.chunk(this.config.files, this.config.concurrency)

    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(file => this.uploadFile(file)),
      )

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++
        }
        else {
          failedCount++
          failedFiles.push(batch[index])
        }
      })
    }

    return {
      successCount,
      failedCount,
      failedFiles,
      duration: Date.now() - startTime,
    }
  }

  /**
   * 上传单个文件
   */
  private async uploadFile(file: string): Promise<void> {
    // TODO: 实现实际的上传逻辑
    console.log('[SourceMapUploader] Uploading:', file)

    const formData = new FormData()
    formData.append('projectId', this.config.projectId)
    formData.append('version', this.config.version)

    // 这里应该读取文件内容并添加到 formData
    // formData.append('file', fileBlob, fileName)

    const headers: Record<string, string> = {}
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const response = await fetch(this.config.url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
  }

  /**
   * 将数组分块
   */
  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

/**
 * 创建 Source Map 上传器实例
 */
export function createSourceMapUploader(config: SourceMapUploadConfig): SourceMapUploader {
  return new SourceMapUploader(config)
}




