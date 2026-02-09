<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { interactionApi } from '@/api'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const unreadCount = ref(0)
const searchKeyword = ref('')

const fetchUnreadCount = async () => {
  if (!userStore.isLoggedIn) {
    unreadCount.value = 0
    return
  }
  
  try {
    const result = await interactionApi.getUnreadCount()
    unreadCount.value = result.count
  } catch (error) {
    console.error('获取未读通知数失败', error)
  }
}

watch(() => userStore.isLoggedIn, () => {
  fetchUnreadCount()
}, { immediate: true })

onMounted(() => {
  fetchUnreadCount()
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch {
    // 用户取消
  }
}

const navigateTo = (path: string) => {
  router.push(path)
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { q: searchKeyword.value.trim() } })
    searchKeyword.value = ''
  }
}
</script>

<template>
  <div class="header-wrapper">
    <div class="logo-section" @click="navigateTo('/')">
      <el-icon size="32" color="#409eff"><ChatDotRound /></el-icon>
      <span class="logo-text">社区论坛</span>
    </div>
    
<div class="nav-section">
        <el-menu
          mode="horizontal"
          :ellipsis="false"
          router
          :default-active="$route.path"
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/posts">帖子</el-menu-item>
        </el-menu>
      </div>
      
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索帖子..."
          size="small"
          @keyup.enter="handleSearch"
          @click.stop
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    
      <div class="user-section">
        <template v-if="userStore.isLoggedIn">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button circle @click="navigateTo('/notifications')">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          
          <el-button type="primary" @click="navigateTo('/post/create')">
            <el-icon><Plus /></el-icon>
            发布帖子
          </el-button>
          
          <el-dropdown>
          <span class="user-info">
            <el-avatar 
              :size="32" 
              :src="userStore.user?.avatar || ''"
            >
              {{ userStore.displayName.charAt(0) }}
            </el-avatar>
            <span class="username">{{ userStore.displayName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="navigateTo('/profile')">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/notifications')">
                  <el-icon><Bell /></el-icon>
                  通知中心
                  <el-badge v-if="unreadCount > 0" :value="unreadCount" class="dropdown-badge" />
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/favorites')">
                  <el-icon><Star /></el-icon>
                  我的收藏
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/settings')">
                  <el-icon><Setting /></el-icon>
                  账号设置
                </el-dropdown-item>
                <el-dropdown-item 
                  v-if="userStore.isAdminOrModerator" 
                  @click="navigateTo('/admin/dashboard')"
                >
                  <el-icon><DataAnalysis /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
        </el-dropdown>
      </template>
      
      <template v-else>
        <el-button @click="navigateTo('/login')">登录</el-button>
        <el-button type="primary" @click="navigateTo('/register')">注册</el-button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.header-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  
  .logo-text {
    font-size: 20px;
    font-weight: bold;
    color: var(--text-primary);
  }
}

.nav-section {
  flex: 1;
  margin: 0 40px;
  
  .el-menu {
    border-bottom: none;
  }
}

.search-section {
  width: 200px;
  margin-right: 20px;
  
  :deep(.el-input-group__append) {
    padding: 0 12px;
  }
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .notification-badge {
    :deep(.el-badge__content) {
      top: 8px;
      right: 8px;
    }
  }
  
  .dropdown-badge {
    margin-left: 8px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: var(--background-base);
    }
    
    .username {
      font-size: 14px;
      color: var(--text-primary);
    }
  }
}

@media (max-width: 768px) {
  .nav-section {
    display: none;
  }
  
  .user-section {
    .username {
      display: none;
    }
  }
}
</style>