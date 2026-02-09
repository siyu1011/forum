<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { postApi, categoryApi } from '@/api'
import { useUserStore } from '@/stores/user'
import RichEditor from '@/components/editor/RichEditor.vue'
import type { Category, Post } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const postId = ref<number>(0)
const loading = ref(false)
const submitting = ref(false)
const categories = ref<Category[]>([])
const originalPost = ref<Post | null>(null)

const form = ref({
  title: '',
  category_id: null as number | null,
  content: '',
  tags: '',
  cover_image: '',
})

const rules = {
  title: [
    { required: true, message: '请输入帖子标题', trigger: 'blur' },
    { min: 5, max: 255, message: '标题长度必须为5-255个字符', trigger: 'blur' },
  ],
  category_id: [
    { required: true, message: '请选择版块', trigger: 'change' },
  ],
  content: [
    { required: true, message: '请输入帖子内容', trigger: 'blur' },
    { min: 10, message: '内容至少需要10个字符', trigger: 'blur' },
  ],
}

const formRef = ref()

// 获取版块列表
const fetchCategories = async () => {
  try {
    const result = await categoryApi.getCategories(true)
    categories.value = result
  } catch (error: any) {
    ElMessage.error(error.message || '获取版块失败')
  }
}

// 获取帖子详情
const fetchPostDetail = async () => {
  const id = Number(route.params.id)
  if (!id || isNaN(id)) {
    ElMessage.error('无效的帖子ID')
    router.push('/posts')
    return
  }

  postId.value = id
  loading.value = true
  
  try {
    const post = await postApi.getPostById(id)
    originalPost.value = post
    
    // 检查权限：只有帖子作者或管理员可以编辑
    const currentUserId = userStore.user?.id
    const isAuthor = post.author?.id === currentUserId
    const isAdmin = userStore.isAdmin
    
    if (!isAuthor && !isAdmin) {
      ElMessage.error('无权编辑此帖子')
      router.push(`/post/${id}`)
      return
    }
    
    // 填充表单数据
    form.value = {
      title: post.title,
      category_id: post.category?.id || null,
      content: post.content,
      tags: post.tags?.map((tag: any) => tag.name).join(', ') || '',
      cover_image: post.cover_image || '',
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取帖子详情失败')
    router.push('/posts')
  } finally {
    loading.value = false
  }
}

// 提交编辑
const handleSubmit = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    submitting.value = true
    try {
      const tags = form.value.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      await postApi.updatePost(postId.value, {
        title: form.value.title,
        content: form.value.content,
        category_id: form.value.category_id!,
        tags: tags.length > 0 ? tags : undefined,
        cover_image: form.value.cover_image || undefined,
      })

      ElMessage.success('编辑成功')
      router.push(`/post/${postId.value}`)
    } catch (error: any) {
      ElMessage.error(error.message || '编辑失败')
    } finally {
      submitting.value = false
    }
  })
}

// 取消编辑
const handleCancel = () => {
  ElMessageBox.confirm('确定要取消编辑吗？未保存的内容将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '继续编辑',
    type: 'warning',
  })
    .then(() => {
      if (postId.value) {
        router.push(`/post/${postId.value}`)
      } else {
        router.push('/posts')
      }
    })
    .catch(() => {
      // 用户选择继续编辑
    })
}

onMounted(() => {
  fetchCategories()
  fetchPostDetail()
})
</script>

<template>
  <div class="post-edit-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <h2>编辑帖子</h2>
          <el-button text @click="handleCancel">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入帖子标题（5-255个字符）"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="版块" prop="category_id">
          <el-select
            v-model="form.category_id"
            placeholder="请选择版块"
            style="width: 100%"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <RichEditor
            v-model="form.content"
            placeholder="请输入帖子内容（至少10个字符）..."
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-input
            v-model="form.tags"
            placeholder="请输入标签，多个标签用逗号分隔（如：Vue, React, 前端）"
          />
        </el-form-item>

        <el-form-item label="封面图">
          <el-input
            v-model="form.cover_image"
            placeholder="请输入封面图URL（可选）"
          />
          <div v-if="form.cover_image" class="cover-preview">
            <el-image :src="form.cover_image" fit="cover" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            size="large"
            @click="handleSubmit"
          >
            保存修改
          </el-button>
          <el-button size="large" @click="handleCancel">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.post-edit-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .cover-preview {
    margin-top: 12px;
    width: 200px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;

    .el-image {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
