<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { KnowledgeItem } from '@/types'

const props = defineProps<{
  knowledge: KnowledgeItem
  mode?: 'compact' | 'detailed'
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 截取文本
const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<template>
  <div 
    class="knowledge-card" 
    :class="[`mode-${mode || 'detailed'}`]"
    @click="emit('click')"
  >
    <!-- 封面 -->
    <div class="card-cover">
      <img 
        v-if="knowledge.coverImage" 
        :src="knowledge.coverImage" 
        :alt="knowledge.title"
        class="cover-image"
      />
      <div v-else class="cover-placeholder">
        <Icon icon="fluent:book-24-regular" />
      </div>
      
      <!-- 视频标识 -->
      <div v-if="knowledge.videoUrl" class="video-badge">
        <Icon icon="fluent:play-24-filled" />
      </div>
    </div>

    <!-- 内容 -->
    <div class="card-content">
      <h3 class="card-title">{{ knowledge.title }}</h3>
      <p class="card-introduction">
        {{ mode === 'compact' ? truncateText(knowledge.introduction, 60) : knowledge.introduction }}
      </p>
      
      <!-- 分类标签 -->
      <div v-if="knowledge.categories && knowledge.categories.length > 0" class="card-categories">
        <el-tag
          v-for="category in knowledge.categories.slice(0, 2)"
          :key="category.categoryId"
          size="small"
          effect="light"
          type="primary"
        >
          {{ category.categoryName }}
        </el-tag>
        <span v-if="knowledge.categories.length > 2" class="more-categories">
          +{{ knowledge.categories.length - 2 }}
        </span>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="card-footer">
      <div class="card-meta">
        <span class="meta-item">
          <Icon icon="fluent:person-24-regular" />
          管理员
        </span>
        <span class="meta-item">
          <Icon icon="fluent:calendar-24-regular" />
          {{ formatDate(knowledge.createdAt) }}
        </span>
      </div>
      
      <div class="card-actions">
        <slot name="actions">
          <Icon icon="fluent:arrow-right-24-regular" class="action-arrow" />
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--color-primary);
    
    .action-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
    
    .cover-image {
      transform: scale(1.05);
    }
  }
  
  &.mode-compact {
    .card-cover {
      height: 120px;
    }
    
    .card-content {
      padding: 12px;
    }
    
    .card-title {
      font-size: 14px;
      -webkit-line-clamp: 1;
    }
    
    .card-introduction {
      font-size: 12px;
      -webkit-line-clamp: 2;
    }
  }
}

.card-cover {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--color-bg-secondary);
  
  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-bg-secondary), var(--color-bg-tertiary));
    
    .iconify {
      font-size: 32px;
      color: var(--color-text-muted);
      opacity: 0.5;
    }
  }
  
  .video-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    
    .iconify {
      font-size: 14px;
      color: white;
    }
  }
}

.card-content {
  padding: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-introduction {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-categories {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  
  .more-categories {
    font-size: 11px;
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    padding: 2px 6px;
    border-radius: 8px;
  }
}

.card-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg-secondary);
}

.card-meta {
  display: flex;
  gap: 12px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
    
    .iconify {
      font-size: 12px;
    }
  }
}

.card-actions {
  .action-arrow {
    font-size: 16px;
    color: var(--color-primary);
    opacity: 0.6;
    transition: all 0.3s ease;
  }
}
</style> 