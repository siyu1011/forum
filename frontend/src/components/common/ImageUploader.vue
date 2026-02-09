<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadApi } from '@/api'
import type { UploadFile, UploadInstance, UploadProps } from 'element-plus'

const props = defineProps<{
  modelValue?: string
  limit?: number
  maxSize?: number
  accept?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'success', url: string): void
  (e: 'error', error: Error): void
}>()

const uploadRef = ref<UploadInstance>()
const uploading = ref(false)
const uploadProgress = ref(0)
const imageUrl = ref(props.modelValue || '')
const retryCount = ref(0)
const maxRetries = 3

const getErrorMessage = (error: any): string => {
  console.log('[Upload] Error details:', error)
  if (error.code === 'ECONNABORTED') {
    return '上传超时，请检查网络连接'
  }
  if (error.response?.status === 413) {
    return '文件过大，请压缩后重试'
  }
  if (error.response?.status === 415) {
    return '不支持的文件类型'
  }
  if (error.response?.status === 401) {
    return '登录已过期，请重新登录'
  }
  if (error.response?.status >= 500) {
    return '服务器错误，请稍后重试'
  }
  return error.message || '上传失败，请重试'
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning(`最多只能上传 ${props.limit || 1} 张图片`)
}

const handleSizeExceed: UploadProps['onChange'] = (file: UploadFile) => {
  const maxSize = props.maxSize || 2 * 1024 * 1024
  if (file.size && file.size > maxSize) {
    ElMessage.warning(`文件大小不能超过 ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
    uploadRef.value?.clearFiles()
  }
}

const handleSuccess = async (response: any) => {
  console.log('[Upload] Server response received:', response)
  
  // 验证响应数据完整性
  if (!response || !response.url) {
    console.error('[Upload] Invalid response:', response)
    ElMessage.error('上传响应数据无效')
    uploading.value = false
    return
  }
  
  console.log('[Upload] File upload successful:', response.url)
  uploading.value = false
  uploadProgress.value = 0
  retryCount.value = 0
  imageUrl.value = response.url
  emit('update:modelValue', response.url)
  emit('success', response.url)
  ElMessage.success('上传成功')
}

const handleError = (error: any) => {
  uploading.value = false
  uploadProgress.value = 0
  const message = getErrorMessage(error)
  console.error('[Upload] Upload failed:', { message, error, retryCount: retryCount.value })
  if (retryCount.value < maxRetries) {
    ElMessage.warning(`${message}，正在重试 (${retryCount.value + 1}/${maxRetries})...`)
    retryCount.value++
    setTimeout(() => {
      uploadRef.value?.submit()
    }, 1000)
  } else {
    ElMessage.error(message)
    retryCount.value = 0
    emit('error', error)
  }
}

const handleRemove = () => {
  imageUrl.value = ''
  emit('update:modelValue', '')
  retryCount.value = 0
}

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  uploading.value = true
  uploadProgress.value = 0
  const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(rawFile.type)
  if (!isImage) {
    ElMessage.error('只能上传 JPEG/PNG/GIF/WEBP 格式的图片')
    uploading.value = false
    return false
  }
  console.log('[Upload] Starting upload for:', rawFile.name)
  return true
}

const customUpload: UploadProps['httpRequest'] = async (options) => {
  try {
    const response = await uploadApi.uploadImage(options.file, (progress) => {
      uploadProgress.value = progress
    })
    options.onSuccess?.(response)
  } catch (error: any) {
    options.onError?.(error)
  }
}
</script>

<template>
  <div class="image-uploader">
    <el-upload
      ref="uploadRef"
      class="upload-area"
      :show-file-list="false"
      :limit="limit || 1"
      :accept="accept || 'image/*'"
      :http-request="customUpload"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-exceed="handleExceed"
      :on-change="handleSizeExceed"
    >
      <img v-if="imageUrl && !uploading" :src="imageUrl" class="uploaded-image" />
      <div v-else-if="uploading" class="upload-progress">
        <el-progress
          type="circle"
          :percentage="uploadProgress"
          :status="uploadProgress === 100 ? 'success' : undefined"
        />
        <span class="upload-status">{{ uploadProgress === 100 ? '处理中...' : '上传中...' }}</span>
      </div>
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <span class="upload-text">上传图片</span>
        <span class="upload-hint">支持 JPEG/PNG/GIF/WebP，最大2MB</span>
      </div>
    </el-upload>

    <div v-if="imageUrl" class="image-actions">
      <el-button type="primary" link @click="handleRemove">
        <el-icon><Delete /></el-icon>
        移除
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.image-uploader {
  width: 100%;
  
  .upload-area {
    width: 100%;
    
    :deep(.el-upload) {
      width: 100%;
      border: 2px dashed var(--border-base);
      border-radius: 8px;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.3s;
      
      &:hover {
        border-color: var(--primary-color);
      }
    }
    
    .uploaded-image {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      display: block;
    }
    
    .upload-placeholder {
      width: 100%;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .upload-icon {
        font-size: 48px;
        color: var(--text-secondary);
      }

      .upload-text {
        font-size: 16px;
        color: var(--text-primary);
      }

      .upload-hint {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }

    .upload-progress {
      width: 100%;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;

      .upload-status {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }
  
  .image-actions {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
