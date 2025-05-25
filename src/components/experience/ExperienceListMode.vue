<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import type { ExperienceItem } from '@/types'
import { getUserAvatar } from '@/utils/images'
import { extractAndTruncateText } from '@/utils/text'

const props = defineProps<{
  experiences: ExperienceItem[]
  loading?: boolean
  currentPage: number
  pageSize: number
  totalPages: number
  canManage?: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-detail', id: number): void
  (e: 'edit', experience: ExperienceItem): void
  (e: 'delete', experience: ExperienceItem): void
  (e: 'page-change', page: number): void
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

// 格式化状态
const getStatusInfo = (status: string) => {
  const statusMap = {
    'approved': { label: '已发布', class: 'status-approved' },
    'pending': { label: '待审核', class: 'status-pending' },
    'rejected': { label: '已驳回', class: 'status-rejected' },
  }
  return statusMap[status as keyof typeof statusMap] || { label: '未知', class: 'status-unknown' }
}

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

// 截取内容（解析HTML）
const truncateContent = (content: string, maxLength = 100): string => {
  return extractAndTruncateText(content, maxLength)
}

// 权限检查
const canEdit = (experience: ExperienceItem) => {
  return props.isAdmin || experience.userId === 101 // 假设当前用户ID为101
}

const canDelete = (experience: ExperienceItem) => {
  return props.isAdmin || experience.userId === 101 // 假设当前用户ID为101
}

// 分页相关
const totalPagesComputed = computed(() => props.totalPages)
const currentPageComputed = computed(() => props.currentPage + 1)

const handlePageChange = (page: number) => {
  emit('page-change', page)
}
</script>

<template>
  <div class="experience-list-mode">
    <!-- 列表头部 -->
    <div class="list-header">
      <h3 class="list-title">
        <Icon icon="fluent:table-24-regular" />
        列表视图
      </h3>
      <div class="list-stats">
        <span class="stats-text">共 {{ experiences.length }} 条心得</span>
      </div>
    </div>

    <!-- 心得表格 -->
    <div class="table-container">
      <table class="experience-table">
        <thead>
          <tr>
            <th>作者</th>
            <th>标题</th>
            <th>内容预览</th>
            <th>状态</th>
            <th>点赞数</th>
            <th>发布时间</th>
            <th v-if="canManage" class="actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 加载状态 -->
          <tr v-if="loading" v-for="i in pageSize" :key="`loading-${i}`" class="loading-row">
            <td colspan="7">
              <div class="skeleton-row">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-content">
                  <div class="skeleton-line skeleton-title"></div>
                  <div class="skeleton-line skeleton-text"></div>
                </div>
              </div>
            </td>
          </tr>

          <!-- 心得数据 -->
          <tr 
            v-else 
            v-for="experience in experiences" 
            :key="experience.experienceId"
            class="experience-row"
            @click="emit('view-detail', experience.experienceId)"
          >
            <!-- 作者 -->
            <td class="author-cell">
              <div class="author-info">
                <img 
                  :src="getUserAvatar(experience.avatar, 40)" 
                  :alt="experience.username"
                  class="author-avatar"
                />
                <div class="author-details">
                  <span class="author-name">{{ experience.username || '匿名用户' }}</span>
                </div>
              </div>
            </td>

            <!-- 标题 -->
            <td class="title-cell">
              <h4 class="experience-title">{{ experience.title }}</h4>
            </td>

            <!-- 内容预览 -->
            <td class="content-cell">
              <p class="content-preview">{{ truncateContent(experience.content) }}</p>
            </td>

            <!-- 状态 -->
            <td class="status-cell">
              <span 
                class="status-badge" 
                :class="getStatusInfo(experience.status).class"
              >
                {{ getStatusInfo(experience.status).label }}
              </span>
            </td>

            <!-- 点赞数 -->
            <td class="likes-cell">
              <div class="likes-info">
                <Icon icon="fluent:heart-24-regular" />
                <span>{{ formatNumber(experience.likeCount) }}</span>
              </div>
            </td>

            <!-- 发布时间 -->
            <td class="date-cell">
              <span class="date-text">{{ formatDate(experience.createdAt) }}</span>
            </td>

            <!-- 操作 -->
            <td v-if="canManage" class="actions-cell" @click.stop>
              <div class="action-buttons">
                <button
                  v-if="canEdit(experience)"
                  class="action-btn edit-btn"
                  @click="emit('edit', experience)"
                  title="编辑"
                >
                  <Icon icon="fluent:edit-24-regular" />
                </button>
                <button
                  v-if="canDelete(experience)"
                  class="action-btn delete-btn"
                  @click="emit('delete', experience)"
                  title="删除"
                >
                  <Icon icon="fluent:delete-24-regular" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="!loading && totalPagesComputed > 1" class="pagination-container">
      <div class="pagination">
        <button
          class="page-btn"
          :disabled="currentPageComputed <= 1"
          @click="handlePageChange(currentPageComputed - 1)"
        >
          <Icon icon="fluent:chevron-left-24-regular" />
          上一页
        </button>
        
        <span class="page-info">
          第 {{ currentPageComputed }} 页，共 {{ totalPagesComputed }} 页
        </span>
        
        <button
          class="page-btn"
          :disabled="currentPageComputed >= totalPagesComputed"
          @click="handlePageChange(currentPageComputed + 1)"
        >
          下一页
          <Icon icon="fluent:chevron-right-24-regular" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.experience-list-mode {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border-primary);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-secondary);
  background: var(--color-bg-secondary);
}

.list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  
  .iconify {
    font-size: 20px;
    color: var(--color-primary);
  }
}

.list-stats {
  .stats-text {
    font-size: 14px;
    color: var(--color-text-muted);
  }
}

.table-container {
  overflow-x: auto;
}

.experience-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 16px 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border-secondary);
  }
  
  th {
    background: var(--color-bg-secondary);
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 14px;
    white-space: nowrap;
    
    &.actions-column {
      width: 100px;
      text-align: center;
    }
  }
  
  .experience-row {
    cursor: pointer;
    transition: background-color 0.3s ease;
    
    &:hover {
      background: var(--color-bg-secondary);
    }
    
    &:last-child td {
      border-bottom: none;
    }
  }
  
  .loading-row {
    &:hover {
      background: none;
    }
  }
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.skeleton-avatar, .skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  height: 16px;
  width: 60%;
  border-radius: 4px;
}

.skeleton-text {
  height: 14px;
  width: 80%;
  border-radius: 4px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.author-cell {
  min-width: 140px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border-primary);
}

.author-details {
  .author-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
}

.title-cell {
  min-width: 200px;
}

.experience-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
  
  &:hover {
    color: var(--color-primary);
  }
}

.content-cell {
  min-width: 250px;
  max-width: 300px;
}

.content-preview {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
}

.status-cell {
  min-width: 100px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  
  &.status-approved {
    background: #d4edda;
    color: #155724;
  }
  
  &.status-pending {
    background: #fff3cd;
    color: #856404;
  }
  
  &.status-rejected {
    background: #f8d7da;
    color: #721c24;
  }
  
  &.status-unknown {
    background: var(--color-bg-secondary);
    color: var(--color-text-muted);
  }
}

.likes-cell {
  min-width: 80px;
}

.likes-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 13px;
  
  .iconify {
    font-size: 14px;
  }
}

.date-cell {
  min-width: 100px;
}

.date-text {
  font-size: 13px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.actions-cell {
  min-width: 100px;
  width: 100px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 16px;
  }
  
  &.edit-btn {
    color: #f39c12;
    
    &:hover {
      background: #f39c12;
      color: white;
      border-color: #f39c12;
    }
  }
  
  &.delete-btn {
    color: #e74c3c;
    
    &:hover {
      background: #e74c3c;
      color: white;
      border-color: #e74c3c;
    }
  }
}

.pagination-container {
  padding: 20px 24px;
  border-top: 1px solid var(--color-border-secondary);
  background: var(--color-bg-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 14px;
  }
  
  &:hover:not(:disabled) {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 14px;
  color: var(--color-text-muted);
}

// 响应式设计
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .experience-table {
    font-size: 13px;
    
    th, td {
      padding: 12px 8px;
    }
  }
  
  .author-cell {
    min-width: 120px;
  }
  
  .title-cell {
    min-width: 150px;
  }
  
  .content-cell {
    min-width: 200px;
    max-width: 250px;
  }
}

@media (max-width: 480px) {
  .experience-table {
    th, td {
      padding: 8px 6px;
    }
  }
  
  .author-info {
    gap: 8px;
  }
  
  .author-avatar {
    width: 32px;
    height: 32px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
}
</style> 