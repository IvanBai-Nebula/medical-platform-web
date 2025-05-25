<template>
  <div class="icon-test">
    <h3>图标测试</h3>
    <div class="icon-grid">
      <div class="icon-item" v-for="icon in testIcons" :key="icon.name">
        <Icon :icon="icon.icon" />
        <span>{{ icon.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const testIcons = [
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
]
</script>

<style scoped>
.icon-test {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 20px 0;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #f9f9f9;
}

.icon-item .iconify {
  font-size: 24px;
  color: var(--color-primary, #409eff);
}

.icon-item span {
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style> 