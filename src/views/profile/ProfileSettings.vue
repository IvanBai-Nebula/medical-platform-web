<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const activeTab = ref('security')

// 安全设置
const securitySettings = reactive({
  enableTwoFactor: false,
  loginNotification: true,
  sessionTimeout: 30,
  allowMultipleLogin: false
})

// 通知设置
const notificationSettings = reactive({
  emailNotification: true,
  browserNotification: false,
  newKnowledgeNotify: true,
  newExperienceNotify: true,
  systemNotify: true
})

// 隐私设置
const privacySettings = reactive({
  profilePublic: true,
  showEmail: false,
  showActivity: true,
  allowSearch: true
})

// 计算属性
const currentUser = computed(() => userStore.currentUser)
const isAdmin = computed(() => userStore.isAdmin)

// 标签页选项
const tabOptions = [
  { key: 'security', label: '安全设置', icon: 'fluent:shield-24-filled' },
  { key: 'notification', label: '通知设置', icon: 'fluent:alert-24-filled' },
  { key: 'privacy', label: '隐私设置', icon: 'fluent:eye-24-filled' },
  { key: 'appearance', label: '外观设置', icon: 'fluent:color-24-filled' }
]

// 会话超时选项
const timeoutOptions = [
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 },
  { label: '永不超时', value: 0 }
]

// 保存设置
const saveSettings = async (type: string) => {
  try {
    loading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(`${type}设置已保存`)
  } catch (error: any) {
    ElMessage.error('保存设置失败')
  } finally {
    loading.value = false
  }
}

// 清除浏览器缓存
const clearCache = async () => {
  try {
    await ElMessageBox.confirm('清除缓存后需要重新加载页面，确定继续吗？', '清除缓存', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 清除缓存
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
    
    // 清除localStorage
    localStorage.clear()
    
    ElMessage.success('缓存已清除')
    
    // 重新加载页面
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch {
    // 用户取消操作
  }
}

// 导出数据
const exportUserData = async () => {
  try {
    loading.value = true
    
    const userData = {
      profile: currentUser.value,
      settings: {
        security: securitySettings,
        notification: notificationSettings,
        privacy: privacySettings
      },
      exportTime: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(userData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `user-data-${currentUser.value?.username}-${Date.now()}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    
    ElMessage.success('用户数据已导出')
  } catch (error: any) {
    ElMessage.error('导出数据失败')
  } finally {
    loading.value = false
  }
}

// 删除账户
const deleteAccount = async () => {
  try {
    await ElMessageBox.confirm(
      '删除账户将永久移除您的所有数据，包括个人信息、发布的内容等。此操作不可恢复！',
      '危险操作',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
        dangerouslyUseHTMLString: true,
        customClass: 'delete-account-dialog'
      }
    )
    
    // 二次确认
    const { value } = await ElMessageBox.prompt(
      '请输入您的用户名以确认删除操作',
      '最后确认',
      {
        confirmButtonText: '删除账户',
        cancelButtonText: '取消',
        inputPlaceholder: currentUser.value?.username,
        inputValidator: (value: string) => {
          if (value !== currentUser.value?.username) {
            return '用户名不匹配'
          }
          return true
        }
      }
    )
    
    if (value === currentUser.value?.username) {
      loading.value = true
      
      // 模拟删除账户API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      ElMessage.success('账户已删除')
      
      // 清除登录状态并跳转
      userStore.logout()
      router.push('/home')
    }
  } catch {
    // 用户取消操作
  } finally {
    loading.value = false
  }
}

// 初始化设置
onMounted(() => {
  // 从localStorage或API加载设置
})
</script>

<template>
  <div class="settings-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <Icon icon="fluent:arrow-left-24-filled" />
        </button>
        <div class="header-info">
          <h1 class="page-title">设置中心</h1>
          <p class="page-subtitle">管理您的账户设置和偏好</p>
        </div>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 左侧标签页导航 -->
      <div class="settings-nav">
        <div class="nav-list">
          <button
            v-for="tab in tabOptions"
            :key="tab.key"
            class="nav-item"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <Icon :icon="tab.icon" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- 右侧设置面板 -->
      <div class="settings-panel">
        <!-- 安全设置 -->
        <div v-if="activeTab === 'security'" class="setting-section">
          <div class="section-header">
            <h2>安全设置</h2>
            <p>管理您的账户安全选项</p>
          </div>

          <div class="setting-items">
            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">双因素认证</div>
                <div class="item-desc">为账户添加额外的安全保护</div>
              </div>
              <div class="item-control">
                <el-switch v-model="securitySettings.enableTwoFactor" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">登录通知</div>
                <div class="item-desc">新设备登录时发送邮件通知</div>
              </div>
              <div class="item-control">
                <el-switch v-model="securitySettings.loginNotification" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">会话超时</div>
                <div class="item-desc">设置自动登出时间</div>
              </div>
              <div class="item-control">
                <el-select v-model="securitySettings.sessionTimeout" style="width: 140px">
                  <el-option
                    v-for="option in timeoutOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">多设备登录</div>
                <div class="item-desc">允许同时在多个设备上登录</div>
              </div>
              <div class="item-control">
                <el-switch v-model="securitySettings.allowMultipleLogin" />
              </div>
            </div>
          </div>

          <div class="section-actions">
            <button class="save-btn" @click="saveSettings('安全')" :disabled="loading">
              <Icon :icon="loading ? 'fluent:spinner-ios-20-filled' : 'fluent:save-24-regular'" :class="{ spinning: loading }" />
              {{ loading ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </div>

        <!-- 通知设置 -->
        <div v-if="activeTab === 'notification'" class="setting-section">
          <div class="section-header">
            <h2>通知设置</h2>
            <p>控制您接收通知的方式和内容</p>
          </div>

          <div class="setting-items">
            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">邮件通知</div>
                <div class="item-desc">通过邮件接收重要通知</div>
              </div>
              <div class="item-control">
                <el-switch v-model="notificationSettings.emailNotification" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">浏览器通知</div>
                <div class="item-desc">在浏览器中显示桌面通知</div>
              </div>
              <div class="item-control">
                <el-switch v-model="notificationSettings.browserNotification" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">新知识发布</div>
                <div class="item-desc">有新的医疗知识发布时通知我</div>
              </div>
              <div class="item-control">
                <el-switch v-model="notificationSettings.newKnowledgeNotify" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">学习心得</div>
                <div class="item-desc">有新的学习心得分享时通知我</div>
              </div>
              <div class="item-control">
                <el-switch v-model="notificationSettings.newExperienceNotify" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">系统通知</div>
                <div class="item-desc">接收平台系统相关通知</div>
              </div>
              <div class="item-control">
                <el-switch v-model="notificationSettings.systemNotify" />
              </div>
            </div>
          </div>

          <div class="section-actions">
            <button class="save-btn" @click="saveSettings('通知')" :disabled="loading">
              <Icon :icon="loading ? 'fluent:spinner-ios-20-filled' : 'fluent:save-24-regular'" :class="{ spinning: loading }" />
              {{ loading ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </div>

        <!-- 隐私设置 -->
        <div v-if="activeTab === 'privacy'" class="setting-section">
          <div class="section-header">
            <h2>隐私设置</h2>
            <p>控制您的个人信息对其他用户的可见性</p>
          </div>

          <div class="setting-items">
            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">公开个人资料</div>
                <div class="item-desc">允许其他用户查看您的基本信息</div>
              </div>
              <div class="item-control">
                <el-switch v-model="privacySettings.profilePublic" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">显示邮箱</div>
                <div class="item-desc">在个人资料中显示邮箱地址</div>
              </div>
              <div class="item-control">
                <el-switch v-model="privacySettings.showEmail" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">显示活动记录</div>
                <div class="item-desc">允许其他用户查看您的学习活动</div>
              </div>
              <div class="item-control">
                <el-switch v-model="privacySettings.showActivity" />
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">允许搜索</div>
                <div class="item-desc">允许通过用户名搜索到您</div>
              </div>
              <div class="item-control">
                <el-switch v-model="privacySettings.allowSearch" />
              </div>
            </div>
          </div>

          <div class="section-actions">
            <button class="save-btn" @click="saveSettings('隐私')" :disabled="loading">
              <Icon :icon="loading ? 'fluent:spinner-ios-20-filled' : 'fluent:save-24-regular'" :class="{ spinning: loading }" />
              {{ loading ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </div>

        <!-- 外观设置 -->
        <div v-if="activeTab === 'appearance'" class="setting-section">
          <div class="section-header">
            <h2>外观设置</h2>
            <p>自定义您的界面外观和体验</p>
          </div>

          <div class="setting-items">
            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">主题模式</div>
                <div class="item-desc">选择浅色、深色或跟随系统</div>
              </div>
              <div class="item-control">
                <div class="theme-options">
                  <button class="theme-option">
                    <Icon icon="fluent:weather-sunny-24-filled" />
                    <span>浅色</span>
                  </button>
                  <button class="theme-option active">
                    <Icon icon="fluent:weather-moon-24-filled" />
                    <span>深色</span>
                  </button>
                  <button class="theme-option">
                    <Icon icon="fluent:desktop-24-filled" />
                    <span>自动</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">语言设置</div>
                <div class="item-desc">选择界面显示语言</div>
              </div>
              <div class="item-control">
                <el-select value="zh-CN" style="width: 140px">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </div>
            </div>

            <div class="setting-item">
              <div class="item-info">
                <div class="item-title">动画效果</div>
                <div class="item-desc">启用界面动画和过渡效果</div>
              </div>
              <div class="item-control">
                <el-switch value="true" />
              </div>
            </div>
          </div>

          <div class="section-actions">
            <button class="save-btn" @click="saveSettings('外观')" :disabled="loading">
              <Icon :icon="loading ? 'fluent:spinner-ios-20-filled' : 'fluent:save-24-regular'" :class="{ spinning: loading }" />
              {{ loading ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据管理区域 -->
    <div class="data-management">
      <div class="management-card">
        <h3>数据管理</h3>
        <div class="management-actions">
          <button class="action-btn export-btn" @click="exportUserData" :disabled="loading">
            <Icon icon="fluent:arrow-download-24-filled" />
            导出数据
          </button>
          <button class="action-btn cache-btn" @click="clearCache">
            <Icon icon="fluent:broom-24-filled" />
            清除缓存
          </button>
        </div>
      </div>

      <div class="danger-zone">
        <h3>危险操作</h3>
        <p>以下操作不可恢复，请谨慎操作</p>
        <button class="danger-btn" @click="deleteAccount" :disabled="loading">
          <Icon icon="fluent:delete-24-filled" />
          删除账户
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 32px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.page-header {
  margin-bottom: 32px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-primary);
      color: var(--color-text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:hover {
        background: var(--color-bg-secondary);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .iconify {
        font-size: 18px;
      }
    }

    .header-info {
      .page-title {
        font-size: 28px;
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0 0 4px 0;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--color-text-secondary);
        margin: 0;
      }
    }
  }
}

.settings-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.settings-nav {
  .nav-list {
    background: var(--color-bg-elevated);
    border-radius: 16px;
    padding: 8px;
    border: 1px solid var(--color-border-primary);

    .nav-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: none;
      background: transparent;
      border-radius: 10px;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }

      .iconify {
        font-size: 18px;
      }

      span {
        font-size: 14px;
        font-weight: 500;
      }

      &:hover {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
      }

      &.active {
        background: var(--color-primary);
        color: white;

        &:hover {
          background: var(--color-primary-dark);
        }
      }
    }
  }
}

.settings-panel {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
}

.setting-section {
  .section-header {
    padding: 32px 32px 24px 32px;
    border-bottom: 1px solid var(--color-border-secondary);

    h2 {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    p {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0;
    }
  }

  .setting-items {
    padding: 24px 32px;

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid var(--color-border-secondary);

      &:last-child {
        border-bottom: none;
      }

      .item-info {
        flex: 1;

        .item-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }

        .item-desc {
          font-size: 14px;
          color: var(--color-text-secondary);
        }
      }

      .item-control {
        flex-shrink: 0;
        margin-left: 24px;

        .theme-options {
          display: flex;
          gap: 8px;

          .theme-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
            border: 1px solid var(--color-border-primary);
            border-radius: 10px;
            background: var(--color-bg-primary);
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: all 0.3s ease;

            .iconify {
              font-size: 20px;
            }

            span {
              font-size: 12px;
              font-weight: 500;
            }

            &:hover {
              border-color: var(--color-primary);
              color: var(--color-primary);
            }

            &.active {
              border-color: var(--color-primary);
              background: var(--color-primary);
              color: white;
            }
          }
        }
      }
    }
  }

  .section-actions {
    padding: 24px 32px 32px 32px;
    border-top: 1px solid var(--color-border-secondary);

    .save-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;

      .iconify {
        font-size: 16px;
      }

      &:hover:not(:disabled) {
        background: var(--color-primary-dark);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}

.data-management {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .management-card, .danger-zone {
    background: var(--color-bg-elevated);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid var(--color-border-primary);

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 16px 0;
    }

    .management-actions {
      display: flex;
      gap: 12px;

      .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border: 1px solid var(--color-border-primary);
        border-radius: 10px;
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;

        .iconify {
          font-size: 16px;
        }

        &:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
      }
    }
  }

  .danger-zone {
    border-color: #e74c3c;

    h3 {
      color: #e74c3c;
    }

    p {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0 0 16px 0;
    }

    .danger-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;

      .iconify {
        font-size: 16px;
      }

      &:hover:not(:disabled) {
        background: #c0392b;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 