<script setup lang="ts">
// 404 页面组件
</script>

<template>
  <div class="flex flex-col items-center justify-center h-80vh">
    <h1 class="text-72px mb-16px">404</h1>
    <p class="text-24px mb-24px">页面不存在</p>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>
