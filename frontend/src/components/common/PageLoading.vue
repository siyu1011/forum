<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import LoadingSpinner from './LoadingSpinner.vue'

const router = useRouter()
const isLoading = ref(false)

let unsubscribe: (() => void) | null = null

onMounted(() => {
  // 路由开始切换时显示加载
  unsubscribe = router.beforeEach((to, from, next) => {
    // 只在不同路由之间切换时显示加载
    if (to.path !== from.path) {
      isLoading.value = true
    }
    next()
  })

  // 路由切换完成后隐藏加载
  router.afterEach(() => {
    // 延迟一点关闭，让页面有时间渲染
    setTimeout(() => {
      isLoading.value = false
    }, 300)
  })

  // 路由切换错误时也隐藏加载
  router.onError(() => {
    isLoading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<template>
  <LoadingSpinner :visible="isLoading" type="fullscreen" text="页面加载中..." />
</template>
