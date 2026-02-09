<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const categoryId = route.params.id
</script>

<template>
  <div class="category-page">
    <el-empty :description="`版块 ${categoryId} - 开发中`" />
  </div>
</template>