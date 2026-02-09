<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import Header from '@/components/common/Header.vue'
import Footer from '@/components/common/Footer.vue'
import PageLoading from '@/components/common/PageLoading.vue'

const userStore = useUserStore()

onMounted(() => {
  // 初始化登录状态
  userStore.initAuth()
})
</script>

<template>
  <el-container>
    <el-header height="60px" class="header-container">
      <Header />
    </el-header>
    
    <el-main class="main-container">
      <router-view />
    </el-main>
    
    <el-footer height="60px" class="footer-container">
      <Footer />
    </el-footer>
  </el-container>
  
  <!-- 全局页面加载动画 -->
  <PageLoading />
</template>

<style scoped>
.header-container {
  padding: 0;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.main-container {
  min-height: calc(100vh - 120px);
  padding: 20px;
  background-color: var(--background-base);
}

.footer-container {
  padding: 0;
  background-color: #fff;
  border-top: 1px solid var(--border-light);
}
</style>
