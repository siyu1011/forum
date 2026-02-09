<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { AdminStats } from '@/api/admin'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('dashboard')
const stats = ref<AdminStats | null>(null)
const loading = ref(false)
const isAuthorized = ref(false)

// 提供数据给子组件
provide('adminStats', stats)
provide('adminStatsLoading', loading)

const fetchStats = async () => {
  // 确保有权限才发起请求
  if (!isAuthorized.value) {
    return
  }
  
  loading.value = true
  try {
    stats.value = await adminApi.getStats()
  } catch (error: any) {
    // 401错误已由请求拦截器处理（清除Token并跳转）
    // 这里只处理其他错误
    if (error.response?.status !== 401) {
      ElMessage.error(error.message || '获取统计数据失败')
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  // 注意：权限检查已在路由守卫中完成并验证了Token有效性
  // 此时可以直接发起请求
  isAuthorized.value = true
  fetchStats()
})
</script>

<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="200px" class="admin-sidebar">
        <div class="logo">
          <h2>管理后台</h2>
        </div>
        <el-menu
          v-model="activeMenu"
          :default-active="activeMenu"
          router
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/reports">
            <el-icon><Warning /></el-icon>
            <span>内容审核</span>
          </el-menu-item>
          <el-menu-item index="/admin/categories">
            <el-icon><Grid /></el-icon>
            <span>版块管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/logs">
            <el-icon><List /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
          <el-menu-item index="/">
            <el-icon><Back /></el-icon>
            <span>返回前台</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  min-height: 100vh;
}

.admin-sidebar {
  background-color: #304156;
  color: #bfcbd9;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #1f2d3d;

    h2 {
      margin: 0;
      color: #fff;
      font-size: 18px;
    }
  }

  :deep(.el-menu) {
    background-color: transparent;
    border-right: none;

    .el-menu-item {
      color: #bfcbd9;

      &:hover {
        background-color: #263445;
      }

      &.is-active {
        background-color: #409eff;
        color: #fff;
      }
    }
  }
}

.admin-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
