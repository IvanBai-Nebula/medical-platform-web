<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-found-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-message">抱歉，您访问的页面不存在或已被移除。</p>
      <button class="back-home-btn" @click="goHome">
        返回首页
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// === 变量定义 ===
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$primary-color: #667eea;
$white: #ffffff;
$page-padding: 20px;
$content-max-width: 500px;

$error-code-size: 120px;
$error-title-size: 36px;
$error-message-size: 18px;
$button-size: 16px;

$error-code-margin: 20px;
$error-title-margin: 16px;
$error-message-margin: 32px;

$button-padding: 12px 24px;
$button-border-radius: 8px;

// === 主要样式 ===
.not-found-page {
  @include flex-center;
  min-height: 100vh;
  background: $primary-gradient;
  color: $white;
  text-align: center;
  padding: $page-padding;
  position: relative;
  overflow: hidden;
  
  // 添加动态背景效果
  &::before {
    content: '';
    @include full-absolute;
    background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    animation: float 6s ease-in-out infinite;
  }
}

.error-content {
  max-width: $content-max-width;
  position: relative;
  z-index: 1;
  @include transition(transform);
  
  &:hover {
    transform: translateY(-5px);
  }
}

.error-code {
  font-size: $error-code-size;
  font-weight: bold;
  margin-bottom: $error-code-margin;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, $white, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: pulse 2s ease-in-out infinite;
}

.error-title {
  font-size: $error-title-size;
  margin-bottom: $error-title-margin;
  font-weight: 600;
  @include transition(color);
  
  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
}

.error-message {
  font-size: $error-message-size;
  margin-bottom: $error-message-margin;
  opacity: 0.9;
  line-height: 1.6;
  @include transition(opacity);
  
  &:hover {
    opacity: 1;
  }
}

.back-home-btn {
  background-color: $white;
  color: $primary-color;
  border: none;
  padding: $button-padding;
  border-radius: $button-border-radius;
  font-size: $button-size;
  font-weight: 600;
  cursor: pointer;
  @include transition(all);
  @include box-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    @include full-absolute;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: translateX(-100%);
    @include transition(transform, 0.6s);
  }
  
  &:hover {
    transform: translateY(-2px);
    @include box-shadow(0 6px 20px rgba(0, 0, 0, 0.2));
    background-color: rgba(255, 255, 255, 0.95);
    
    &::before {
      transform: translateX(100%);
    }
  }
  
  &:active {
    transform: translateY(0);
  }
}

// === 动画定义 ===
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

// === 响应式设计 ===
@include respond-to(mobile) {
  .not-found-page {
    padding: 15px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 28px;
  }
  
  .error-message {
    font-size: 16px;
    margin-bottom: 24px;
  }
  
  .back-home-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style> 