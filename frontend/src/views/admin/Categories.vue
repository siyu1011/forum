<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'
import type { AdminCategory } from '@/api/admin'

const loading = ref(false)
const categories = ref<AdminCategory[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('创建版块')
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref()

const form = ref({
  name: '',
  description: '',
  icon: '',
  color: '#409eff',
  sort_order: 0,
  parent_id: null as number | null,
  is_active: true,
})

const rules = {
  name: [
    { required: true, message: '请输入版块名称', trigger: 'blur' },
    { min: 2, max: 50, message: '版块名称长度在2-50个字符', trigger: 'blur' },
  ],
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const result = await adminApi.getCategories()
    categories.value = result.categories
  } catch (error: any) {
    ElMessage.error(error.message || '获取版块列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEditing.value = false
  editingId.value = null
  dialogTitle.value = '创建版块'
  form.value = {
    name: '',
    description: '',
    icon: '',
    color: '#409eff',
    sort_order: 0,
    parent_id: null,
    is_active: true,
  }
  dialogVisible.value = true
}

const handleEdit = (category: AdminCategory) => {
  isEditing.value = true
  editingId.value = category.id
  dialogTitle.value = '编辑版块'
  form.value = {
    name: category.name,
    description: category.description || '',
    icon: category.icon || '',
    color: category.color || '#409eff',
    sort_order: category.sort_order,
    parent_id: category.parent_id,
    is_active: category.is_active,
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      const submitData = {
        ...form.value,
        parent_id: form.value.parent_id ?? undefined,
      }
      if (isEditing.value && editingId.value) {
        await adminApi.updateCategory(editingId.value, submitData)
        ElMessage.success('版块已更新')
      } else {
        await adminApi.createCategory(submitData as any)
        ElMessage.success('版块创建成功')
      }
      dialogVisible.value = false
      fetchCategories()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    }
  })
}

const handleDelete = async (category: AdminCategory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除版块 "${category.name}" 吗？此操作不可恢复。`,
      '确认删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    await adminApi.deleteCategory(category.id, true)
    ElMessage.success('版块已删除')
    fetchCategories()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const toggleStatus = async (category: AdminCategory) => {
  try {
    await adminApi.updateCategory(category.id, { is_active: !category.is_active })
    ElMessage.success(category.is_active ? '版块已禁用' : '版块已启用')
    fetchCategories()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
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
  fetchCategories()
})
</script>

<template>
  <div class="admin-categories">
    <div class="page-header">
      <h2>版块管理</h2>
      <el-button type="primary" @click="handleCreate">创建版块</el-button>
    </div>

    <el-card v-loading="loading">
      <el-table :data="categories" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="版块名称" min-width="150">
          <template #default="{ row }">
            <div class="category-cell">
              <span class="category-icon" v-if="row.icon">{{ row.icon }}</span>
              <span class="category-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="100" />
        <el-table-column prop="post_count" label="帖子数" width="100" />
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button 
              :type="row.is_active ? 'info' : 'success'" 
              link 
              size="small" 
              @click="toggleStatus(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="版块名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入版块名称" />
        </el-form-item>
        <el-form-item label="版块描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入版块描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.admin-categories {
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

.category-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .category-icon {
    font-size: 20px;
  }

  .category-name {
    font-weight: 500;
    color: #303133;
  }
}
</style>
