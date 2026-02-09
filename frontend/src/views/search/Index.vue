<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postApi, categoryApi } from '@/api'
import type { Post, Category } from '@/types'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const searchKeyword = ref('')
const posts = ref<Post[]>([])
const categories = ref<Category[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0,
})

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

const doSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  try {
    const result = await postApi.searchPosts({
      q: searchKeyword.value.trim(),
      page: pagination.value.page,
      size: pagination.value.size,
    })
    posts.value = result.posts
    pagination.value = result.pagination
  } catch (error: any) {
    ElMessage.error(error.message || '搜索失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  doSearch()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  doSearch()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToPost = (postId: number) => {
  router.push(`/post/${postId}`)
}

const goToCategory = (categoryId: number) => {
  router.push(`/category/${categoryId}`)
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
  const keyword = route.query.q as string
  if (keyword) {
    searchKeyword.value = keyword
    doSearch()
  }
  fetchCategories()
})

watch(() => route.query.q, (newKeyword) => {
  if (newKeyword && typeof newKeyword === 'string') {
    searchKeyword.value = newKeyword
    pagination.value.page = 1
    doSearch()
  }
})
</script>

<template>
  <div class="search-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card class="search-card">
          <template #header>
            <div class="search-header">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索帖子..."
                size="large"
                @keyup.enter="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </div>
          </template>

          <div v-if="loading" class="loading-wrapper">
            <el-skeleton :rows="5" animated />
          </div>

          <div v-else-if="posts.length === 0" class="empty-wrapper">
            <el-empty description="未找到相关帖子">
              <template v-if="searchKeyword">
                <p>没有找到包含 "{{ searchKeyword }}" 的帖子</p>
                <el-button type="primary" @click="handleSearch">重新搜索</el-button>
              </template>
              <template v-else>
                <p>请输入关键词搜索帖子</p>
              </template>
            </el-empty>
          </div>

          <div v-else class="search-results">
            <div class="results-header">
              <span>找到 {{ pagination.total }} 条相关帖子</span>
            </div>

            <div class="post-list">
              <div 
                v-for="post in posts" 
                :key="post.id" 
                class="post-item"
                @click="goToPost(post.id)"
              >
                <div class="post-title">
                  <el-tag v-if="post.is_top" type="danger" size="small">置顶</el-tag>
                  <el-tag v-if="post.is_essence" type="warning" size="small">精华</el-tag>
                  <span>{{ post.title }}</span>
                </div>
                <div class="post-excerpt">{{ post.excerpt }}</div>
                <div class="post-meta">
                  <span class="author">
                    <el-avatar :size="20" :src="post.author?.avatar">
                      {{ post.author?.username?.charAt(0) }}
                    </el-avatar>
                    {{ post.author?.nickname || post.author?.username }}
                  </span>
                  <span class="category" @click.stop="goToCategory(post.category_id)">
                    <el-icon><Folder /></el-icon>
                    {{ post.category?.name || '默认版块' }}
                  </span>
                  <span class="time">
                    <el-icon><Timer /></el-icon>
                    {{ formatDate(post.created_at) }}
                  </span>
                  <span class="views">
                    <el-icon><View /></el-icon>
                    {{ formatViews(post.views) }}
                  </span>
                  <span class="comments">
                    <el-icon><ChatDotRound /></el-icon>
                    {{ post.comments_count }}
                  </span>
                </div>
              </div>
            </div>

            <div class="pagination-wrapper" v-if="pagination.totalPages > 1">
              <el-pagination
                v-model:current-page="pagination.page"
                :page-size="pagination.size"
                :total="pagination.total"
                layout="prev, pager, next"
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card class="category-card">
          <template #header>
            <span>版块分类</span>
          </template>
          <div class="category-list">
            <div 
              v-for="cat in categories" 
              :key="cat.id" 
              class="category-item"
              @click="goToCategory(cat.id)"
            >
              <el-icon size="20" :style="{ color: cat.color }">
                <component :is="cat.icon || 'Folder'" />
              </el-icon>
              <span>{{ cat.name }}</span>
              <span class="post-count">{{ cat.post_count }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="tips-card">
          <template #header>
            <span>搜索提示</span>
          </template>
          <div class="tips-list">
            <div class="tip-item">
              <el-icon><InfoFilled /></el-icon>
              <span>输入关键词搜索帖子标题和内容</span>
            </div>
            <div class="tip-item">
              <el-icon><InfoFilled /></el-icon>
              <span>使用引号搜索精确短语</span>
            </div>
            <div class="tip-item">
              <el-icon><InfoFilled /></el-icon>
              <span>可以按版块筛选搜索结果</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.search-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-card {
  .search-header {
    max-width: 600px;
  }

  .results-header {
    padding: 12px 0;
    color: var(--text-secondary);
    font-size: 14px;
    border-bottom: 1px solid var(--border-lighter);
    margin-bottom: 16px;
  }

  .post-list {
    .post-item {
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

      .post-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;

        .el-tag {
          flex-shrink: 0;
        }
      }

      .post-excerpt {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .post-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 13px;
        color: var(--text-secondary);

        span {
          display: flex;
          align-items: center;
          gap: 4px;

          &.author {
            .el-avatar {
              flex-shrink: 0;
            }
          }

          &.category {
            cursor: pointer;
            color: var(--primary-color);

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}

.category-card {
  margin-bottom: 20px;

  .category-list {
    .category-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.3s;

      &:hover {
        background-color: var(--background-base);
      }

      .el-icon {
        flex-shrink: 0;
      }

      span {
        flex: 1;
        font-size: 14px;
      }

      .post-count {
        color: var(--text-secondary);
        font-size: 12px;
      }
    }
  }
}

.tips-card {
  .tips-list {
    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 0;
      font-size: 13px;
      color: var(--text-secondary);

      .el-icon {
        color: var(--info-color);
        margin-top: 2px;
      }
    }
  }
}

.loading-wrapper {
  padding: 40px 0;
}

.empty-wrapper {
  padding: 40px 0;
}
</style>
