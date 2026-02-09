<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { interactionApi } from '@/api'
import { useUserStore } from '@/stores/user'

interface FavoritePost {
  id: number
  title: string
  excerpt: string
  views: number
  likes: number
  comments_count: number
  created_at: string
  author?: {
    id: number
    username: string
    nickname: string
    avatar: string | null
  }
  category?: {
    id: number
    name: string
  }
}

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const favorites = ref<FavoritePost[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0,
})

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
  if (views >= 10000) return (views / 10000).toFixed(1) + '万'
  if (views >= 1000) return (views / 1000).toFixed(1) + 'k'
  return views.toString()
}

const formatLikes = (likes: number) => {
  if (likes >= 10000) return (likes / 10000).toFixed(1) + '万'
  if (likes >= 1000) return (likes / 1000).toFixed(1) + 'k'
  return likes.toString()
}

const goToPost = (id: number) => {
  router.push(`/post/${id}`)
}

const goToAuthor = (id: number) => {
  router.push(`/user/${id}`)
}

const handleCancelFavorite = async (postId: number, index: number) => {
  try {
    await interactionApi.favoritePost(postId)
    ElMessage.success('已取消收藏')
    favorites.value.splice(index, 1)
    pagination.value.total = Math.max(0, pagination.value.total - 1)
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const fetchFavorites = async () => {
  if (!userStore.isLoggedIn) return

  loading.value = true
  try {
    const result = await interactionApi.getUserFavorites({
      page: pagination.value.page,
      size: pagination.value.size,
    })
    favorites.value = result.favorites.map((f: any) => f.post).filter(Boolean)
    pagination.value = result.pagination
  } catch (error: any) {
    ElMessage.error(error.message || '获取收藏失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchFavorites()
}

onMounted(() => {
  fetchFavorites()
})
</script>

<template>
  <div class="favorites-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>我的收藏</h2>
          <span class="total-count">共 {{ pagination.total }} 篇</span>
        </div>
      </template>

      <div v-loading="loading" class="favorites-list">
        <div v-if="favorites.length === 0" class="empty-wrapper">
          <el-empty description="暂无收藏" />
        </div>

        <div v-else class="favorite-item" v-for="(item, index) in favorites" :key="item.id">
          <div class="favorite-content" @click="goToPost(item.id)">
            <div class="post-title">{{ item.title }}</div>
            <div class="post-excerpt">{{ item.excerpt }}</div>
            <div class="post-meta">
              <span class="author" @click.stop="goToAuthor(item.author?.id || 0)">
                <el-avatar :size="20" :src="item.author?.avatar">
                  {{ item.author?.username?.charAt(0) }}
                </el-avatar>
                {{ item.author?.nickname || item.author?.username }}
              </span>
              <span class="category" v-if="item.category">
                <el-icon><Folder /></el-icon>
                {{ item.category.name }}
              </span>
              <span class="time">
                <el-icon><Timer /></el-icon>
                {{ formatDate(item.created_at) }}
              </span>
            </div>
          </div>
          
          <div class="favorite-stats">
            <span class="stat-item">
              <el-icon><View /></el-icon>
              {{ formatViews(item.views) }}
            </span>
            <span class="stat-item">
              <el-icon><Pointer /></el-icon>
              {{ formatLikes(item.likes) }}
            </span>
            <span class="stat-item">
              <el-icon><ChatLineRound /></el-icon>
              {{ item.comments_count }}
            </span>
          </div>

          <div class="favorite-actions">
            <el-button 
              type="danger" 
              size="small" 
              plain
              @click="handleCancelFavorite(item.id, index)"
            >
              取消收藏
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.size"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.favorites-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .total-count {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }

  .favorites-list {
    min-height: 300px;

    .empty-wrapper {
      padding: 60px 0;
    }

    .favorite-item {
      display: flex;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--border-lighter);
      transition: background-color 0.3s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: var(--background-base);
      }

      .favorite-content {
        flex: 1;
        min-width: 0;
        cursor: pointer;

        .post-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .post-excerpt {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 12px;
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
            cursor: pointer;

            &:hover {
              color: var(--primary-color);
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

      .favorite-stats {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        margin: 0 20px;
        padding: 0 20px;
        border-left: 1px solid var(--border-lighter);
        border-right: 1px solid var(--border-lighter);

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

      .favorite-actions {
        flex-shrink: 0;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border-lighter);
  }
}
</style>
