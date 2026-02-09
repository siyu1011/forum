import request from '@/utils/request'
import { STORAGE_KEYS } from '@/config'

export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
  sha256: string
  attachmentId?: number
}

export interface UploadProgressCallback {
  (progress: number): void
}

export const uploadApi = {
  // 上传图片（带进度回调）
  uploadImage(
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    console.log('[Upload] Starting upload', {
      filename: file.name,
      size: file.size,
      type: file.type,
    })

    return request.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60秒超时
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log('[Upload] Progress:', progress + '%')
          onProgress(progress)
        }
      },
    })
  },

  // 验证文件可访问性
  async verifyFileAccessible(url: string): Promise<boolean> {
    try {
      console.log('[Upload] Verifying file accessibility:', url)
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
      })
      console.log('[Upload] File accessibility check:', response.status, response.ok)
      return response.ok
    } catch (error) {
      console.error('[Upload] File accessibility check failed:', error)
      return false
    }
  },
}

export default uploadApi
