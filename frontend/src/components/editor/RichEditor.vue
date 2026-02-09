<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ElMessage } from 'element-plus'
import { STORAGE_KEYS } from '@/config'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref()
const content = ref(props.modelValue)

// Get dynamic token for upload requests
const getAuthHeader = () => {
  const token = localStorage.getItem(STORAGE_KEYS.token)
  if (!token) {
    console.warn('[RichEditor] No token found in localStorage')
    return ''
  }
  return `Bearer ${token}`
}

// Update editor upload header when token changes
// Note: Since we now use customUpload which gets fresh token each time,
// this function is kept for backwards compatibility and debugging
const updateUploadHeader = () => {
  console.log('[RichEditor] updateUploadHeader called (customUpload handles fresh tokens)')
}

// Listen for storage changes (login/logout in other tabs)
// Note: customUpload fetches fresh token, so this is mainly for debugging
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === STORAGE_KEYS.token) {
    console.log('[RichEditor] Token changed in storage:', !!e.newValue)
    updateUploadHeader()
  }
}

onMounted(() => {
  window.addEventListener('storage', handleStorageChange)
  // Token is now fetched fresh on each upload via customUpload
  updateUploadHeader()
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageChange)
})

const toolbarConfig = {
  excludeKeys: ['fullScreen'],
}

// Utility function to decode HTML entities
const decodeHtmlEntities = (html: string): string => {
  if (!html) return ''
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

const editorConfig = {
  placeholder: props.placeholder || '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/v1/upload/image',
      fieldName: 'file',
      maxFileSize: 2 * 1024 * 1024,
      headers: {},
      // 使用 customUpload 方式完全控制上传过程，确保每次都使用最新Token
      customUpload: async (file: File, insertFn: any) => {
        console.log('[RichEditor] customUpload: starting upload with fresh token')

        try {
          const formData = new FormData()
          formData.append('file', file)

          const freshToken = getAuthHeader()
          console.log('[RichEditor] Token available:', !!freshToken)

          const response = await fetch('/api/v1/upload/image', {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: freshToken,
            },
          })

          console.log('[RichEditor] Upload response status:', response.status)

          if (!response.ok) {
            let errorMessage = '图片上传失败'
            try {
              const errorData = await response.json()
              errorMessage = errorData.message || errorMessage
            } catch (e) {
              const errorText = await response.text()
              console.error('[RichEditor] Upload failed:', response.status, errorText)
            }

            if (response.status === 401) {
              ElMessage.error('登录已过期，请重新登录')
            } else {
              ElMessage.error(errorMessage)
            }
            return
          }

          const res = await response.json()
          console.log('[RichEditor] Upload response:', res)

          // 验证返回的数据（服务端返回 201 状态码）
          if ((res.code === 200 || res.code === 201) && res.data && res.data.url) {
            console.log('[RichEditor] Upload successful, inserting image:', res.data.url)
            insertFn(res.data.url, res.data.filename, res.data.url)
          } else {
            console.error('图片上传失败:', res.message)
            ElMessage.error(res.message || '图片上传失败')
          }
        } catch (error) {
          console.error('[RichEditor] Upload error:', error)
          ElMessage.error('图片上传失败')
        }
      },
      // Retry configuration
      retryInterval: 2000,
      maxRetryTimes: 3,
    },
  },
}

const handleCreated = (editor: any) => {
  editorRef.value = editor
  
  // Ensure proper encoding for Chinese text
  editor.getEditableEle().setAttribute('lang', 'zh-CN')
  editor.getEditableEle().setAttribute('xml:lang', 'zh-CN')
}

const handleChange = (editor: any) => {
  content.value = editor.getHtml()
  // Emit the raw content - no additional encoding needed
  emit('update:modelValue', content.value)
}

  watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== content.value && editorRef.value) {
      // Decode HTML entities before setting content to avoid double-encoding
      const decodedContent = decodeHtmlEntities(newVal || '')
      editorRef.value.setHtml(decodedContent)
      content.value = decodedContent
    }
  }
)

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
})
</script>

<template>
  <div class="wang-editor-wrapper">
    <Toolbar
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      style="border-bottom: 1px solid #dcdfe6"
    />
    <Editor
      :defaultConfig="editorConfig"
      v-model="content"
      style="height: 400px; overflow-y: hidden"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'RichEditor',
}
</script>

<style scoped lang="scss">
.wang-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;

  &:focus {
    border-color: var(--primary-color);
  }
}
</style>
