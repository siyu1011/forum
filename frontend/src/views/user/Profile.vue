<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi, interactionApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { User, Post } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const profileUser = ref<User | null>(null)
const posts = ref<Post[]>([])
const followers = ref<any[]>([])
const following = ref<any[]>([])
const stats = ref({ followersCount: 0, followingCount: 0 })
const activeTab = ref('posts')
const isFollowing = ref(false)
const isCurrentUser = computed(() => userStore.user?.id === profileUser.value?.id)

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchProfile = async () => {
  const userId = Number(route.params.id) || userStore.user?.id
  if (!userId) return

  loading.value = true
  try {
    const user = await userApi.getUserById(userId)
    profileUser.value = user
    fetchUserData(userId)
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户信息失败')
  } finally {
    loading.value = false
  }
}

const fetchUserData = async (userId: number) => {
  try {
    const [followersRes, followingRes, statsRes] = await Promise.all([
      interactionApi.getUserFollowers(userId, { size: 10 }),
      interactionApi.getUserFollowing(userId, { size: 10 }),
      interactionApi.getUserStats(userId),
    ])
    stats.value = statsRes
    followers.value = followersRes.followers.map((item: any) => ({
      ...item.followerInfo,
      followed_at: item.created_at
    }))
    following.value = followingRes.following.map((item: any) => ({
      ...item.followingInfo,
      followed_at: item.created_at
    }))

    if (userStore.isLoggedIn && !isCurrentUser.value) {
      const followRes = await interactionApi.hasFollowedUser(userId)
      isFollowing.value = followRes.hasFollowed
    }
  } catch (error) {
    console.error('获取用户数据失败', error)
  }
}

const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!profileUser.value?.id) return

  try {
    await interactionApi.followUser(profileUser.value.id)
    isFollowing.value = !isFollowing.value
    fetchUserData(profileUser.value.id)
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="user-profile-page">
    <el-card v-loading="loading">
      <div class="profile-header">
        <el-avatar :size="100" :src="profileUser?.avatar || ''">
          {{ profileUser?.username?.charAt(0) }}
        </el-avatar>
        <div class="profile-info">
          <h2>{{ profileUser?.nickname || profileUser?.username }}</h2>
          <p class="username">@{{ profileUser?.username }}</p>
          <p class="bio" v-if="profileUser?.bio">{{ profileUser?.bio }}</p>
          <div class="profile-meta">
            <span><el-icon><Timer /></el-icon> 注册于 {{ formatDate(profileUser?.created_at || '') }}</span>
          </div>
        </div>
        <div class="profile-actions" v-if="!isCurrentUser && profileUser">
          <el-button
            :type="isFollowing ? 'primary' : 'default'"
            @click="handleFollow"
          >
            {{ isFollowing ? '已关注' : '关注' }}
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="profile-stats">
        <div class="stat-item" @click="activeTab = 'posts'">
          <div class="stat-value">{{ profileUser?.post_count || 0 }}</div>
          <div class="stat-label">帖子</div>
        </div>
        <div class="stat-item" @click="activeTab = 'followers'">
          <div class="stat-value">{{ stats.followersCount }}</div>
          <div class="stat-label">粉丝</div>
        </div>
        <div class="stat-item" @click="activeTab = 'following'">
          <div class="stat-value">{{ stats.followingCount }}</div>
          <div class="stat-label">关注</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ profileUser?.reputation || 0 }}</div>
          <div class="stat-label">声望</div>
        </div>
      </div>
    </el-card>

    <el-card class="content-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="帖子" name="posts">
          <el-empty description="暂无帖子" v-if="!posts.length" />
        </el-tab-pane>

        <el-tab-pane label="粉丝" name="followers">
          <div class="user-list" v-if="followers.length > 0">
            <div
              v-for="item in followers"
              :key="item.id"
              class="user-item"
              @click="router.push(`/user/${item.id}`)"
            >
              <el-avatar :size="48" :src="item.avatar">
                {{ item.username?.charAt(0) }}
              </el-avatar>
              <div class="user-info">
                <span class="name">{{ item.nickname || item.username }}</span>
                <span class="bio">{{ item.bio || '这个用户很懒，什么都没写~' }}</span>
              </div>
            </div>
          </div>
          <el-empty description="暂无粉丝" v-else />
        </el-tab-pane>

        <el-tab-pane label="关注" name="following">
          <div class="user-list" v-if="following.length > 0">
            <div
              v-for="item in following"
              :key="item.id"
              class="user-item"
              @click="router.push(`/user/${item.id}`)"
            >
              <el-avatar :size="48" :src="item.avatar">
                {{ item.username?.charAt(0) }}
              </el-avatar>
              <div class="user-info">
                <span class="name">{{ item.nickname || item.username }}</span>
                <span class="bio">{{ item.bio || '这个用户很懒，什么都没写~' }}</span>
              </div>
            </div>
          </div>
          <el-empty description="暂无关注" v-else />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.user-profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;

  .profile-info {
    flex: 1;

    h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
    }

    .username {
      color: var(--text-secondary);
      margin: 0 0 8px 0;
    }

    .bio {
      color: var(--text-regular);
      margin: 0 0 12px 0;
    }

    .profile-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--text-secondary);

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .profile-actions {
    display: flex;
    gap: 8px;
  }
}

.profile-stats {
  display: flex;
  justify-content: space-around;

  .stat-item {
    text-align: center;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 8px;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--background-base);
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: var(--primary-color);
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
  }
}

.content-card {
  margin-top: 20px;
}

.user-list {
  .user-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--background-base);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .name {
        font-weight: 500;
        color: var(--text-primary);
      }

      .bio {
        font-size: 13px;
        color: var(--text-secondary);
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
