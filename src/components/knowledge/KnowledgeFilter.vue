<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { MedicalCategory } from '@/types'

const props = defineProps<{
  categories: MedicalCategory[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'filter-change', filters: { categoryId?: number; keyword: string }): void
}>()

// 响应式数据
const selectedCategoryId = ref<number | undefined>(undefined)
const searchKeyword = ref('')
const showAdvancedFilter = ref(false)
const sortBy = ref('latest')
const contentTypes = ref<string[]>([])

// 监听筛选条件变化
const emitFilterChange = () => {
  emit('filter-change', {
    categoryId: selectedCategoryId.value,
    keyword: searchKeyword.value
  })
}

// 重置筛选条件
const resetFilters = () => {
  selectedCategoryId.value = undefined
  searchKeyword.value = ''
  emitFilterChange()
}

// 搜索关键词防抖
const debouncedSearch = debounce(() => {
  emitFilterChange()
}, 500)

// 监听搜索关键词变化
watch(searchKeyword, () => {
  debouncedSearch()
})

// 监听分类变化
watch(selectedCategoryId, () => {
  emitFilterChange()
})

// 防抖函数
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// 计算属性
const hasActiveFilters = computed(() => {
  return selectedCategoryId.value !== undefined || searchKeyword.value.trim() !== ''
})
</script>

<template>
  <div class="knowledge-filter">
    <div class="filter-main">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索知识标题、内容..."
          :prefix-icon="Search"
          size="large"
          clearable
          :disabled="loading"
        >
          <template #prefix>
            <Icon icon="fluent:search-24-regular" />
          </template>
        </el-input>
      </div>

      <!-- 分类筛选 -->
      <div class="category-filter">
        <el-select
          v-model="selectedCategoryId"
          placeholder="选择医疗分类"
          size="large"
          clearable
          :disabled="loading"
          style="width: 200px;"
        >
          <el-option
            v-for="category in categories"
            :key="category.categoryId"
            :label="category.categoryName"
            :value="category.categoryId"
          />
        </el-select>
      </div>

      <!-- 高级筛选切换 -->
      <div class="advanced-toggle">
        <button 
          :class="['filter-btn', { active: showAdvancedFilter }]"
          @click="showAdvancedFilter = !showAdvancedFilter"
        >
          <Icon icon="fluent:filter-24-regular" />
          <span>高级筛选</span>
        </button>
      </div>

      <!-- 重置按钮 -->
      <div v-if="hasActiveFilters" class="reset-filters">
        <button class="reset-btn" @click="resetFilters">
          <Icon icon="fluent:arrow-reset-24-regular" />
          <span>重置</span>
        </button>
      </div>
    </div>

    <!-- 高级筛选面板 -->
    <div v-if="showAdvancedFilter" class="advanced-filter">
      <div class="filter-section">
        <h4>排序方式</h4>
        <el-radio-group v-model="sortBy" @change="emitFilterChange">
          <el-radio label="latest">最新发布</el-radio>
          <el-radio label="popular">热门阅读</el-radio>
          <el-radio label="updated">最近更新</el-radio>
        </el-radio-group>
      </div>

      <div class="filter-section">
        <h4>内容类型</h4>
        <el-checkbox-group v-model="contentTypes" @change="emitFilterChange">
          <el-checkbox label="text">文字内容</el-checkbox>
          <el-checkbox label="video">视频内容</el-checkbox>
          <el-checkbox label="image">图片内容</el-checkbox>
        </el-checkbox-group>
      </div>
    </div>

    <!-- 当前筛选条件显示 -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="filter-label">当前筛选：</span>
      
      <el-tag
        v-if="selectedCategoryId"
        type="primary"
        closable
        @close="selectedCategoryId = undefined"
      >
        {{ categories.find(c => c.categoryId === selectedCategoryId)?.categoryName }}
      </el-tag>

      <el-tag
        v-if="searchKeyword.trim()"
        type="info"
        closable
        @close="searchKeyword = ''"
      >
        关键词: {{ searchKeyword.trim() }}
      </el-tag>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-filter {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.filter-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
  
  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
    
    .el-input__prefix {
      .iconify {
        font-size: 18px;
        color: var(--color-text-secondary);
      }
    }
  }
}

.category-filter {
  :deep(.el-select) {
    .el-select__wrapper {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

.advanced-toggle,
.reset-filters {
  .filter-btn, .reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: 2px solid var(--color-border-primary);
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .iconify {
      font-size: 16px;
    }
    
    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);
    }
  }
  
  .filter-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
  }
  
  .reset-btn {
    border-color: #ff6b6b;
    color: #ff6b6b;
    
    &:hover {
      background: #ff6b6b;
      border-color: #ff6b6b;
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
    }
  }
}

.advanced-filter {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-secondary);
}

.filter-section {
  margin-bottom: 20px;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 12px 0;
  }
  
  :deep(.el-radio-group) {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  :deep(.el-checkbox-group) {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
}

.active-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-secondary);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

// 响应式设计
@media (max-width: 768px) {
  .filter-main {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: unset;
  }
  
  .category-filter {
    :deep(.el-select) {
      width: 100% !important;
    }
  }
  
  .advanced-toggle,
  .reset-filters {
    align-self: flex-start;
  }
}
</style> 