<script setup lang="ts">
import type { UserLoginParams, UserRegisterParams } from '@/services/type/user'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'

const router = useRouter()
const userStore = useUserStore()
const isLoading = ref(false)
const isRegistering = ref(false)

const handleLogin = async (payload: UserLoginParams) => {
  if (isLoading.value) { return }
  isLoading.value = true
  try {
    console.log('尝试登录:', payload.username)
    const responseData = await userStore.login(payload)
    console.log('登录成功，用户角色:', userStore.currentUserRole)
    
    // 注意：token已在store中保存到localStorage，这里不需要重复操作
    
    ElMessage.success('登录成功!')
    
    // 重定向到正确的页面
    const redirectPath = router.currentRoute.value.query.redirect as string || '/'
    router.push(redirectPath)
  }
  catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error.message || '登录失败，请检查您的凭据。')
  }
  finally {
    isLoading.value = false
  }
}

const handleRegister = async (payload: UserRegisterParams) => {
  if (isRegistering.value) { return }
  isRegistering.value = true
  try {
    await userStore.register(payload)
    ElMessage.success('注册成功！请登录。')
  }
  catch (error: any) {
    ElMessage.error(error.message || '注册失败，请稍后再试。')
  }
  finally {
    isRegistering.value = false
  }
}
</script>

<template>
  <div class="login-view-wrapper">
    <!-- 主题切换按钮 -->
    <div class="theme-toggle-wrapper">
      <ThemeToggle size="small" dropdown-mode />
    </div>

    <div class="background-blobs-container" />

    <!-- 登录表单容器，使用 Flex 居中 -->
    <div class="login-form-container">
      <!-- LoginForm 本身现在包含了玻璃拟态样式和内容 -->
      <LoginForm @submit-login="handleLogin" @submit-register="handleRegister" />
      <p v-if="isLoading || isRegistering" class="status-text">
        {{ isLoading ? '登录中...' : (isRegistering ? '注册中...' : '') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// === 变量定义 ===
$login-padding: 20px;
$login-form-max-width: 400px;
$login-status-font-size: 14px;
$login-status-margin: 20px;

// z-index 层级
$z-background: 0;
$z-form: 1;
$z-status: 2;
$z-theme-toggle: 10;

// === 主要样式 ===
.login-view-wrapper {
  @include flex-center;
  min-height: 100vh;
  padding: $login-padding;
  background: var(--color-login-bg); /* 使用主题变量的登录背景 */
  overflow: hidden;
  position: relative;
  box-sizing: border-box;

  // 主题切换按钮位置
  .theme-toggle-wrapper {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: $z-theme-toggle;
  }

  // 背景装饰容器
  .background-blobs-container {
    @include full-absolute;
    z-index: $z-background;
    overflow: hidden;
  }

  // 登录表单容器
  .login-form-container {
    @include flex-column-center;
    position: relative;
    z-index: $z-form;
    width: 100%;
    max-width: $login-form-max-width;

    // 状态文本
    .status-text {
      margin-top: $login-status-margin;
      color: var(--color-text-inverse);
      font-size: $login-status-font-size;
      text-align: center;
      position: relative;
      z-index: $z-status;
      @include transition(opacity);
      opacity: 0.9;

      &.loading {
        opacity: 0.8;
      }
    }
  }
}

// 响应式设计
@include respond-to(mobile) {
  .login-view-wrapper {
    padding: 10px;

    .theme-toggle-wrapper {
      top: 15px;
      right: 15px;
    }

    .login-form-container {
      max-width: 100%;
    }
  }
}
</style>
