<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { postApi, commentApi, categoryApi, interactionApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Post, Comment, Category } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const categories = ref<Category[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0,
})
const commentContent = ref('')
const submitting = ref(false)
const replyingTo = ref<number | null>(null)
const replyContent = ref('')
const replySubmitting = ref<Record<number, boolean>>({})
const isLiked = ref(false)
const isFavorited = ref(false)
const isFollowing = ref(false)
const likeLoading = ref(false)
const favoriteLoading = ref(false)
const followLoading = ref(false)
const commentLikes = ref<Record<number, boolean>>({})
const commentLikeLoading = ref<Record<number, boolean>>({})

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

const fetchPost = async () => {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const result = await postApi.getPostById(id)
    post.value = result
    if (userStore.isLoggedIn) {
      checkInteractionStatus()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取帖子详情失败')
  } finally {
    loading.value = false
  }
}

const checkInteractionStatus = async () => {
  const postId = Number(route.params.id)
  if (!postId || !userStore.isLoggedIn) return

  try {
    const [likedRes, favoritedRes] = await Promise.all([
      interactionApi.hasLikedPost(postId),
      interactionApi.hasFavoritedPost(postId),
    ])
    isLiked.value = likedRes.hasLiked
    isFavorited.value = favoritedRes.hasFavorited

    if (post.value?.author?.id && post.value.author.id !== userStore.user?.id) {
      const followRes = await interactionApi.hasFollowedUser(post.value.author.id)
      isFollowing.value = followRes.hasFollowed
    }
  } catch (error) {
    console.error('检查互动状态失败', error)
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (likeLoading.value) return
  likeLoading.value = true

  try {
    const postId = Number(route.params.id)
    await interactionApi.likePost(postId)
    isLiked.value = !isLiked.value
    if (post.value) {
      post.value.likes += isLiked.value ? 1 : -1
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    likeLoading.value = false
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (favoriteLoading.value) return
  favoriteLoading.value = true

  try {
    const postId = Number(route.params.id)
    const result = await interactionApi.favoritePost(postId)
    isFavorited.value = !!result.favorited
    if (post.value) {
      post.value.favorites_count += result.favorited ? 1 : -1
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    favoriteLoading.value = false
  }
}

const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!post.value?.author?.id || followLoading.value) return

  followLoading.value = true
  try {
    await interactionApi.followUser(post.value.author.id)
    isFollowing.value = !isFollowing.value
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    followLoading.value = false
  }
}

const checkCommentLikeStatus = async () => {
  if (!userStore.isLoggedIn) return
  
  try {
    for (const comment of comments.value) {
      const res = await interactionApi.hasLikedComment(comment.id)
      commentLikes.value[comment.id] = res.hasLiked
      
      if (comment.replies) {
        for (const reply of comment.replies) {
          const replyRes = await interactionApi.hasLikedComment(reply.id)
          commentLikes.value[reply.id] = replyRes.hasLiked
        }
      }
    }
  } catch (error) {
    console.error('检查评论点赞状态失败', error)
  }
}

const handleCommentLike = async (commentId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  if (commentLikeLoading.value[commentId]) return
  commentLikeLoading.value[commentId] = true
  
  try {
    await interactionApi.likeComment(commentId)
    commentLikes.value[commentId] = !commentLikes.value[commentId]
    
    const updateCommentLikes = (comments: Comment[]) => {
      for (const comment of comments) {
        if (comment.id === commentId) {
          comment.likes += commentLikes.value[commentId] ? 1 : -1
        }
        if (comment.replies) {
          updateCommentLikes(comment.replies)
        }
      }
    }
    updateCommentLikes(comments.value)
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    commentLikeLoading.value[commentId] = false
  }
}

const fetchComments = async () => {
  const postId = Number(route.params.id)
  if (!postId) return

  try {
    const result = await commentApi.getCommentsByPostId(postId, {
      page: pagination.value.page,
      size: pagination.value.size,
    })
    comments.value = result.comments
    pagination.value = result.pagination
    
    if (userStore.isLoggedIn) {
      await checkCommentLikeStatus()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取评论失败')
  }
}

const fetchCategories = async () => {
  try {
    const result = await categoryApi.getCategories(true)
    categories.value = result
  } catch (error: any) {
    console.error('获取版块失败', error)
  }
}

const handleSubmitComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  const postId = Number(route.params.id)
  if (!postId) return

  submitting.value = true
  try {
    await commentApi.createComment({
      post_id: postId,
      content: commentContent.value.trim(),
    })
    ElMessage.success('评论成功')
    commentContent.value = ''
    fetchComments()
  } catch (error: any) {
    ElMessage.error(error.message || '评论失败')
  } finally {
    submitting.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchComments()
}

const handleDeleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    await commentApi.deleteComment(commentId)
    ElMessage.success('删除成功')
    fetchComments()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const goToCategory = (categoryId: number) => {
  router.push(`/category/${categoryId}`)
}

const goToAuthor = (authorId: number) => {
  router.push(`/user/${authorId}`)
}

const handleEditPost = () => {
  const postId = Number(route.params.id)
  router.push(`/post/${postId}/edit`)
}

const handleDeletePost = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这条帖子吗？删除后无法恢复', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const postId = Number(route.params.id)
    await postApi.deletePost(postId)
    ElMessage.success('删除成功')
    router.push('/posts')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 开始回复
const startReply = (commentId: number) => {
  replyingTo.value = commentId
  replyContent.value = ''
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

// 提交回复
const submitReply = async (parentId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  const postId = Number(route.params.id)
  if (!postId) return

  replySubmitting.value[parentId] = true
  try {
    await commentApi.createComment({
      post_id: postId,
      content: replyContent.value.trim(),
      parent_id: parentId,
    })
    ElMessage.success('回复成功')
    replyContent.value = ''
    replyingTo.value = null
    fetchComments()
  } catch (error: any) {
    ElMessage.error(error.message || '回复失败')
  } finally {
    replySubmitting.value[parentId] = false
  }
}

onMounted(() => {
  fetchPost()
  fetchComments()
  fetchCategories()
})
</script>

<template>
  <div class="post-detail-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card class="post-card" v-loading="loading">
          <template v-if="post">
            <div class="post-header">
              <div class="post-title-row">
                <el-tag v-if="post.is_top" type="danger" size="small">置顶</el-tag>
                <el-tag v-if="post.is_essence" type="warning" size="small">精华</el-tag>
                <h1 class="post-title">{{ post.title }}</h1>
              </div>
              <div class="post-meta">
                <span class="author" @click="goToAuthor(post.author?.id || 0)">
                  <el-avatar :size="32" :src="post.author?.avatar">{{ post.author?.username?.charAt(0) }}</el-avatar>
                  <span class="username">{{ post.author?.nickname || post.author?.username }}</span>
                </span>
                <span class="time">
                  <el-icon><Timer /></el-icon>
                  {{ formatDate(post.created_at) }}
                </span>
                <span class="views">
                  <el-icon><View /></el-icon>
                  {{ formatViews(post.views) }} 阅读
                </span>
              </div>
            </div>

            <div class="post-content" v-html="post.content"></div>

            <div class="post-tags" v-if="post.tags && post.tags.length > 0">
              <el-tag
                v-for="tag in post.tags"
                :key="tag.id"
                :type="tag.color ? undefined : 'info'"
                :color="tag.color"
                class="tag-item"
              >
                {{ tag.name }}
              </el-tag>
            </div>

            <div class="post-actions">
              <el-button
                :type="isLiked ? 'primary' : 'default'"
                :loading="likeLoading"
                @click="handleLike"
              >
                <el-icon><Pointer /></el-icon>
                点赞 ({{ post?.likes }})
              </el-button>
              <el-button
                :type="isFavorited ? 'primary' : 'default'"
                :loading="favoriteLoading"
                @click="handleFavorite"
              >
                <el-icon><Star /></el-icon>
                收藏 ({{ post?.favorites_count }})
              </el-button>
              <el-button type="default">
                <el-icon><Share /></el-icon>
                分享
              </el-button>
              <template v-if="userStore.user?.id === post?.author?.id || userStore.isAdminOrModerator">
                <el-button type="primary" @click="handleEditPost">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" @click="handleDeletePost">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </div>
          </template>
        </el-card>

        <el-card class="comment-card">
          <template #header>
            <div class="card-header">
              <span>评论 ({{ pagination.total }})</span>
            </div>
          </template>

          <div class="comment-form" v-if="userStore.isLoggedIn">
            <el-avatar :size="40" :src="userStore.user?.avatar">{{ userStore.user?.username?.charAt(0) }}</el-avatar>
            <div class="comment-input-wrapper">
              <el-input
                v-model="commentContent"
                type="textarea"
                :rows="3"
                placeholder="写下你的评论..."
                maxlength="1000"
                show-word-limit
              />
              <el-button
                type="primary"
                :loading="submitting"
                @click="handleSubmitComment"
              >
                发布评论
              </el-button>
            </div>
          </div>
          <div class="comment-login-tip" v-else>
            <el-link type="primary" @click="router.push('/login')">登录</el-link>
            后才能评论
          </div>

          <div class="comment-list" v-if="comments.length > 0">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-author">
                <el-avatar :size="36" :src="comment.author?.avatar">{{ comment.author?.username?.charAt(0) }}</el-avatar>
                <div class="author-info">
                  <span class="username">{{ comment.author?.nickname || comment.author?.username }}</span>
                  <span class="time">{{ formatDate(comment.created_at) }}</span>
                </div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              <div class="comment-actions">
                <el-button 
                  size="small"
                  :type="commentLikes[comment.id] ? 'primary' : 'default'"
                  :loading="commentLikeLoading[comment.id]"
                  @click="handleCommentLike(comment.id)"
                >
                  <el-icon><Pointer /></el-icon>
                  {{ comment.likes }}
                </el-button>
                <el-button type="text" size="small" @click="startReply(comment.id)">回复</el-button>
                <el-button 
                  v-if="userStore.user?.id === comment.user_id || userStore.isAdminOrModerator"
                  type="text" 
                  size="small"
                  danger
                  @click="handleDeleteComment(comment.id)"
                >
                  删除
                </el-button>
              </div>

              <!-- 回复输入框 -->
              <div v-if="replyingTo === comment.id" class="reply-form">
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  :placeholder="`回复 ${comment.author?.nickname || comment.author?.username}...`"
                  maxlength="1000"
                  show-word-limit
                />
                <div class="reply-actions">
                  <el-button size="small" @click="cancelReply">取消</el-button>
                  <el-button 
                    type="primary" 
                    size="small"
                    :loading="replySubmitting[comment.id]"
                    @click="submitReply(comment.id)"
                  >
                    发布回复
                  </el-button>
                </div>
              </div>

<div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
                  <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                    <span class="reply-author">{{ reply.author?.nickname || reply.author?.username }}:</span>
                    <span class="reply-content">{{ reply.content }}</span>
                    <el-button 
                      size="small"
                      :type="commentLikes[reply.id] ? 'primary' : 'default'"
                      :loading="commentLikeLoading[reply.id]"
                      @click.stop="handleCommentLike(reply.id)"
                      class="reply-like-btn"
                    >
                      <el-icon><Pointer /></el-icon>
                      {{ reply.likes }}
                    </el-button>
                    <el-button 
                      v-if="userStore.user?.id === reply.user_id || userStore.isAdminOrModerator"
                      type="text" 
                      size="small"
                      danger
                      @click.stop="handleDeleteComment(reply.id)"
                      class="reply-delete-btn"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
            </div>
          </div>
          <el-empty v-else description="暂无评论，快来抢沙发~" />

          <div class="pagination-wrapper" v-if="pagination.totalPages > 1">
            <el-pagination
              v-model:current-page="pagination.page"
              :page-size="pagination.size"
              :total="pagination.total"
              layout="prev, pager, next"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card class="author-card" v-if="post">
          <template #header>
            <span>作者</span>
          </template>
          <div class="author-info" @click="goToAuthor(post.author?.id || 0)">
            <el-avatar :size="64" :src="post.author?.avatar">{{ post.author?.username?.charAt(0) }}</el-avatar>
            <div class="author-details">
              <span class="name">{{ post.author?.nickname || post.author?.username }}</span>
              <span class="bio">{{ post.author?.bio || '这个用户很懒，什么都没写~' }}</span>
            </div>
          </div>
          <div class="author-actions" v-if="post.author?.id && post.author.id !== userStore.user?.id">
            <el-button
              :type="isFollowing ? 'primary' : 'default'"
              :loading="followLoading"
              size="small"
              @click="handleFollow"
            >
              {{ isFollowing ? '已关注' : '关注' }}
            </el-button>
          </div>
        </el-card>

        <el-card class="category-card">
          <template #header>
            <span>版块</span>
          </template>
          <div
            class="category-item"
            v-if="post?.category"
            @click="goToCategory(post.category.id)"
          >
            <el-icon size="24"><Folder /></el-icon>
            <span>{{ post.category.name }}</span>
          </div>
        </el-card>

        <el-card class="categories-card">
          <template #header>
            <span>热门版块</span>
          </template>
          <div class="category-list">
            <div
              v-for="cat in categories.slice(0, 5)"
              :key="cat.id"
              class="category-item"
              @click="goToCategory(cat.id)"
            >
              <el-icon size="20"><Folder /></el-icon>
              <span>{{ cat.name }}</span>
              <span class="post-count">{{ cat.post_count }} 帖子</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.post-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.post-card {
  margin-bottom: 20px;

  .post-header {
    margin-bottom: 20px;

    .post-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;

      .post-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.4;
      }
    }

    .post-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 14px;
      color: var(--text-secondary);

      .author {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .username {
          font-weight: 500;
          color: var(--text-primary);
        }
      }

      .time,
      .views {
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }

  .post-content {
    min-height: 200px;
    padding: 20px 0;
    font-size: 16px;
    line-height: 1.8;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-lighter);

    :deep(img) {
      max-width: 100%;
      height: auto;
    }

    :deep(pre) {
      background: var(--background-base);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }

    :deep(code) {
      background: var(--background-base);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 14px;
    }
  }

  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px 0;

    .tag-item {
      border: none;
      color: white;
    }
  }

  .post-actions {
    display: flex;
    gap: 12px;
    padding-top: 16px;
  }
}

.comment-card {
  .comment-form {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;

    .comment-input-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .el-button {
        align-self: flex-end;
      }
    }
  }

  .comment-login-tip {
    text-align: center;
    padding: 20px;
    color: var(--text-secondary);
  }

  .comment-list {
    .comment-item {
      padding: 16px 0;
      border-bottom: 1px solid var(--border-lighter);

      &:last-child {
        border-bottom: none;
      }

      .comment-author {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .author-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .username {
            font-weight: 500;
            color: var(--text-primary);
          }

          .time {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
      }

      .comment-content {
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-primary);
        margin-bottom: 12px;
      }

      .comment-actions {
        display: flex;
        gap: 16px;
      }

      .reply-form {
        margin-top: 12px;
        padding: 12px;
        background: var(--background-base);
        border-radius: 8px;

        .reply-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }
      }

      .comment-replies {
        margin-top: 12px;
        padding: 12px;
        background: var(--background-base);
        border-radius: 8px;

        .reply-item {
          font-size: 14px;
          line-height: 1.6;
          padding: 4px 0;
          display: flex;
          align-items: center;
          gap: 8px;

          .reply-author {
            color: var(--primary-color);
            font-weight: 500;
          }

          .reply-content {
            flex: 1;
            color: var(--text-primary);
          }
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

.author-card {
  margin-bottom: 20px;

  .author-info {
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;

    .author-details {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .bio {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }

  .author-actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-lighter);
    display: flex;
    justify-content: center;
  }
}

.category-card {
  margin-bottom: 20px;

  .category-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--background-base);
    }

    .el-icon {
      color: var(--primary-color);
    }

    span {
      font-size: 14px;
      color: var(--text-primary);
    }
  }
}

.categories-card {
  .category-list {
    .category-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.3s;

      &:hover {
        background-color: var(--background-base);
      }

      .el-icon {
        color: var(--primary-color);
      }

      span {
        font-size: 14px;
        color: var(--text-primary);
      }

      .post-count {
        margin-left: auto;
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }
}
</style>
