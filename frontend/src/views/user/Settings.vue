<script setup lang="ts">
import { reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const form = reactive({
  nickname: userStore.user?.nickname || '',
  bio: userStore.user?.bio || '',
})

const handleUpdate = async () => {
  try {
    await userStore.updateUser({
      nickname: form.nickname,
      bio: form.bio,
    })
    ElMessage.success('更新成功')
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}
</script>

<template>
  <div class="user-settings">
    <el-card>
      <template #header>
        <h2>账号设置</h2>
      </template>
      
      <el-form label-position="top">
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        
        <el-form-item label="个人简介">
          <el-input 
            v-model="form.bio" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入个人简介" 
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleUpdate">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.user-settings {
  max-width: 600px;
  margin: 0 auto;
}
</style>