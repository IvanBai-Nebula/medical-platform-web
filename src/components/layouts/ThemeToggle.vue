<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

defineProps<{
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  dropdownMode?: boolean
}>()

const { 
  themeMode, 
  currentTheme, 
  toggleTheme, 
  toggleLightDark,
  setTheme,
  getThemeIcon, 
  getThemeName 
} = useTheme()

// 主题选项
const themeOptions = [
  { value: 'light', label: '明亮模式', icon: '☀️' },
  { value: 'dark', label: '黑暗模式', icon: '🌙' },
  { value: 'auto', label: '跟随系统', icon: '🌓' }
] as const
</script>

<template>
  <div class="theme-toggle-container">
    <!-- 简单切换按钮模式 -->
    <template v-if="!dropdownMode">
      <button 
        class="theme-toggle-btn"
        :class="[`size-${size || 'medium'}`, `theme-${currentTheme}`]"
        @click="toggleLightDark"
        :title="`当前: ${getThemeName()}, 点击切换`"
      >
        <span class="theme-icon">{{ getThemeIcon() }}</span>
        <span v-if="showLabel" class="theme-label">{{ getThemeName() }}</span>
        
        <!-- 切换动画效果 -->
        <div class="toggle-bg" :class="`toggle-${currentTheme}`" />
      </button>
    </template>

    <!-- 下拉菜单模式 -->
    <template v-else>
      <el-dropdown trigger="click" @command="setTheme">
        <button 
          class="theme-dropdown-btn"
          :class="[`size-${size || 'medium'}`, `theme-${currentTheme}`]"
        >
          <span class="theme-icon">{{ getThemeIcon() }}</span>
          <span v-if="showLabel" class="theme-label">{{ getThemeName() }}</span>
          <el-icon class="dropdown-icon">
            <i-ep-arrow-down />
          </el-icon>
        </button>
        
        <template #dropdown>
          <el-dropdown-menu class="theme-dropdown-menu">
            <el-dropdown-item 
              v-for="option in themeOptions"
              :key="option.value"
              :command="option.value"
              :class="{ 'is-active': themeMode === option.value }"
              class="theme-option"
            >
              <span class="option-icon">{{ option.icon }}</span>
              <span class="option-label">{{ option.label }}</span>
              <el-icon v-if="themeMode === option.value" class="check-icon">
                <i-ep-check />
              </el-icon>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

// === 变量定义 ===
$toggle-border-radius: 12px;
$toggle-padding-small: 6px 10px;
$toggle-padding-medium: 8px 12px;
$toggle-padding-large: 10px 16px;

$transition-fast: 0.2s;
$transition-normal: 0.3s;

// === 容器样式 ===
.theme-toggle-container {
  position: relative;
  display: inline-block;
}

// === 简单切换按钮 ===
.theme-toggle-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--color-border-primary);
  border-radius: $toggle-border-radius;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  cursor: pointer;
  overflow: hidden;
  @include transition(all, $transition-normal);
  
  // 尺寸变体
  &.size-small {
    padding: $toggle-padding-small;
    font-size: 12px;
    
    .theme-icon {
      font-size: 14px;
    }
  }
  
  &.size-medium {
    padding: $toggle-padding-medium;
    font-size: 14px;
    
    .theme-icon {
      font-size: 16px;
    }
  }
  
  &.size-large {
    padding: $toggle-padding-large;
    font-size: 16px;
    
    .theme-icon {
      font-size: 18px;
    }
  }
  
  // 主题变体
  &.theme-light {
    border-color: rgba(25, 118, 210, 0.2);
    
    &:hover {
      border-color: var(--color-primary);
      transform: translateY(-1px);
      @include box-shadow(var(--shadow-md));
    }
  }
  
  &.theme-dark {
    border-color: rgba(144, 202, 249, 0.3);
    
    &:hover {
      border-color: var(--color-primary);
      transform: translateY(-1px);
      @include box-shadow(var(--shadow-lg));
    }
  }
  
  // 内容样式
  .theme-icon {
    position: relative;
    z-index: 2;
    @include transition(transform, $transition-fast);
  }
  
  .theme-label {
    position: relative;
    z-index: 2;
    font-weight: 500;
    white-space: nowrap;
  }
  
  // 背景动画
  .toggle-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    @include transition(opacity, $transition-normal);
  }
  
  &:hover .toggle-bg {
    opacity: 0.1;
    
    &.toggle-light {
      background: var(--gradient-primary);
    }
    
    &.toggle-dark {
      background: var(--gradient-secondary);
    }
  }
  
  &:active {
    transform: scale(0.98);
    
    .theme-icon {
      transform: scale(0.9);
    }
  }
}

// === 下拉菜单按钮 ===
.theme-dropdown-btn {
  @extend .theme-toggle-btn;
  
  .dropdown-icon {
    font-size: 12px;
    opacity: 0.7;
    @include transition(transform, $transition-fast);
  }
  
  &:hover .dropdown-icon {
    transform: translateY(1px);
  }
}

// === 下拉菜单样式 ===
:deep(.theme-dropdown-menu) {
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  @include box-shadow(var(--shadow-lg));
  border-radius: 8px;
  overflow: hidden;
  
  .theme-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    color: var(--color-text-primary);
    @include transition(all, $transition-fast);
    
    &:hover {
      background: var(--color-bg-tertiary);
    }
    
    &.is-active {
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }
    
    .option-icon {
      font-size: 16px;
    }
    
    .option-label {
      flex: 1;
      font-weight: 500;
    }
    
    .check-icon {
      font-size: 14px;
      color: var(--color-text-inverse);
    }
  }
}

// === 响应式设计 ===
@include respond-to(mobile) {
  .theme-toggle-btn {
    &.size-medium {
      padding: $toggle-padding-small;
      font-size: 12px;
    }
    
    .theme-label {
      display: none;
    }
  }
}

// === 无障碍支持 ===
@media (prefers-reduced-motion: reduce) {
  .theme-toggle-btn,
  .theme-icon,
  .toggle-bg,
  .dropdown-icon {
    transition: none;
  }
}

// === 键盘焦点样式 ===
.theme-toggle-btn:focus-visible,
.theme-dropdown-btn:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
</style> 