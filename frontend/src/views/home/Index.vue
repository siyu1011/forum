<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { postApi, categoryApi } from '@/api'
import type { Post, Category } from '@/types'

const router = useRouter()

const loading = ref(false)
const hotPosts = ref<Post[]>([])
const latestPosts = ref<Post[]>([])
const categories = ref<Category[]>([])

const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'k'
  }
  return views.toString()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchHotPosts = async () => {
  try {
    const result = await postApi.getHotPosts(5)
    hotPosts.value = result
  } catch (error) {
    console.error('获取热门帖子失败', error)
  }
}

const fetchLatestPosts = async () => {
  try {
    const result = await postApi.getLatestPosts(5)
    latestPosts.value = result
  } catch (error) {
    console.error('获取最新帖子失败', error)
  }
}

const fetchCategories = async () => {
  try {
    const result = await categoryApi.getCategories(true)
    categories.value = result
  } catch (error) {
    console.error('获取版块失败', error)
  }
}

onMounted(() => {
  loading.value = true
  Promise.all([fetchHotPosts(), fetchLatestPosts(), fetchCategories()])
    .finally(() => {
      loading.value = false
    })
})
</script>

<template>
  <div class="home-page">
    <div class="welcome-section">
      <h1>欢迎来到社区论坛</h1>
      <p>一个分享知识、交流经验的社区平台</p>
      <el-button type="primary" size="large" @click="$router.push('/post/create')">
        <el-icon><Edit /></el-icon>
        发布你的第一篇帖子
      </el-button>
    </div>

    <el-row :gutter="20">
      <!-- 左侧内容区 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <!-- 热门帖子 -->
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><TrendCharts /></el-icon> 热门帖子</span>
              <el-button text @click="$router.push('/posts')">查看更多</el-button>
            </div>
          </template>
          
          <div v-if="loading" class="loading-wrapper">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="hotPosts.length === 0" class="empty-wrapper">
            <el-empty description="暂无热门帖子" />
          </div>
          
          <div v-else class="post-list">
            <div 
              v-for="post in hotPosts" 
              :key="post.id" 
              class="post-item"
              @click="$router.push(`/post/${post.id}`)"
            >
              <div class="post-title">{{ post.title }}</div>
              <div class="post-meta">
                <span><el-icon><User /></el-icon> {{ post.author?.nickname || post.author?.username }}</span>
                <span><el-icon><View /></el-icon> {{ formatViews(post.views) }}</span>
                <span><el-icon><Pointer /></el-icon> {{ formatViews(post.likes) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 最新帖子 -->
        <el-card class="section-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span><el-icon><Timer /></el-icon> 最新帖子</span>
              <el-button text @click="$router.push('/posts')">查看更多</el-button>
            </div>
          </template>
          
          <div v-if="loading" class="loading-wrapper">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="latestPosts.length === 0" class="empty-wrapper">
            <el-empty description="暂无最新帖子" />
          </div>
          
          <div v-else class="post-list">
            <div 
              v-for="post in latestPosts" 
              :key="post.id" 
              class="post-item"
              @click="$router.push(`/post/${post.id}`)"
            >
              <div class="post-title">{{ post.title }}</div>
              <div class="post-meta">
                <span><el-icon><User /></el-icon> {{ post.author?.nickname || post.author?.username }}</span>
                <span><el-icon><Timer /></el-icon> {{ formatDate(post.created_at) }}</span>
                <span><el-icon><View /></el-icon> {{ formatViews(post.views) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧边栏 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <!-- 版块列表 -->
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Grid /></el-icon> 热门版块</span>
            </div>
          </template>
          
          <div v-if="loading" class="loading-wrapper">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="categories.length === 0" class="empty-wrapper">
            <el-empty description="暂无版块" />
          </div>
          
          <div v-else class="category-list">
            <div 
              v-for="cat in categories" 
              :key="cat.id" 
              class="category-item"
              @click="$router.push(`/category/${cat.id}`)"
            >
              <el-icon size="20"><component :is="cat.icon || 'Folder'" /></el-icon>
              <div class="category-info">
                <div class="category-name">{{ cat.name }}</div>
                <div class="category-count">{{ cat.post_count }} 帖子</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 社区公告 -->
        <el-card class="section-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span><el-icon><Bell /></el-icon> 社区公告</span>
            </div>
          </template>
          
          <div class="notice-list">
            <div class="notice-item">
              <el-tag type="danger" size="small">重要</el-tag>
              <span>欢迎使用社区论坛！</span>
            </div>
            <div class="notice-item">
              <el-tag type="info" size="small">通知</el-tag>
              <span>请遵守社区规范</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  padding: 40px 20px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  
  h1 {
    margin: 0 0 12px 0;
    font-size: 32px;
  }
  
  p {
    margin: 0 0 24px 0;
    font-size: 16px;
    opacity: 0.9;
  }
}

.section-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    
    .el-icon {
      margin-right: 5px;
      vertical-align: middle;
    }
  }
}

.post-list {
  .post-item {
    padding: 16px 0;
    border-bottom: 1px solid var(--border-lighter);
    cursor: pointer;
    transition: background-color 0.3s;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: var(--background-base);
      margin: 0 -20px;
      padding: 16px 20px;
    }
    
    .post-title {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    
    .post-meta {
      font-size: 13px;
      color: var(--text-secondary);
      
      span {
        margin-right: 16px;
        
        .el-icon {
          margin-right: 3px;
          vertical-align: middle;
        }
      }
    }
  }
}

.category-list {
  .category-item {
    display: flex;
    align-items: center;
    padding: 12px;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: var(--background-base);
    }
    
    .el-icon {
      margin-right: 12px;
      color: var(--primary-color);
    }
    
    .category-info {
      flex: 1;
      
      .category-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .category-count {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
    }
  }
}

.notice-list {
  .notice-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-lighter);
    
    &:last-child {
      border-bottom: none;
    }
    
    span {
      font-size: 14px;
      color: var(--text-regular);
    }
  }
}

.loading-wrapper {
  padding: 20px;
}

.empty-wrapper {
  padding: 40px 0;
}
</style>