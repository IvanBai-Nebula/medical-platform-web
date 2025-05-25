<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, watchEffect } from 'vue'
import { ExperienceStatus } from '@/services/type/experience.d'

const props = defineProps<{
  loading?: boolean
  defaultStatus?: string
}>()

const emit = defineEmits<{
  (e: 'filter-change', filters: { status?: string; keyword: string }): void
}>()

// 响应式数据
const selectedStatus = ref<string>(props.defaultStatus || '')
const searchKeyword = ref('')
const isExpanded = ref(false)

// 状态选项
const statusOptions = [
  { value: '', label: '全部状态', apiValue: undefined },
  { value: ExperienceStatus.APPROVED, label: '已发布', apiValue: ExperienceStatus.APPROVED },
  { value: ExperienceStatus.PENDING, label: '待审核', apiValue: ExperienceStatus.PENDING },
  { value: ExperienceStatus.REJECTED, label: '已驳回', apiValue: ExperienceStatus.REJECTED },
]

// 获取UI显示的状态值
const getUIStatusValue = (apiStatus?: string) => {
  if (!apiStatus) return ''
  const option = statusOptions.find(opt => opt.apiValue === apiStatus)
  return option ? option.value : ''
}

// 监视defaultStatus的变化
watchEffect(() => {
  if (props.defaultStatus) {
    // 将API状态值转换为UI状态值
    selectedStatus.value = getUIStatusValue(props.defaultStatus)
  }
})

// 组件挂载时同步状态
onMounted(() => {
  // 确保UI显示与API请求保持一致
  if (props.defaultStatus) {
    // 将API状态值转换为UI状态值
    selectedStatus.value = getUIStatusValue(props.defaultStatus)
  }
})

// 防抖搜索
let timeout: number | null = null

// 计算活跃筛选器数量
const hasActiveFilters = computed(() => {
  return selectedStatus.value !== '' || searchKeyword.value.trim() !== ''
})

// 处理搜索输入
const handleSearchInput = () => {
  if (timeout) {
    clearTimeout(timeout)
  }
  
  timeout = window.setTimeout(() => {
    emitFilterChange()
  }, 300)
}

// 处理状态变化
const handleStatusChange = () => {
  emitFilterChange()
}

// 发出筛选变化事件
const emitFilterChange = () => {
  // 找到对应的API值
  const selectedOption = statusOptions.find(opt => opt.value === selectedStatus.value)
  const apiStatus = selectedOption ? selectedOption.apiValue : undefined
  
  emit('filter-change', {
    status: apiStatus,
    keyword: searchKeyword.value,
  })
}

// 清除所有筛选条件
const clearFilters = () => {
  selectedStatus.value = ''
  searchKeyword.value = ''
  emitFilterChange()
}

// 切换展开状态
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="experience-filter">
    <div class="filter-container">
      <!-- 主要筛选栏 -->
      <div class="filter-main">
        <!-- 搜索框 -->
        <div class="search-section">
          <div class="search-input-wrapper">
            <Icon icon="fluent:search-24-regular" class="search-icon" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索心得标题或内容..."
              class="search-input"
              @input="handleSearchInput"
              :disabled="loading"
            />
            <button
              v-if="searchKeyword"
              class="clear-search-btn"
              @click="searchKeyword = ''; emitFilterChange()"
              title="清除搜索"
            >
              <Icon icon="fluent:dismiss-24-regular" />
            </button>
          </div>
        </div>

        <!-- 快速筛选按钮组 -->
        <div class="quick-filters">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            class="filter-btn"
            :class="{ 'active': selectedStatus === option.value }"
            @click="selectedStatus = option.value; handleStatusChange()"
            :disabled="loading"
          >
            {{ option.label }}
          </button>
        </div>

        <!-- 工具栏 -->
        <div class="filter-toolbar">
          <!-- 活跃筛选器指示 -->
          <div v-if="hasActiveFilters" class="active-indicator">
            <Icon icon="fluent:filter-24-filled" />
            <span>{{ hasActiveFilters ? '已筛选' : '' }}</span>
          </div>

          <!-- 清除筛选按钮 -->
          <button
            v-if="hasActiveFilters"
            class="clear-btn"
            @click="clearFilters"
            :disabled="loading"
            title="清除所有筛选条件"
          >
            <Icon icon="fluent:eraser-24-regular" />
            <span>清除</span>
          </button>

          <!-- 展开/收起按钮 -->
          <button
            class="expand-btn"
            @click="toggleExpanded"
            :title="isExpanded ? '收起筛选器' : '展开筛选器'"
          >
            <Icon :icon="isExpanded ? 'fluent:chevron-up-24-regular' : 'fluent:chevron-down-24-regular'" />
          </button>
        </div>
      </div>

      <!-- 扩展筛选面板 -->
      <div v-if="isExpanded" class="filter-expanded">
        <div class="expanded-content">
          <div class="filter-group">
            <label class="filter-label">状态筛选</label>
            <div class="filter-options">
              <label
                v-for="option in statusOptions"
                :key="option.value"
                class="radio-option"
                :class="{ 'checked': selectedStatus === option.value }"
              >
                <input
                  v-model="selectedStatus"
                  type="radio"
                  :value="option.value"
                  @change="handleStatusChange"
                  :disabled="loading"
                />
                <span class="radio-label">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">搜索选项</label>
            <div class="search-options">
              <div class="search-tips">
                <Icon icon="fluent:lightbulb-24-regular" />
                <span>支持搜索心得标题、内容关键词</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.experience-filter {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.filter-container {
  width: 100%;
}

.filter-main {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  flex-wrap: wrap;
}

.search-section {
  flex: 1;
  min-width: 300px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  
  .search-icon {
    position: absolute;
    left: 12px;
    font-size: 18px;
    color: var(--color-text-muted);
    z-index: 1;
  }
  
  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 1px solid var(--color-border-primary);
    border-radius: 12px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 14px;
    transition: all 0.3s ease;
    
    &::placeholder {
      color: var(--color-text-muted);
    }
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .clear-search-btn {
    position: absolute;
    right: 8px;
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }
  }
}

.quick-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  
  .filter-btn {
    padding: 8px 16px;
    border: 1px solid var(--color-border-primary);
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    
    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.05);
    }
    
    &.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  
  .iconify {
    font-size: 16px;
  }
}

.clear-btn, .expand-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 14px;
  }
  
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.expand-btn {
  padding: 8px;
  
  .iconify {
    font-size: 16px;
  }
}

.filter-expanded {
  border-top: 1px solid var(--color-border-secondary);
  background: var(--color-bg-secondary);
}

.expanded-content {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.filter-group {
  .filter-label {
    display: block;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 12px;
    font-size: 14px;
  }
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 0;
  
  input[type="radio"] {
    margin: 0;
    accent-color: var(--color-primary);
  }
  
  .radio-label {
    font-size: 14px;
    color: var(--color-text-secondary);
    transition: color 0.3s ease;
  }
  
  &:hover,
  &.checked {
    .radio-label {
      color: var(--color-text-primary);
    }
  }
}

.search-options {
  .search-tips {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-muted);
    font-size: 13px;
    padding: 12px;
    background: var(--color-bg-primary);
    border-radius: 8px;
    border: 1px solid var(--color-border-primary);
    
    .iconify {
      font-size: 16px;
      color: var(--color-warning);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .filter-main {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .search-section {
    min-width: auto;
  }
  
  .quick-filters {
    justify-content: center;
  }
  
  .filter-toolbar {
    justify-content: space-between;
  }
  
  .expanded-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .quick-filters {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    
    .filter-btn {
      text-align: center;
    }
  }
  
  .search-input-wrapper {
    .search-input {
      padding-left: 40px;
      font-size: 16px; // 防止iOS缩放
    }
  }
}
</style> 