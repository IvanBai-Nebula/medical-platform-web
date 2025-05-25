<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { UserLoginParams, UserRegisterParams } from '@/services/type/user'

const emit = defineEmits<{
  (e: 'submitLogin', payload: UserLoginParams): void
  (e: 'submitRegister', payload: UserRegisterParams): void
}>()
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const isRegisterMode = ref(false)

const passwordsMatch = computed(() => password.value === confirmPassword.value)

const handleSubmit = () => {
  if (!username.value.trim() || !password.value.trim()) {
    ElMessage.warning('用户名和密码不能为空！')
    return
  }
  if (isRegisterMode.value && !confirmPassword.value.trim()) {
    ElMessage.warning('请确认密码！')
    return
  }

  if (isRegisterMode.value) {
    if (!passwordsMatch.value) {
      ElMessage.error('两次输入的密码不一致！')
      return
    }
    emit('submitRegister', {
      username: username.value,
      password: password.value,
    })
  }
  else {
    emit('submitLogin', {
      username: username.value,
      password: password.value,
    })
  }
}

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
}
</script>

<template>
  <div class="login-form-container">
    <div class="shape first" />
    <form class="glassmorphism-form" @submit.prevent="handleSubmit">
      <h3>{{ isRegisterMode ? "注册账户" : "登录平台" }}</h3>

      <div v-if="!isRegisterMode" class="demo-accounts-info">
        <div class="demo-title">
          <Icon icon="fluent:info-24-filled" />
          <span>测试账号</span>
        </div>
        <div class="demo-accounts">
          <div class="demo-account">
            <span class="account-label">管理员：</span>
            <span class="account-text">superadmin / admin123</span>
          </div>
          <div class="demo-account">
            <span class="account-label">普通用户：</span>
            <span class="account-text">student1 / user123</span>
          </div>
        </div>
      </div>

      <label for="username">用户名</label>
      <input
        id="username"
        v-model="username"
        type="text"
        :placeholder="isRegisterMode ? '设置您的用户名' : '邮箱或手机号'"
        required
      >

      <label for="password">密码</label>
      <input
        id="password"
        v-model="password"
        type="password"
        :placeholder="isRegisterMode ? '设置您的密码' : '请输入密码'"
        required
      >

      <div v-if="isRegisterMode" class="form-group-register-confirm">
        <label for="confirmPassword">确认密码</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          required
        >
      </div>

      <button type="submit" class="login-button">
        {{ isRegisterMode ? "注册" : "登 录" }}
      </button>

      <div class="bottom-actions">
        <button type="button" class="toggle-mode-button" @click="toggleMode">
          {{ isRegisterMode ? "已有账户？直接登录" : "没有账户？立即注册" }}
        </button>
      </div>
    </form>
    <div class="shape last" />
  </div>
</template>

<style lang="scss" scoped>
// === 变量定义 ===
$form-width: 400px;
$form-padding: 50px 35px;
$form-min-height: 450px;
$form-border-radius: 10px;

$input-height: 50px;
$input-padding: 0 15px;
$input-border-radius: 3px;
$input-margin-top: 8px;

$label-margin-top: 30px;
$label-font-size: 16px;

$button-margin-top: 50px;
$button-padding: 15px 0;
$button-border-radius: 5px;

$shape-size: 200px;

// 颜色变量 - 使用主题变量
$form-bg: var(--glass-bg);
$form-border: var(--glass-border);
$input-bg: var(--glass-input-bg);
$input-placeholder: var(--color-text-placeholder);
$text-color: var(--color-text-inverse);
$button-bg: var(--color-button-primary);
$button-text: var(--color-button-text);
$toggle-text: var(--color-text-secondary);

// === 主要样式 ===
.login-form-container {
  position: relative;
}

.glassmorphism-form {
  width: $form-width;
  background-color: $form-bg;
  position: relative;
  border-radius: $form-border-radius;
  backdrop-filter: blur(10px);
  border: 2px solid $form-border;
  box-shadow: var(--shadow-glass);
  padding: $form-padding;
  min-height: $form-min-height;
  box-sizing: border-box;
  transition: all 0.3s ease;

  // 重置所有子元素样式
  * {
    font-family: 'Poppins', sans-serif;
    color: $text-color;
    letter-spacing: 0.5px;
    outline: none;
    border: none;
    box-sizing: border-box;
  }

  // 标题样式
  h3 {
    font-size: 32px;
    font-weight: 500;
    line-height: 42px;
    text-align: center;
    margin: 0 0 20px 0;
  }

  // 测试账号信息提示样式
  .demo-accounts-info {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    backdrop-filter: blur(5px);

    .demo-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 12px;

      .iconify {
        font-size: 16px;
        color: #4CAF50;
      }
    }

    .demo-accounts {
      .demo-account {
        display: flex;
        align-items: center;
        margin-bottom: 6px;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        .account-label {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          min-width: 70px;
        }

        .account-text {
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Courier New', monospace;
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }
  }

  // 标签样式
  label {
    display: block;
    margin-top: $label-margin-top;
    font-size: $label-font-size;
    font-weight: 500;
  }

  // 输入框样式
  input {
    display: block;
    height: $input-height;
    width: 100%;
    background-color: $input-bg;
    border-radius: $input-border-radius;
    padding: $input-padding;
    margin-top: $input-margin-top;
    font-size: 14px;
    font-weight: 300;
    transition: background-color 0.3s ease;

    &::placeholder {
      color: $input-placeholder;
    }

    &:focus {
      background-color: var(--glass-input-focus);
    }
  }

  // 注册确认密码组
  .form-group-register-confirm {
    // 继承父级样式
  }
}

// 登录按钮
.login-button {
  margin-top: $button-margin-top;
  width: 100%;
  background-color: $button-bg;
  color: $button-text;
  padding: $button-padding;
  font-size: 18px;
  font-weight: 600;
  border-radius: $button-border-radius;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  outline: none;

  &:hover {
    background-color: var(--color-button-primary-hover);
    transform: translateY(-1px);
  }
}

// 底部操作区域
.bottom-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.toggle-mode-button {
  background: transparent;
  color: $toggle-text;
  font-size: 14px;
  text-align: right;
  cursor: pointer;
  padding: 5px;
  border: none;
  outline: none;
  transition: color 0.3s ease;

  &:hover {
    text-decoration: underline;
    color: var(--color-text-inverse);
  }
}

// 装饰性形状 - 使用主题渐变
.shape {
  position: absolute;
  border-radius: 50%;
  height: $shape-size;
  width: $shape-size;
  z-index: -1;
  transition: all 0.3s ease;

  &.first {
    background: var(--gradient-secondary);
    left: -80px;
    top: -80px;
  }

  &.last {
    background: var(--gradient-accent);
    right: -30px;
    bottom: -80px;
  }
}
</style>
