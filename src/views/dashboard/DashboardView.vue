<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { useTheme } from '@/composables/useTheme'
import { ElCard, ElButton, ElSkeleton, ElMessage } from 'element-plus'
import { getDashboardData } from '@/services'
import type { DashboardData } from '@/services/type/dashboard'

const router = useRouter()
const userStore = useUserStore()
const { currentTheme } = useTheme()

// 状态管理
const loading = ref(true)
const refreshing = ref(false)

// 数据状态
const dashboardData = reactive<DashboardData>({
  // 统计数据
  stats: {
    totalKnowledge: 0,
    totalExperience: 0,
    pendingReviews: 0,
    activeUsers: 0
  },
  // 快速统计
  quickStats: {
    todayViews: 0,
    weeklyGrowth: 0,
    monthlyActive: 0
  }
})

// 计算属性
const isAdmin = computed(() => userStore.isAdmin)
const currentUser = computed(() => userStore.userInfo)
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 获取仪表盘数据
const fetchDashboardData = async () => {
  try {
    loading.value = true
    
    // 调用API获取仪表盘数据，确保isAdmin是严格的布尔值
    const response = await getDashboardData({
      isAdmin: Boolean(isAdmin.value)
    })
    
    // 更新仪表盘数据 - 修改判断条件以匹配后端返回的实际结构
    if (response && response.code === 200 && response.data) {
      dashboardData.stats = response.data.stats
      dashboardData.quickStats = response.data.quickStats
    } else {
      throw new Error('获取数据失败')
    }
    
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error('加载数据失败，请重试')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  refreshing.value = true
  await fetchDashboardData()
  refreshing.value = false
  ElMessage.success('数据已刷新')
}

// 快速操作
const quickActions = [
  {
    title: '创建知识',
    description: '分享新的医疗知识',
    icon: 'fluent:document-add-24-filled',
    color: '#1976d2',
    action: () => router.push('/knowledge/create')
  },
  {
    title: '写学习心得',
    description: '记录学习体会',
    icon: 'fluent:pen-24-filled',
    color: '#388e3c',
    action: () => router.push('/experience/create')
  },
  {
    title: '浏览知识库',
    description: '查看最新内容',
    icon: 'fluent:library-24-filled',
    color: '#f57c00',
    action: () => router.push('/knowledge')
  },
  {
    title: '查看心得',
    description: '学习他人经验',
    icon: 'fluent:people-24-filled',
    color: '#7b1fa2',
    action: () => router.push('/experience')
  }
]

// 管理员快速操作
const adminActions = [
  {
    title: '内容审核',
    description: '审核待发布内容',
    icon: 'fluent:shield-checkmark-24-filled',
    color: '#d32f2f',
    action: () => {
      // 显示提示消息，表明正在开发中
      ElMessage({
        message: '审核功能正在开发中，即将推出',
        type: 'info',
        duration: 3000
      });
      // 暂时跳转到知识列表页面
      router.push('/knowledge');
    },
    badge: dashboardData.stats.pendingReviews
  },
  {
    title: '用户管理',
    description: '管理用户账户',
    icon: 'fluent:people-settings-24-filled',
    color: '#1976d2',
    action: () => router.push('/admin/users')
  },
  {
    title: '分类管理',
    description: '管理知识分类',
    icon: 'fluent:data-usage-24-filled',
    color: '#388e3c',
    action: () => router.push('/admin/categories')
  }
]

// 初始化
onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="dashboard-page">
    <!-- 头部区域 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="welcome-section">
          <div class="avatar-section">
            <div class="user-avatar">
              <Icon icon="fluent:person-24-filled" />
            </div>
            <div class="welcome-text">
              <h1 class="greeting">{{ greeting }}，{{ currentUser?.username || '用户' }}！</h1>
              <p class="subtitle">
                欢迎回到医疗知识平台，今天是
                <span class="highlight">{{ new Date().toLocaleDateString('zh-CN') }}</span>
              </p>
            </div>
    </div>
        </div>
        
        <div class="header-actions">
          <ElButton 
            type="primary" 
            :icon="refreshing ? 'Loading' : 'Refresh'"
            :loading="refreshing"
            @click="refreshData"
            class="refresh-btn"
          >
            刷新数据
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <ElSkeleton animated>
        <template #template>
          <div class="skeleton-dashboard">
            <div class="skeleton-stats">
              <el-skeleton-item variant="rect" style="width: 100%; height: 120px;" />
              <el-skeleton-item variant="rect" style="width: 100%; height: 120px;" />
              <el-skeleton-item variant="rect" style="width: 100%; height: 120px;" />
              <el-skeleton-item variant="rect" style="width: 100%; height: 120px;" />
            </div>
          </div>
        </template>
      </ElSkeleton>
    </div>

    <!-- 仪表盘内容 -->
    <div v-else class="dashboard-content">
      <!-- 统计卡片区域 - 四个卡片一行显示 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">
              <Icon icon="fluent:book-24-filled" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboardData.stats.totalKnowledge }}</div>
              <div class="stat-label">知识文章总数</div>
              <div class="stat-trend">
                <Icon icon="fluent:arrow-trending-up-24-filled" />
                <span>+{{ dashboardData.quickStats.weeklyGrowth }}% 本周</span>
              </div>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">
              <Icon icon="fluent:heart-24-filled" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboardData.stats.totalExperience }}</div>
              <div class="stat-label">学习心得总数</div>
              <div class="stat-trend">
                <Icon icon="fluent:eye-24-filled" />
                <span>{{ dashboardData.quickStats.todayViews }} 今日浏览</span>
              </div>
            </div>
          </div>

          <div v-if="isAdmin" class="stat-card warning">
            <div class="stat-icon">
              <Icon icon="fluent:shield-24-filled" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboardData.stats.pendingReviews }}</div>
              <div class="stat-label">待审核内容</div>
              <div class="stat-trend">
                <Icon icon="fluent:clock-24-filled" />
                <span>需要处理</span>
              </div>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">
              <Icon icon="fluent:people-24-filled" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboardData.stats.activeUsers }}</div>
              <div class="stat-label">活跃用户</div>
              <div class="stat-trend">
                <Icon icon="fluent:person-add-24-filled" />
                <span>{{ dashboardData.quickStats.monthlyActive }} 本月活跃</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速操作区域 -->
      <div class="actions-section">
        <!-- 快速操作 -->
        <ElCard class="quick-actions-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <Icon icon="fluent:flash-24-filled" />
                <span>快速操作</span>
              </div>
            </div>
          </template>
          
          <div class="quick-actions-grid">
            <div 
              v-for="action in quickActions" 
              :key="action.title"
              class="quick-action-item"
              @click="action.action"
            >
              <div class="action-icon" :style="{ backgroundColor: action.color }">
                <Icon :icon="action.icon" />
              </div>
              <div class="action-content">
                <div class="action-title">{{ action.title }}</div>
                <div class="action-description">{{ action.description }}</div>
              </div>
              <div class="action-arrow">
                <Icon icon="fluent:chevron-right-24-filled" />
              </div>
            </div>
          </div>
        </ElCard>

        <!-- 管理员快速操作 -->
        <ElCard v-if="isAdmin" class="admin-actions-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <Icon icon="fluent:shield-24-filled" />
                <span>管理员操作</span>
              </div>
              <div class="admin-badge">
                <Icon icon="fluent:certificate-24-filled" />
                <span>管理员</span>
              </div>
            </div>
          </template>
          
          <div class="admin-actions-grid">
            <div 
              v-for="action in adminActions" 
              :key="action.title"
              class="admin-action-item"
              @click="action.action"
            >
              <div class="action-icon" :style="{ backgroundColor: action.color }">
                <Icon :icon="action.icon" />
                <div v-if="action.badge && action.badge > 0" class="action-badge">
                  {{ action.badge }}
                </div>
              </div>
              <div class="action-content">
                <div class="action-title">{{ action.title }}</div>
                <div class="action-description">{{ action.description }}</div>
              </div>
              <div class="action-arrow">
                <Icon icon="fluent:chevron-right-24-filled" />
              </div>
            </div>
          </div>
        </ElCard>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.dashboard-header {
  margin-bottom: 40px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
  }

  .welcome-section {
    flex: 1;

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 20px;

      .user-avatar {
        width: 72px;
        height: 72px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 28px;
        box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.3);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(var(--color-primary-rgb), 0.4);
        }
      }

      .welcome-text {
        .greeting {
          font-size: 32px;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 18px;
          color: var(--color-text-secondary);
          margin: 0;
          font-weight: 500;

          .highlight {
            color: var(--color-primary);
            font-weight: 700;
          }
        }
      }
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

// 美化刷新按钮 - 统一样式（参考用户管理页面）
.refresh-btn {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 12px 20px !important;
  border: 2px solid var(--color-primary) !important;
  background: var(--color-bg-elevated) !important;
  color: var(--color-primary) !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  
  :deep(.el-icon) {
    font-size: 16px !important;
    transition: transform 0.3s ease !important;
  }
  
  &.is-loading :deep(.el-icon) {
    animation: spin 1s linear infinite !important;
  }
  
  &:hover:not(.is-loading) {
    background: var(--color-primary) !important;
    color: white !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3) !important;
  }
  
  &.is-loading {
    opacity: 0.6 !important;
    cursor: not-allowed !important;
    transform: none !important;
  }
}

.loading-section {
  .skeleton-dashboard {
    .skeleton-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
  }
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.stats-section {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  .stat-card {
    background: var(--color-bg-elevated);
    border-radius: 20px;
    padding: 28px;
    display: flex;
    align-items: center;
    gap: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--color-border-primary);
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
    }

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      border-color: var(--accent-color);
    }

    &.primary {
      --accent-color: var(--color-primary);
      --accent-light: var(--color-primary-light);
      
      .stat-icon {
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
      }
    }

    &.success {
      --accent-color: var(--color-success);
      --accent-light: #66bb6a;
      
      .stat-icon {
        background: linear-gradient(135deg, var(--color-success), #66bb6a);
      }
    }

    &.warning {
      --accent-color: var(--color-warning);
      --accent-light: #ffb74d;
      
      .stat-icon {
        background: linear-gradient(135deg, var(--color-warning), #ffb74d);
      }
    }

    &.info {
      --accent-color: var(--color-info);
      --accent-light: #64b5f6;
      
      .stat-icon {
        background: linear-gradient(135deg, var(--color-info), #64b5f6);
      }
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 36px;
        font-weight: 800;
        color: var(--color-text-primary);
        line-height: 1;
        margin-bottom: 6px;
      }

      .stat-label {
        font-size: 15px;
        color: var(--color-text-secondary);
        margin-bottom: 10px;
        font-weight: 600;
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--color-text-muted);
        font-weight: 500;

        .iconify {
          font-size: 16px;
          color: var(--color-success);
        }
      }
    }
  }
}

.actions-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    color: var(--color-text-primary);
    font-size: 18px;

    .iconify {
      font-size: 22px;
      color: var(--color-primary);
    }
  }

  .admin-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
    color: white;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);

    .iconify {
      font-size: 16px;
    }
  }
}

.quick-actions-card,
.admin-actions-card {
  :deep(.el-card__body) {
    padding: 28px;
  }

  .quick-actions-grid,
  .admin-actions-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .quick-action-item,
  .admin-action-item {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background: var(--color-bg-secondary);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;

    &:hover {
      background: var(--color-bg-tertiary);
      border-color: var(--color-primary);
      transform: translateX(8px);
      box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.1);
    }

    .action-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      flex-shrink: 0;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

      .action-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: var(--color-error);
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
    }

    .action-content {
      flex: 1;

      .action-title {
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: 4px;
        font-size: 16px;
      }

      .action-description {
        font-size: 14px;
        color: var(--color-text-secondary);
        font-weight: 500;
      }
    }

    .action-arrow {
      color: var(--color-text-muted);
      transition: all 0.3s ease;

      .iconify {
        font-size: 20px;
      }
    }

    &:hover .action-arrow {
      color: var(--color-primary);
      transform: translateX(4px);
    }
  }
}

// Element Plus 样式覆盖
:deep(.el-card) {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-primary);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .el-card__header {
    border-bottom-color: var(--color-border-secondary);
    padding: 24px 28px;
    background: var(--color-bg-secondary);
    border-radius: 20px 20px 0 0;
  }
}
</style>