<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { interactionApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Notification } from '@/api/interaction'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const activeTab = ref('all')
const pagination = ref({
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0,
})

const formatDate = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, string> = {
    system: 'Bell',
    comment: 'ChatDotRound',
    reply: 'ChatLineRound',
    like: 'Star',
    follow: 'User',
    mention: 'At',
  }
  return icons[type] || 'Bell'
}

const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    system: '#909399',
    comment: '#409eff',
    reply: '#409eff',
    like: '#f56c6c',
    follow: '#67c23a',
    mention: '#e6a23c',
  }
  return colors[type] || '#909399'
}

const handleNotificationClick = async (notification: Notification) => {
  if (notification.is_read) return
  
  try {
    await interactionApi.markNotificationRead(notification.id)
    notification.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (error) {
    console.error('标记已读失败', error)
  }
  
  if (notification.target_type && notification.target_id) {
    const routes: Record<string, string> = {
      post: `/post/${notification.target_id}`,
      comment: `/post/${notification.target_id}`,
      user: `/user/${notification.target_id}`,
    }
    const targetRoute = routes[notification.target_type]
    if (targetRoute) {
      router.push(targetRoute)
    }
  }
}

const fetchNotifications = async () => {
  if (!userStore.isLoggedIn) return
  
  loading.value = true
  try {
    const isRead = activeTab.value === 'read' ? true : activeTab.value === 'unread' ? false : undefined
    const result = await interactionApi.getNotifications({
      page: pagination.value.page,
      size: pagination.value.size,
      is_read: isRead,
    })
    notifications.value = result.notifications
    pagination.value = result.pagination
  } catch (error: any) {
    ElMessage.error(error.message || '获取通知失败')
  } finally {
    loading.value = false
  }
}

const fetchUnreadCount = async () => {
  if (!userStore.isLoggedIn) return
  
  try {
    const result = await interactionApi.getUnreadCount()
    unreadCount.value = result.count
  } catch (error) {
    console.error('获取未读数失败', error)
  }
}

const handleTabChange = () => {
  pagination.value.page = 1
  fetchNotifications()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchNotifications()
}

const handleMarkAllRead = async () => {
  try {
    await interactionApi.markAllNotificationsRead()
    ElMessage.success('已全部标记为已读')
    notifications.value.forEach(n => n.is_read = true)
    unreadCount.value = 0
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

onMounted(() => {
  fetchNotifications()
  fetchUnreadCount()
})
</script>

<template>
  <div class="notification-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>通知中心</h2>
          <el-button 
            v-if="unreadCount > 0" 
            type="primary" 
            link 
            @click="handleMarkAllRead"
          >
            全部已读
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="未读" name="unread">
          <template #label>
            <span>
              未读
              <el-badge v-if="unreadCount > 0" :value="unreadCount" class="badge" />
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已读" name="read" />
      </el-tabs>

      <div v-loading="loading" class="notification-list">
        <div v-if="notifications.length === 0" class="empty-wrapper">
          <el-empty description="暂无通知" />
        </div>

        <div 
          v-else
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.is_read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <el-icon :size="24" :color="getNotificationColor(notification.type)">
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
          </div>
          
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-text">{{ notification.content }}</div>
            <div class="notification-time">{{ formatDate(notification.created_at) }}</div>
          </div>
          
          <div v-if="!notification.is_read" class="unread-dot" />
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
.notification-page {
  max-width: 800px;
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

    .badge {
      margin-left: 4px;
    }
  }

  .notification-list {
    min-height: 300px;

    .empty-wrapper {
      padding: 60px 0;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border-bottom: 1px solid var(--border-lighter);
      cursor: pointer;
      transition: background-color 0.3s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: var(--background-base);
      }

      &.unread {
        background-color: rgba(64, 158, 255, 0.05);

        .notification-title {
          font-weight: 600;
        }
      }

      .notification-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--background-light);
        border-radius: 50%;
        margin-right: 12px;
      }

      .notification-content {
        flex: 1;
        min-width: 0;

        .notification-title {
          font-size: 15px;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .notification-text {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .notification-time {
          font-size: 12px;
          color: var(--text-placeholder);
        }
      }

      .unread-dot {
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        background-color: #f56c6c;
        border-radius: 50%;
        margin-left: 12px;
        margin-top: 6px;
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
