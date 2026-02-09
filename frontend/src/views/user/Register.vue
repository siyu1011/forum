<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const formRef = ref()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  agreement: false,
})

const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' },
  ],
  nickname: [
    { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' },
  ],
  agreement: [
    { 
      validator: (rule: any, value: boolean, callback: any) => {
        if (!value) {
          callback(new Error('请同意用户协议'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    },
  ],
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      const success = await userStore.register(
        form.username,
        form.email,
        form.password,
        form.nickname
      )
      
      if (success) {
        ElMessage.success('注册成功')
        router.push('/')
      }
    } finally {
      loading.value = false
    }
  })
}

const navigateToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-page">
    <el-card class="register-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2>用户注册</h2>
          <p>创建一个新账号，加入我们的社区</p>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            prefix-icon="Message"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="昵称（选填）" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="请输入昵称"
            prefix-icon="Avatar"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        
        <el-form-item prop="agreement">
          <el-checkbox v-model="form.agreement">
            我已阅读并同意
<el-link type="primary" :underline="'never'">用户协议</el-link>
              和
              <el-link type="primary" :underline="'never'">隐私政策</el-link>
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
        
        <div class="login-link">
          已有账号？
          <el-link type="primary" @click="navigateToLogin">
            立即登录
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.register-page {
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 40px;
}

.register-card {
  width: 100%;
  max-width: 420px;
  
  .card-header {
    text-align: center;
    
    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: var(--text-primary);
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

.login-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: var(--text-secondary);
}
</style>