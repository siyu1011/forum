<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'
import type { AdminReport, AdminStats } from '@/api/admin'

const router = useRouter()
const loading = ref(false)
const reports = ref<AdminReport[]>([])
const stats = ref<AdminStats | null>(null)
const pagination = ref({
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0,
})
const activeTab = ref('pending')
const statusMap: Record<string, string> = {
  pending: '待处理',
  handled: '已处理',
  dismissed: '已忽略',
}

const getTargetTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    post: '帖子',
    comment: '评论',
    user: '用户',
  }
  return map[type] || type
}

const getTargetTypeTag = (type: string) => {
  const map: Record<string, string> = {
    post: '',
    comment: 'warning',
    user: 'info',
  }
  return map[type] || 'info'
}

const getStatusTag = (status: string) => {
  const map: Record<string, string> = {
    pending: 'danger',
    handled: 'success',
    dismissed: 'info',
  }
  return map[status] || 'info'
}

const fetchReports = async () => {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? undefined : activeTab.value
    const [reportsResult, statsResult] = await Promise.all([
      adminApi.getReports({
        page: pagination.value.page,
        size: pagination.value.size,
        status,
      }),
      adminApi.getStats(),
    ])
    reports.value = reportsResult.reports
    pagination.value = reportsResult.pagination
    stats.value = statsResult
  } catch (error: any) {
    ElMessage.error(error.message || '获取举报列表失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  pagination.value.page = 1
  fetchReports()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchReports()
}

const handleReport = async (report: AdminReport, action: 'handled' | 'dismissed') => {
  try {
    const message = action === 'handled' ? '确定要处理此举报吗？' : '确定要忽略此举报吗？'
    await ElMessageBox.confirm(message, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: action === 'handled' ? 'warning' : 'info',
    })

    let reason: string | undefined
    if (action === 'dismissed') {
      const result = await ElMessageBox.prompt('请输入忽略原因（可选）', '忽略举报', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      })
      reason = (result as any)?.value
    }

    await adminApi.handleReport(report.id, action, reason)
    ElMessage.success(action === 'handled' ? '举报已处理' : '举报已忽略')
    fetchReports()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const goToTarget = (report: AdminReport) => {
  if (report.target_type === 'post') {
    router.push(`/post/${report.target_id}`)
  } else if (report.target_type === 'comment') {
    router.push(`/post/${report.target_id}`)
  } else if (report.target_type === 'user') {
    router.push(`/user/${report.target_id}`)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchReports()
})
</script>

<template>
  <div class="admin-reports">
    <div class="page-header">
      <h2>内容审核</h2>
      <el-tag type="danger" size="large" v-if="stats?.pendingReports">
        待处理 {{ stats.pendingReports }} 条
      </el-tag>
    </div>

    <el-card v-loading="loading">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待处理" name="pending" />
        <el-tab-pane label="已处理" name="handled" />
        <el-tab-pane label="已忽略" name="dismissed" />
        <el-tab-pane label="全部" name="all" />
      </el-tabs>

      <div class="report-list" v-if="reports.length > 0">
        <div v-for="report in reports" :key="report.id" class="report-item">
          <div class="report-header">
            <div class="report-info">
              <span class="report-id">#{{ report.id }}</span>
              <el-tag :type="getTargetTypeTag(report.target_type)" size="small">
                {{ getTargetTypeLabel(report.target_type) }}
              </el-tag>
              <el-tag :type="getStatusTag(report.status)" size="small">
                {{ statusMap[report.status] }}
              </el-tag>
            </div>
            <span class="report-time">{{ formatDate(report.created_at) }}</span>
          </div>

          <div class="report-content">
            <div class="report-reason">
              <span class="label">举报原因：</span>
              <span class="value reason-text">{{ report.reason }}</span>
            </div>
            <div class="report-desc" v-if="report.description">
              <span class="label">详细说明：</span>
              <span class="value">{{ report.description }}</span>
            </div>
            <div class="report-meta">
              <div class="meta-item" v-if="report.reporter">
                <el-icon><User /></el-icon>
                <span>{{ report.reporter.nickname || report.reporter.username }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatDate(report.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="report-actions" v-if="report.status === 'pending'">
            <el-button type="success" @click="handleReport(report, 'handled')">
              <el-icon><Check /></el-icon>
              处理举报
            </el-button>
            <el-button type="info" @click="handleReport(report, 'dismissed')">
              <el-icon><Close /></el-icon>
              忽略
            </el-button>
            <el-button type="primary" link @click="goToTarget(report)">
              <el-icon><View /></el-icon>
              查看内容
            </el-button>
          </div>
          
          <div class="report-result" v-else>
            <el-icon><CircleCheck v-if="report.status === 'handled'" /><CircleClose v-else /></el-icon>
            <span>{{ report.status === 'handled' ? '已处理' : '已忽略' }}</span>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无举报" />

      <div class="pagination-wrapper" v-if="pagination.totalPages > 1">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.size"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.admin-reports {
  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }
}

.report-list {
  .report-item {
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 16px;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    &:last-child {
      margin-bottom: 0;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .report-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .report-id {
          font-size: 13px;
          color: #909399;
        }
      }

      .report-time {
        font-size: 13px;
        color: #909399;
      }
    }

    .report-content {
      background: #f5f7fa;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;

      .report-reason,
      .report-desc {
        margin-bottom: 12px;
        font-size: 14px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          color: #909399;
          margin-right: 8px;
        }

        .value {
          color: #303133;
          
          &.reason-text {
            font-weight: 500;
          }
        }
      }

      .report-meta {
        display: flex;
        gap: 20px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #dcdfe6;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .report-actions {
      display: flex;
      gap: 12px;
    }

    .report-result {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #909399;
      font-size: 14px;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
