<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { KnowledgeItem } from '@/types'
import { computed, ref } from 'vue'

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
  currentPage: number
  totalPages: number
  canEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'view-detail', id: number): void
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
  (e: 'page-change', page: number): void
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

// 处理分页变化
const handlePageChange = (page: number) => {
  emit('page-change', page)
}

// 计算可见页码
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(props.totalPages, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})
</script>

<template>
  <div class="knowledge-list-mode">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated>
        <template #template>
          <div class="skeleton-item" v-for="i in 6" :key="i">
            <el-skeleton-item variant="image" style="width: 120px; height: 80px;" />
            <div class="skeleton-content">
              <el-skeleton-item variant="h3" style="width: 60%;" />
              <el-skeleton-item variant="text" style="width: 100%;" />
              <el-skeleton-item variant="text" style="width: 80%;" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 知识列表 -->
    <div v-else class="knowledge-table">
      <div class="table-header">
        <div class="header-cell cover">封面</div>
        <div class="header-cell title">标题</div>
        <div class="header-cell introduction">简介</div>
        <div class="header-cell stats">统计</div>
        <div class="header-cell date">创建时间</div>
        <div class="header-cell actions">操作</div>
      </div>

      <div class="table-body">
        <div 
          v-for="item in processedKnowledgeList" 
          :key="item.knowledgeId"
          class="table-row"
          @click="emit('view-detail', item.knowledgeId)"
        >
          <!-- 封面 -->
          <div class="cell cover-cell">
            <div class="cover-wrapper">
              <img 
                v-if="item.coverImage" 
                :src="item.coverImage" 
                :alt="item.title"
                class="cover-image"
              />
              <div v-else class="cover-placeholder">
                <Icon icon="fluent:image-24-regular" />
              </div>
            </div>
          </div>

          <!-- 标题 -->
          <div class="cell title-cell">
            <h3 class="knowledge-title">{{ item.title }}</h3>
            <div class="knowledge-meta">
              <span class="meta-item">
                <Icon icon="fluent:person-24-regular" />
                管理员
              </span>
              <span v-if="item.videoUrl" class="meta-item video-tag">
                <Icon icon="fluent:video-24-regular" />
                视频
              </span>
            </div>
          </div>

          <!-- 简介 -->
          <div class="cell introduction-cell">
            <p class="introduction-text">
              {{ truncateText(item.introduction) }}
            </p>
          </div>

          <!-- 统计信息 -->
          <div class="cell stats-cell">
            <div class="stats-info">
              <div class="stat-item">
                <Icon icon="fluent:eye-24-regular" />
                <span>{{ formatNumber(item.viewCount) }}</span>
              </div>
              <div class="stat-item">
                <Icon icon="fluent:heart-24-regular" />
                <span>{{ formatNumber(item.likeCount) }}</span>
              </div>
            </div>
          </div>

          <!-- 创建时间 -->
          <div class="cell date-cell">
            <span class="date-text">{{ formatDate(item.createdAt) }}</span>
          </div>

          <!-- 操作 -->
          <div class="cell actions-cell" @click.stop>
            <div class="action-buttons">
              <button
                class="action-btn view-btn"
                @click="emit('view-detail', item.knowledgeId)"
              >
                <Icon icon="fluent:eye-24-regular" />
                <span>查看</span>
              </button>
              
              <button
                v-if="canEdit"
                class="action-btn edit-btn"
                @click="emit('edit', item.knowledgeId)"
              >
                <Icon icon="fluent:edit-24-regular" />
                <span>编辑</span>
              </button>
              
              <button
                v-if="canEdit"
                class="action-btn delete-btn"
                @click="emit('delete', item.knowledgeId)"
              >
                <Icon icon="fluent:delete-24-regular" />
                <span>删除</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="!loading && processedKnowledgeList.length > 0" class="pagination-wrapper">
      <div class="pagination-info">
        共 {{ totalPages * 10 }} 条数据，第 {{ currentPage }} / {{ totalPages }} 页
      </div>
      
      <div class="pagination-controls">
        <button 
          class="page-btn"
          :disabled="currentPage <= 1"
          @click="handlePageChange(currentPage - 1)"
        >
          <Icon icon="fluent:chevron-left-24-regular" />
        </button>
        
        <button 
          v-for="page in visiblePages"
          :key="page"
          :class="['page-btn', 'page-number', { active: page === currentPage }]"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>
        
        <button 
          class="page-btn"
          :disabled="currentPage >= totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          <Icon icon="fluent:chevron-right-24-regular" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-list-mode {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  overflow: hidden;
}

.loading-state {
  padding: 24px;
  
  .skeleton-item {
    display: flex;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid var(--color-border-secondary);
    
    &:last-child {
      border-bottom: none;
    }
    
    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
}

.knowledge-table {
  .table-header {
    display: grid;
    grid-template-columns: 120px 1fr 2fr 100px 120px 220px;
    gap: 16px;
    padding: 20px 24px;
    background: var(--color-bg-secondary);
    border-bottom: 2px solid var(--color-border-primary);
    font-weight: 600;
    color: var(--color-text-primary);
    
    .header-cell {
      font-size: 14px;
      text-align: left;
      
      &.actions {
        text-align: center;
      }
    }
  }
  
  .table-body {
    .table-row {
      display: grid;
      grid-template-columns: 120px 1fr 2fr 100px 120px 220px;
      gap: 16px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border-secondary);
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: var(--color-bg-tertiary);
      }
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
}

.cell {
  display: flex;
  align-items: center;
  
  &.cover-cell {
    justify-content: center;
  }
  
  &.title-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  &.actions-cell {
    justify-content: center;
  }
}

.cover-wrapper {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  
  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .cover-placeholder {
    .iconify {
      font-size: 24px;
      color: var(--color-text-muted);
    }
  }
}

.knowledge-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.knowledge-meta {
  display: flex;
  gap: 12px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
    
    .iconify {
      font-size: 14px;
    }
    
    &.video-tag {
      color: var(--color-primary);
      font-weight: 500;
    }
  }
}

.introduction-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.stats-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
    
    .iconify {
      font-size: 14px;
      color: var(--color-text-muted);
    }
    
    span {
      font-weight: 500;
    }
  }
}

.date-text {
  font-size: 14px;
  color: var(--color-text-muted);
}

.action-buttons {
  display: flex;
  gap: 8px;
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.3s ease;
    background: var(--color-bg-secondary);
    white-space: nowrap;
    min-width: fit-content;
    
    :deep(.iconify),
    .iconify {
      font-size: 14px;
      flex-shrink: 0;
      display: inline-block;
      width: 14px;
      height: 14px;
    }
    
    span {
      flex-shrink: 0;
    }
    
    &.view-btn {
      color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.1);
      border-color: rgba(var(--color-primary-rgb), 0.2);
      
      &:hover {
        background: var(--color-primary);
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
      }
    }
    
    &.edit-btn {
      color: #f39c12;
      background: rgba(243, 156, 18, 0.1);
      border-color: rgba(243, 156, 18, 0.2);
      
      &:hover {
        background: #f39c12;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
      }
    }
    
    &.delete-btn {
      color: #e74c3c;
      background: rgba(231, 76, 60, 0.1);
      border-color: rgba(231, 76, 60, 0.2);
      
      &:hover {
        background: #e74c3c;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
      }
    }
  }
}

.pagination-wrapper {
  padding: 20px 24px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination-info {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-right: 24px;
}

.pagination-controls {
  display: flex;
  gap: 8px;
  
  .page-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 36px;
    padding: 0 8px;
    border: 1px solid var(--color-border-primary);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
    
    .iconify {
      font-size: 16px;
    }
    
    &:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.2);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--color-bg-secondary);
    }
    
    &.page-number.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
      box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.4);
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .knowledge-table {
    .table-header,
    .table-row {
      grid-template-columns: 80px 1fr 1.5fr 80px 100px 180px;
      gap: 12px;
      padding: 16px 20px;
    }
  }
  
  .cover-wrapper {
    width: 60px;
    height: 45px;
  }
  
  .knowledge-title {
    font-size: 14px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
    gap: 6px;
    
    .action-btn {
      font-size: 11px;
      padding: 6px 10px;
      min-width: 50px;
    }
  }
}

@media (max-width: 768px) {
  .knowledge-table {
    .table-header {
      display: none;
    }
    
    .table-row {
      display: block;
      padding: 20px;
      
      .cell {
        margin-bottom: 12px;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      .cover-cell {
        justify-content: flex-start;
      }
      
      .actions-cell {
        justify-content: flex-start;
      }
    }
  }
  
  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    
    .action-btn {
      font-size: 12px;
      padding: 8px 12px;
      min-width: 60px;
    }
  }
}
</style> 