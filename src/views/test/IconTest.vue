<template>
  <div class="icon-test-page">
    <div class="page-header">
      <h1>图标测试页面</h1>
      <p>测试 @iconify/vue 图标是否正常加载</p>
    </div>
    
    <div class="test-sections">
      <!-- 基础图标测试 -->
      <div class="test-section">
        <h2>基础图标</h2>
        <div class="icon-grid">
          <div v-for="icon in basicIcons" :key="icon.name" class="icon-item">
            <Icon :icon="icon.icon" />
            <span>{{ icon.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- 项目中使用的图标 -->
      <div class="test-section">
        <h2>项目图标</h2>
        <div class="icon-grid">
          <div v-for="icon in projectIcons" :key="icon.name" class="icon-item">
            <Icon :icon="icon.icon" />
            <span>{{ icon.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- 视图切换图标测试 -->
      <div class="test-section">
        <h2>视图切换图标</h2>
        <div class="view-mode-test">
          <button class="test-btn">
            <Icon icon="fluent:grid-24-filled" />
            <span>瀑布流图标</span>
          </button>
          <button class="test-btn">
            <Icon icon="fluent:list-24-regular" />
            <span>列表图标</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

// 基础图标测试
const basicIcons = [
  { name: 'home', icon: 'fluent:home-24-regular' },
  { name: 'settings', icon: 'fluent:settings-24-regular' },
  { name: 'user', icon: 'fluent:person-24-regular' },
  { name: 'search', icon: 'fluent:search-24-regular' },
]

// 项目中使用的图标
const projectIcons = [
  { name: 'arrow-left', icon: 'fluent:arrow-left-24-regular' },
  { name: 'edit', icon: 'fluent:edit-24-regular' },
  { name: 'delete', icon: 'fluent:delete-24-regular' },
  { name: 'add', icon: 'fluent:add-24-regular' },
  { name: 'book', icon: 'fluent:book-24-filled' },
  { name: 'shield', icon: 'fluent:shield-24-filled' },
  { name: 'clock', icon: 'fluent:clock-24-filled' },
  { name: 'checkmark', icon: 'fluent:checkmark-circle-24-filled' },
  { name: 'dismiss', icon: 'fluent:dismiss-circle-24-regular' },
  { name: 'grid', icon: 'fluent:grid-24-filled' },
  { name: 'list', icon: 'fluent:list-24-regular' },
  { name: 'info', icon: 'fluent:info-24-regular' },
  { name: 'lock', icon: 'fluent:lock-24-regular' },
  { name: 'lightbulb', icon: 'fluent:lightbulb-24-regular' },
  { name: 'document', icon: 'fluent:document-24-regular' },
  { name: 'spinner', icon: 'fluent:spinner-ios-20-filled' },
  { name: 'heart', icon: 'fluent:heart-24-regular' },
  { name: 'eye', icon: 'fluent:eye-24-regular' },
]
</script>

<style scoped>
.icon-test-page {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.page-header p {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

.test-sections {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.test-section {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--color-border-primary);
}

.test-section h2 {
  font-size: 20px;
  color: var(--color-text-primary);
  margin: 0 0 20px 0;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 8px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--color-border-secondary);
  border-radius: 12px;
  background: var(--color-bg-secondary);
  transition: all 0.3s ease;
}

.icon-item:hover {
  background: var(--color-bg-primary);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.icon-item .iconify {
  font-size: 32px;
  color: var(--color-primary);
}

.icon-item span {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
  font-weight: 500;
}

.view-mode-test {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.test-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.test-btn .iconify {
  font-size: 24px;
}

.test-btn span {
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .icon-test-page {
    padding: 20px;
  }
  
  .icon-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
  
  .view-mode-test {
    flex-direction: column;
    align-items: center;
  }
}
</style> 