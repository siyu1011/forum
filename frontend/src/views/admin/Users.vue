<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'
import type { AdminUser } from '@/api/admin'

const loading = ref(false)
const users = ref<AdminUser[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0,
})
const searchForm = ref({
  keyword: '',
  status: '',
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const result = await adminApi.getUsers({
      page: pagination.value.page,
      size: pagination.value.size,
      keyword: searchForm.value.keyword || undefined,
      status: searchForm.value.status || undefined,
    })
    users.value = result.users
    pagination.value = result.pagination
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchUsers()
}

const handleBan = async (user: AdminUser) => {
  try {
    await ElMessageBox.confirm(`确定要封禁用户 ${user.nickname || user.username} 吗？`, '确认封禁', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    const result = await ElMessageBox.prompt('请输入封禁原因', '封禁用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入封禁原因',
    })
    
    await adminApi.banUser(user.id, (result as any)?.value)
    ElMessage.success('用户已封禁')
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const handleUnban = async (user: AdminUser) => {
  try {
    await ElMessageBox.confirm(`确定要解封用户 ${user.nickname || user.username} 吗？`, '确认解封', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })
    
    await adminApi.unbanUser(user.id)
    ElMessage.success('用户已解封')
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const handleUpdateRole = async (user: AdminUser) => {
  try {
    const newRole = user.role === 'moderator' ? 'user' : 'moderator'
    const actionText = newRole === 'moderator' ? '设为版主' : '取消版主'
    
    await ElMessageBox.confirm(
      `确定要将用户 ${user.nickname || user.username} ${actionText}吗？`,
      '确认操作',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    await adminApi.updateUserRole(user.id, newRole)
    ElMessage.success('角色已更新')
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
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
  fetchUsers()
})
</script>

<template>
  <div class="admin-users">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="搜索用户" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="正常" value="active" />
            <el-option label="已封禁" value="banned" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card v-loading="loading">
      <el-table :data="users" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" min-width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="40" :src="row.avatar">{{ row.username.charAt(0) }}</el-avatar>
              <div class="user-info">
                <span class="nickname">{{ row.nickname || row.username }}</span>
                <span class="username">@{{ row.username }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'moderator' ? 'warning' : 'info'" size="small">
              {{ row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '已封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="post_count" label="帖子" width="80" />
        <el-table-column prop="comment_count" label="评论" width="80" />
        <el-table-column prop="reputation" label="声望" width="80" />
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.role !== 'admin'"
              type="primary"
              link
              size="small"
              @click="handleUpdateRole(row)"
            >
              {{ row.role === 'moderator' ? '取消版主' : '设为版主' }}
            </el-button>
            <el-button
              v-if="row.status === 'active' && row.role !== 'admin'"
              type="danger"
              size="small"
              @click="handleBan(row)"
            >
              封禁
            </el-button>
            <el-button
              v-else-if="row.status === 'banned'"
              type="success"
              size="small"
              @click="handleUnban(row)"
            >
              解封
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
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
.admin-users {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .user-info {
    display: flex;
    flex-direction: column;

    .nickname {
      font-weight: 500;
      color: #303133;
    }

    .username {
      font-size: 12px;
      color: #909399;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
