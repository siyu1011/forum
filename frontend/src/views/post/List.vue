<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postApi } from '@/api'
import type { Post } from '@/types'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const posts = ref<Post[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0,
})
const sort = ref('created_at')
const order = ref<'ASC' | 'DESC'>('DESC')

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'k'
  }
  return views.toString()
}

const formatLikes = (likes: number) => {
  if (likes >= 10000) {
    return (likes / 10000).toFixed(1) + '万'
  } else if (likes >= 1000) {
    return (likes / 1000).toFixed(1) + 'k'
  }
  return likes.toString()
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const result = await postApi.getPosts({
      page: pagination.value.page,
      size: pagination.value.size,
      sort: sort.value,
      order: order.value,
      category_id: route.query.category_id ? Number(route.query.category_id) : undefined,
    })
    posts.value = result.posts
    pagination.value = result.pagination
  } catch (error: any) {
    ElMessage.error(error.message || '获取帖子列表失败')
  } finally {
    loading.value = false
  }
}

const handleSortChange = (value: string) => {
  if (value === 'latest') {
    sort.value = 'created_at'
    order.value = 'DESC'
  } else if (value === 'hottest') {
    sort.value = 'views'
    order.value = 'DESC'
  }
  fetchPosts()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchPosts()
}

const handleSizeChange = (size: number) => {
  pagination.value.size = size
  pagination.value.page = 1
  fetchPosts()
}

const goToPostDetail = (id: number) => {
  router.push(`/post/${id}`)
}

onMounted(() => {
  fetchPosts()
})
</script>

<template>
  <div class="post-list-page">
    <el-card class="filter-card">
      <div class="filter-row">
        <el-radio-group v-model="sort" @change="handleSortChange">
          <el-radio-button value="latest">最新</el-radio-button>
          <el-radio-button value="hottest">最热</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <el-card class="post-card">
      <template #header>
        <div class="card-header">
          <span>帖子列表</span>
          <span class="total-count">共 {{ pagination.total }} 篇帖子</span>
        </div>
      </template>

      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="posts.length === 0" class="empty-wrapper">
        <el-empty description="暂无帖子" />
      </div>

      <div v-else class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item"
          @click="goToPostDetail(post.id)"
        >
          <div class="post-content">
            <div class="post-title-row">
              <el-tag v-if="post.is_top" type="danger" size="small" class="top-tag">置顶</el-tag>
              <el-tag v-if="post.is_essence" type="warning" size="small" class="essence-tag">精华</el-tag>
              <h3 class="post-title">{{ post.title }}</h3>
            </div>
            <p class="post-excerpt">{{ post.excerpt }}</p>
            <div class="post-meta">
              <span class="author">
                <el-avatar :size="20" :src="post.author?.avatar">{{ post.author?.username?.charAt(0) }}</el-avatar>
                {{ post.author?.nickname || post.author?.username }}
              </span>
              <span class="category" v-if="post.category">
                <el-icon><Folder /></el-icon>
                {{ post.category.name }}
              </span>
              <span class="time">
                <el-icon><Timer /></el-icon>
                {{ formatDate(post.created_at) }}
              </span>
            </div>
          </div>
          <div class="post-stats">
            <span class="stat-item">
              <el-icon><View /></el-icon>
              {{ formatViews(post.views) }}
            </span>
            <span class="stat-item">
              <el-icon><Pointer /></el-icon>
              {{ formatLikes(post.likes) }}
            </span>
            <span class="stat-item">
              <el-icon><ChatLineRound /></el-icon>
              {{ post.comments_count }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <div class="pagination-wrapper" v-if="pagination.totalPages > 1">
      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.post-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
  
  .filter-row {
    display: flex;
    gap: 10px;
  }
}

.post-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .total-count {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

.loading-wrapper,
.empty-wrapper {
  padding: 40px 0;
}

.post-list {
  .post-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 0;
    border-bottom: 1px solid var(--border-lighter);
    cursor: pointer;
    transition: background-color 0.3s;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: var(--background-base);
      margin: 0 -20px;
      padding: 20px;
    }
    
    .post-content {
      flex: 1;
      min-width: 0;
      
      .post-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        
        .top-tag,
        .essence-tag {
          flex-shrink: 0;
        }
        
        .post-title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      
      .post-excerpt {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .post-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 13px;
        color: var(--text-secondary);
        
        .author {
          display: flex;
          align-items: center;
          gap: 6px;
          
          .el-avatar {
            flex-shrink: 0;
          }
        }
        
        .category,
        .time {
          display: flex;
          align-items: center;
          gap: 4px;
          
          .el-icon {
            font-size: 14px;
          }
        }
      }
    }
    
    .post-stats {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-left: 20px;
      padding-left: 20px;
      border-left: 1px solid var(--border-lighter);
      min-width: 60px;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: var(--text-secondary);
        
        .el-icon {
          font-size: 14px;
        }
      }
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding: 20px 0;
}
</style>
