<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { KnowledgeItem } from '@/types'
import { ref, computed, watch } from 'vue'

// API基础URL
const apiBaseUrl = ref('')
try {
  apiBaseUrl.value = import.meta.env.VITE_API_BASE_URL || ''
} catch(e) {
  apiBaseUrl.value = ''
  console.warn('环境变量VITE_API_BASE_URL未定义')
}

const props = defineProps<{
  knowledgeList: KnowledgeItem[]
  loading: boolean
  hasMore: boolean
}>()

const emit = defineEmits<{
  (e: 'view-detail', id: number): void
  (e: 'load-more'): void
}>()

// 处理后的知识列表数据
const processedKnowledgeList = computed(() => {
  return props.knowledgeList.map(item => {
    const processed = { ...item }
    
    // 处理封面图片路径
    if (processed.coverImage) {
      if (!processed.coverImage.startsWith('http') && !processed.coverImage.startsWith('data:')) {
        processed.coverImage = apiBaseUrl.value + processed.coverImage
      }
    }
    
    return processed
  })
})

// 无限滚动容器引用
const waterfallContainer = ref<HTMLElement>()

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
}

// 截取文本
const truncateText = (text: string, maxLength: number = 120): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 格式化数字显示
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

// 设置无限滚动
const setupInfiniteScroll = () => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && props.hasMore && !props.loading) {
      emit('load-more')
    }
  }, {
    threshold: 0.1
  })
  
  if (waterfallContainer.value) {
    const loadingTrigger = waterfallContainer.value.querySelector('.loading-trigger')
    if (loadingTrigger) {
      observer.observe(loadingTrigger)
    }
  }
  
  return observer
}

// 组件挂载后设置无限滚动
onMounted(() => {
  nextTick(() => {
    setupInfiniteScroll()
  })
})

// 监听数据变化，重新设置无限滚动
watch(() => props.knowledgeList.length, () => {
  nextTick(() => {
    setupInfiniteScroll()
  })
})
</script>

<template>
  <div class="knowledge-waterfall-mode" ref="waterfallContainer">
    <!-- 瀑布流网格 -->
    <div class="waterfall-grid">
      <div
        v-for="(item, index) in processedKnowledgeList"
        :key="item.knowledgeId"
        class="knowledge-card"
        :class="`card-${index % 3}`"
        @click="emit('view-detail', item.knowledgeId)"
      >
        <!-- 封面图片 -->
        <div class="card-cover">
          <img 
            v-if="item.coverImage" 
            :src="item.coverImage" 
            :alt="item.title"
            class="cover-image"
          />
          <div v-else class="cover-placeholder">
            <Icon icon="fluent:book-24-regular" />
          </div>
          
          <!-- 视频标识 -->
          <div v-if="item.videoUrl" class="video-badge">
            <Icon icon="fluent:play-24-filled" />
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-introduction">{{ truncateText(item.introduction) }}</p>
          
          <!-- 分类标签 -->
          <div v-if="item.categories && item.categories.length > 0" class="card-categories">
            <el-tag
              v-for="category in item.categories.slice(0, 2)"
              :key="category.categoryId"
              size="small"
              effect="light"
              type="primary"
            >
              {{ category.categoryName }}
            </el-tag>
            <span v-if="item.categories.length > 2" class="more-categories">
              +{{ item.categories.length - 2 }}
            </span>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="card-meta">
            <span class="meta-item">
              <Icon icon="fluent:person-24-regular" />
              管理员
            </span>
            <span class="meta-item">
              <Icon icon="fluent:calendar-24-regular" />
              {{ formatDate(item.createdAt) }}
            </span>
          </div>
          
          <!-- 统计信息 -->
          <div class="card-stats">
            <span class="stat-item">
              <Icon icon="fluent:eye-24-regular" />
              {{ formatNumber(item.viewCount) }}
            </span>
            <span class="stat-item">
              <Icon icon="fluent:heart-24-regular" />
              {{ formatNumber(item.likeCount) }}
            </span>
          </div>
          
          <div class="card-actions">
            <Icon icon="fluent:arrow-right-24-regular" class="action-arrow" />
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-cards">
        <div v-for="i in 6" :key="i" class="loading-card">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" style="width: 100%; height: 200px;" />
              <div style="padding: 16px;">
                <el-skeleton-item variant="h3" style="width: 80%;" />
                <el-skeleton-item variant="text" style="width: 100%; margin-top: 12px;" />
                <el-skeleton-item variant="text" style="width: 60%; margin-top: 8px;" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>

    <!-- 无限滚动触发器 -->
    <div v-if="hasMore && !loading" class="loading-trigger">
      <div class="load-more-hint">
        <Icon icon="fluent:arrow-down-24-regular" />
        <span>继续滚动加载更多</span>
      </div>
    </div>

    <!-- 没有更多数据 -->
    <div v-else-if="!hasMore && knowledgeList.length > 0" class="no-more-data">
      <Icon icon="fluent:checkmark-circle-24-filled" />
      <span>已加载全部内容</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-waterfall-mode {
  max-height: 800px;
  overflow-y: auto;
  padding-right: 8px;
  margin-right: -8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border-primary);
    border-radius: 3px;
    transition: background 0.3s ease;

    &:hover {
      background: var(--color-primary);
    }
  }
}

.waterfall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  padding: 8px;
}

.knowledge-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  animation: slideInUp 0.6s ease forwards;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    border-color: var(--color-primary);
    
    .action-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
    
    .cover-image {
      transform: scale(1.05);
    }
  }
  
  // 交错动画延迟
  &.card-0 { animation-delay: 0.1s; }
  &.card-1 { animation-delay: 0.2s; }
  &.card-2 { animation-delay: 0.3s; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-cover {
  position: relative;
  width: 100%;
  height: 200px;
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
      font-size: 48px;
      color: var(--color-text-muted);
      opacity: 0.5;
    }
  }
  
  .video-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    
    .iconify {
      font-size: 16px;
      color: white;
    }
  }
}

.card-content {
  padding: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-introduction {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-categories {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  
  .more-categories {
    font-size: 12px;
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    padding: 4px 8px;
    border-radius: 12px;
  }
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg-secondary);
  gap: 12px;
}

.card-meta {
  display: flex;
  gap: 16px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
    
    .iconify {
      font-size: 14px;
    }
  }
}

.card-stats {
  display: flex;
  gap: 16px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
    
    .iconify {
      font-size: 14px;
    }
  }
}

.card-actions {
  .action-arrow {
    font-size: 18px;
    color: var(--color-primary);
    opacity: 0.6;
    transition: all 0.3s ease;
  }
}

.loading-state {
  .loading-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    padding: 8px;
    
    .loading-card {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-primary);
      border-radius: 16px;
      overflow: hidden;
    }
  }
}

.loading-trigger {
  padding: 40px 20px;
  text-align: center;
  
  .load-more-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--color-text-secondary);
    font-size: 14px;
    
    .iconify {
      font-size: 24px;
      animation: bounce 2s infinite;
    }
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.no-more-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--color-text-muted);
  font-size: 14px;
  
  .iconify {
    font-size: 32px;
    color: var(--color-primary);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .waterfall-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .knowledge-card {
    margin: 0 8px;
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .card-introduction {
    -webkit-line-clamp: 2;
  }
  
  .loading-state .loading-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .card-cover {
    height: 160px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-footer {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .card-meta,
  .card-stats {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .card-actions {
    align-self: flex-end;
  }
}
</style> 