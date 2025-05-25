<script setup lang="ts">
// 学习心得管理列表组件
</script>

<template>
  <div class="experience-list">
    <h1>学习心得管理</h1>
    <p>这里将展示所有学习心得的管理列表</p>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

// === 变量定义 ===
$page-bg: #f8f9fa;
$page-padding: 20px;
$header-color: #2c3e50;
$header-size: 28px;
$header-border-color: #e74c3c;
$text-color: #6c757d;
$text-size: 16px;
$text-line-height: 1.6;

// === 主要样式 ===
.experience-list {
  padding: $page-padding;
  min-height: 100vh;
  background-color: $page-bg;
  @include transition(background-color);
  
  h1 {
    color: $header-color;
    font-size: $header-size;
    margin-bottom: $page-padding;
    border-bottom: 2px solid $header-border-color;
    padding-bottom: 10px;
    font-weight: 600;
    position: relative;
    @include transition(color);
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 60px;
      height: 2px;
      background-color: color.adjust($header-border-color, $lightness: -10%);
      @include transition(width);
    }
    
    &:hover {
      color: $header-border-color;
      
      &::after {
        width: 120px;
      }
    }
  }
  
  p {
    color: $text-color;
    font-size: $text-size;
    line-height: $text-line-height;
    margin: 0;
    @include transition(color);
    
    &:hover {
      color: color.adjust($text-color, $lightness: -15%);
    }
  }
}

// 响应式设计
@include respond-to(mobile) {
  .experience-list {
    padding: 15px;
    
    h1 {
      font-size: 24px;
    }
    
    p {
      font-size: 14px;
    }
  }
}
</style>
