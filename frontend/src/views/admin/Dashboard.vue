<script setup lang="ts">
import { ref, onMounted, inject, type Ref } from 'vue'
import { adminApi } from '@/api'
import type { AdminStats } from '@/api/admin'

const stats = ref<AdminStats | null>(null)
const loading = ref(false)

// 尝试从父组件 Layout 获取数据（注入的是 Ref 对象）
const injectedStats = inject<Ref<AdminStats | null>>('adminStats')
const injectedLoading = inject<Ref<boolean>>('adminStatsLoading')

const fetchStats = async () => {
  // 如果父组件已经提供数据，直接使用
  if (injectedStats?.value) {
    stats.value = injectedStats.value
    return
  }
  
  // 如果父组件正在加载，等待其完成
  if (injectedLoading?.value) {
    loading.value = true
    return
  }
  
  // 父组件没有提供数据时才自己请求
  loading.value = true
  try {
    stats.value = await adminApi.getStats()
  } catch (error: any) {
    // 不处理401错误（已由请求拦截器处理）
    if (error.response?.status !== 401) {
      console.error('获取统计数据失败', error)
    }
  } finally {
    loading.value = false
  }
}

const formatGrowth = (growth: string) => {
  const num = parseFloat(growth)
  if (isNaN(num)) return '0%'
  return (num >= 0 ? '+' : '') + num + '%'
}

const getGrowthType = (growth: string) => {
  const num = parseFloat(growth)
  if (isNaN(num)) return 'info'
  return num >= 0 ? 'success' : 'danger'
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="admin-dashboard">
    <h2>数据概览</h2>
    
    <el-row :gutter="20" v-loading="loading">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card user-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.userCount || 0 }}</div>
              <div class="stat-label">用户总数</div>
              <div class="stat-trend">
                <span class="trend-value" :class="'trend-' + getGrowthType(stats?.userGrowth || '0')">
                  {{ formatGrowth(stats?.userGrowth || '0') }}
                </span>
                <span class="trend-label">较昨日</span>
              </div>
            </div>
          </div>
          <div class="stat-footer">
            <span>今日新增 {{ stats?.todayUsers || 0 }}</span>
            <span>本周新增 {{ stats?.weekUserCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card post-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.postCount || 0 }}</div>
              <div class="stat-label">帖子总数</div>
              <div class="stat-trend">
                <span class="trend-value" :class="'trend-' + getGrowthType(stats?.postGrowth || '0')">
                  {{ formatGrowth(stats?.postGrowth || '0') }}
                </span>
                <span class="trend-label">较昨日</span>
              </div>
            </div>
          </div>
          <div class="stat-footer">
            <span>今日发布 {{ stats?.todayPosts || 0 }}</span>
            <span>本周发布 {{ stats?.weekPostCount || 0 }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card comment-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.commentCount || 0 }}</div>
              <div class="stat-label">评论总数</div>
            </div>
          </div>
          <div class="stat-footer">
            <span>帖子总数 {{ stats?.totalPosts || 0 }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card report-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value" style="color: #f56c6c;">{{ stats?.pendingReports || 0 }}</div>
              <div class="stat-label">待处理举报</div>
            </div>
          </div>
          <div class="stat-footer">
            <span>已封禁用户 {{ stats?.bannedUsers || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card>
          <template #header>
            <span>待处理举报</span>
          </template>
          <div class="pending-reports">
            <div class="report-number">{{ stats?.pendingReports || 0 }}</div>
            <el-button type="primary" plain @click="$router.push('/admin/reports')">
              去处理
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="8">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button @click="$router.push('/admin/users')">
              <el-icon><User /></el-icon>
              用户管理
            </el-button>
            <el-button @click="$router.push('/admin/reports')">
              <el-icon><Document /></el-icon>
              内容审核
            </el-button>
            <el-button @click="$router.push('/admin/logs')">
              <el-icon><Clock /></el-icon>
              操作日志
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :lg="8">
        <el-card>
          <template #header>
            <span>系统状态</span>
          </template>
          <div class="system-status">
            <div class="status-item">
              <span class="status-label">数据库</span>
              <el-tag type="success" size="small">已连接</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">Redis缓存</span>
              <el-tag :type="stats ? 'success' : 'warning'" size="small">
                {{ stats ? '已启用' : '未连接' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">运行状态</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.admin-dashboard {
  h2 {
    margin: 0 0 20px 0;
    font-size: 24px;
    color: #303133;
  }
}

.stat-card {
  margin-bottom: 20px;
  
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-card .stat-icon {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;
  }

  .post-card .stat-icon {
    background: rgba(103, 194, 58, 0.1);
    color: #67c23a;
  }

  .comment-card .stat-icon {
    background: rgba(230, 162, 60, 0.1);
    color: #e6a23c;
  }

  .report-card .stat-icon {
    background: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #303133;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 4px;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;

      .trend-value {
        font-size: 13px;
        font-weight: 500;
        
        &.trend-success {
          color: #67c23a;
        }
        
        &.trend-danger {
          color: #f56c6c;
        }
        
        &.trend-info {
          color: #909399;
        }
      }

      .trend-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .stat-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
    font-size: 13px;
    color: #909399;
  }
}

.pending-reports {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .report-number {
    font-size: 48px;
    font-weight: bold;
    color: #f56c6c;
  }
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  .el-button {
    flex: 1;
    min-width: 100px;
  }
}

.system-status {
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    .status-label {
      color: #606266;
    }
  }
}
</style>
