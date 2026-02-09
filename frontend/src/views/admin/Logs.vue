<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'
import type { OperationLog } from '@/api/admin'

const loading = ref(false)
const logs = ref<OperationLog[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  size: 50,
  totalPages: 0,
})

const actionLabels: Record<string, string> = {
  ban_user: '封禁用户',
  unban_user: '解封用户',
  update_user_role: '修改用户角色',
  handle_report: '处理举报',
  dismiss_report: '忽略举报',
  delete_post: '删除帖子',
  delete_comment: '删除评论',
}

const actionTypeMap: Record<string, string> = {
  ban_user: 'danger',
  unban_user: 'success',
  update_user_role: 'warning',
  handle_report: 'success',
  dismiss_report: 'info',
  delete_post: 'danger',
  delete_comment: 'danger',
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const result = await adminApi.getOperationLogs({
      page: pagination.value.page,
      size: pagination.value.size,
    })
    logs.value = result.logs
    pagination.value = result.pagination
  } catch (error: any) {
    ElMessage.error(error.message || '获取操作日志失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchLogs()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const formatAction = (action: string) => {
  return actionLabels[action] || action
}

onMounted(() => {
  fetchLogs()
})
</script>

<template>
  <div class="admin-logs">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>

    <el-card v-loading="loading">
      <el-table :data="logs" stripe max-height="600">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="action" label="操作" width="150">
          <template #default="{ row }">
            <el-tag :type="actionTypeMap[row.action] || 'info'" size="small">
              {{ formatAction(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_type" label="目标类型" width="100">
          <template #default="{ row }">
            {{ row.target_type || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="target_id" label="目标ID" width="100">
          <template #default="{ row }">
            {{ row.target_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="details" label="详情" min-width="200">
          <template #default="{ row }">
            <template v-if="row.details">
              <span v-if="row.details.reason">原因：{{ row.details.reason }}</span>
              <span v-else-if="row.details.action">操作：{{ row.details.action }}</span>
              <span v-else>-</span>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

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
.admin-logs {
  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
