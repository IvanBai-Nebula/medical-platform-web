<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, reactive } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Admin, User, UpdateUserParams, UpdateAdminParams } from '@/types'
import { updateUser, updateAdmin } from '@/services'

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const editMode = ref(false)
const passwordDialogVisible = ref(false)

// 用户信息（用于编辑）
const userForm = reactive({
  username: '',
  email: '',
  avatar: ''
})

// 密码修改表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码修改Loading
const passwordLoading = ref(false)

// 计算属性
const currentUser = computed(() => userStore.currentUser)
const isAdmin = computed(() => userStore.isAdmin)
const userId = computed(() => {
  if (!currentUser.value) return null
  return 'adminId' in currentUser.value ? currentUser.value.adminId : currentUser.value.userId
})

// 获取用户头像
const getUserAvatar = computed(() => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  // 如果用户正在编辑并设置了新头像
  if (userForm.avatar) {
    // 检查是否已经是完整URL或数据URL
    if (userForm.avatar.startsWith('http') || userForm.avatar.startsWith('data:')) {
      return userForm.avatar;
    }
    // 相对路径添加基础URL
    return `${baseUrl}${userForm.avatar}`;
  }
  
  // 使用用户当前头像
  if (currentUser.value?.avatar) {
    // 检查是否已经是完整URL或数据URL
    if (currentUser.value.avatar.startsWith('http') || currentUser.value.avatar.startsWith('data:')) {
      return currentUser.value.avatar;
    }
    // 相对路径添加基础URL
    return `${baseUrl}${currentUser.value.avatar}`;
  }
  
  // 默认头像
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.value?.username || 'default'}`;
})

// 格式化注册时间
const formatJoinDate = (user: Admin | User) => {
  if ('createdAt' in user) {
    return new Date(user.createdAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return '未知'
}

// 初始化用户表单
const initUserForm = () => {
  if (currentUser.value) {
    userForm.username = currentUser.value.username
    userForm.email = currentUser.value.email || ''
    userForm.avatar = currentUser.value.avatar || ''
  }
}

// 进入编辑模式
const enterEditMode = () => {
  editMode.value = true
  initUserForm()
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
  initUserForm()
}

// 保存用户信息
const saveUserInfo = async () => {
  if (!currentUser.value || !userId.value) {
    ElMessage.error('用户信息错误')
    return
  }

  try {
    loading.value = true
    
    // 根据用户类型选择不同的更新方法和数据结构
    if ('adminId' in currentUser.value) {
      // 管理员用户 - 使用管理员更新API
      const adminData: UpdateAdminParams = {
        username: userForm.username,
        email: userForm.email || undefined,
        avatar: userForm.avatar || undefined,
        isSuperAdmin: Boolean(currentUser.value.isSuperAdmin)
      }
      
      await updateAdmin(userId.value, adminData)
    } else {
      // 普通用户 - 使用普通用户更新API
      const userData: UpdateUserParams = {
        username: userForm.username,
        email: userForm.email || undefined,
        avatar: userForm.avatar || undefined
      }
      
      await updateUser(userId.value, userData)
    }
    
    // 更新store中的用户信息
    await userStore.fetchCurrentUserInfo()
    
    editMode.value = false
    ElMessage.success('个人信息更新成功')
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    loading.value = false
  }
}

// 头像上传处理
const handleAvatarChange = (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('头像文件大小不能超过5MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    userForm.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 修改密码
const updatePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    ElMessage.error('新密码至少需要6个字符')
    return
  }

  try {
    passwordLoading.value = true
    await userStore.updatePassword(passwordForm.oldPassword, passwordForm.newPassword)
    
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    
    // 清空表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    ElMessage.error(error.message || '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// 退出登录
const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    userStore.logout()
    ElMessage.success('已安全退出')
    // 可以跳转到登录页面
  } catch {
    // 用户取消操作
  }
}

// 生成随机头像
const generateRandomAvatar = () => {
  const seed = Math.random().toString(36).substring(7)
  userForm.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
}

// 初始化页面
onMounted(() => {
  initUserForm()
})
</script>

<template>
  <div class="profile-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">
        <Icon icon="fluent:person-24-filled" />
        个人资料
      </h1>
      <p class="page-subtitle">管理您的个人信息和账户设置</p>
    </div>

    <!-- 个人资料卡片 -->
    <div class="profile-content">
      <div class="profile-card">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img :src="getUserAvatar" :alt="currentUser?.username" class="user-avatar" />
            <div v-if="editMode" class="avatar-edit">
              <button class="avatar-edit-btn" @click="$refs.avatarInput.click()">
                <Icon icon="fluent:camera-24-filled" />
              </button>
              <input 
                ref="avatarInput" 
                type="file" 
                accept="image/*" 
                style="display: none"
                @change="handleAvatarChange($event.target.files[0])"
              />
            </div>
          </div>
          
          <div class="user-basic-info">
            <h2 class="username">{{ currentUser?.username }}</h2>
            <div class="user-role">
              <Icon :icon="isAdmin ? 'fluent:shield-24-filled' : 'fluent:person-24-filled'" />
              <span>{{ isAdmin ? '管理员' : '普通用户' }}</span>
            </div>
          </div>
        </div>

        <!-- 信息编辑区域 -->
        <div class="info-section">
          <div class="section-header">
            <h3>基本信息</h3>
            <div class="section-actions">
              <button v-if="!editMode" class="edit-btn" @click="enterEditMode">
                <Icon icon="fluent:edit-24-regular" />
                编辑
              </button>
              <div v-else class="edit-actions">
                <button class="save-btn" @click="saveUserInfo" :disabled="loading">
                  <Icon :icon="loading ? 'fluent:spinner-ios-20-filled' : 'fluent:save-24-regular'" :class="{ spinning: loading }" />
                  {{ loading ? '保存中...' : '保存' }}
                </button>
                <button class="cancel-btn" @click="cancelEdit">
                  <Icon icon="fluent:dismiss-24-regular" />
                  取消
                </button>
              </div>
            </div>
          </div>

          <div class="info-form">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input 
                v-if="editMode"
                v-model="userForm.username"
                type="text"
                class="form-input"
                placeholder="请输入用户名"
              />
              <span v-else class="form-value">{{ currentUser?.username }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">邮箱地址</label>
              <input 
                v-if="editMode"
                v-model="userForm.email"
                type="email"
                class="form-input"
                placeholder="请输入邮箱地址"
              />
              <span v-else class="form-value">{{ currentUser?.email || '未设置' }}</span>
            </div>

            <div v-if="editMode" class="form-group">
              <label class="form-label">头像URL</label>
              <div class="avatar-input-group">
                <input 
                  v-model="userForm.avatar"
                  type="url"
                  class="form-input"
                  placeholder="请输入头像URL或上传图片"
                />
                <button class="random-avatar-btn" @click="generateRandomAvatar">
                  <Icon icon="fluent:dice-24-regular" />
                  随机头像
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 账户管理区域 -->
        <div class="account-section">
          <div class="section-header">
            <h3>账户管理</h3>
          </div>

          <div class="account-actions">
            <button class="action-item password-btn" @click="passwordDialogVisible = true">
              <div class="action-icon">
                <Icon icon="fluent:key-24-filled" />
              </div>
              <div class="action-content">
                <div class="action-title">修改密码</div>
                <div class="action-desc">更改您的登录密码</div>
              </div>
              <Icon icon="fluent:chevron-right-24-regular" class="action-arrow" />
            </button>

            <button class="action-item settings-btn" @click="$router.push('/profile/settings')">
              <div class="action-icon">
                <Icon icon="fluent:settings-24-filled" />
              </div>
              <div class="action-content">
                <div class="action-title">账户设置</div>
                <div class="action-desc">管理账户偏好和隐私设置</div>
              </div>
              <Icon icon="fluent:chevron-right-24-regular" class="action-arrow" />
            </button>

            <button class="action-item logout-btn" @click="logout">
              <div class="action-icon danger">
                <Icon icon="fluent:sign-out-24-filled" />
              </div>
              <div class="action-content">
                <div class="action-title">退出登录</div>
                <div class="action-desc">安全退出当前账户</div>
              </div>
              <Icon icon="fluent:chevron-right-24-regular" class="action-arrow" />
            </button>
          </div>
        </div>
      </div>

      <!-- 统计信息卡片 -->
      <div class="stats-card">
        <h3 class="stats-title">账户统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <Icon icon="fluent:calendar-24-filled" />
            </div>
            <div class="stat-content">
              <div class="stat-label">注册时间</div>
              <div class="stat-value">{{ formatJoinDate(currentUser) }}</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">
              <Icon icon="fluent:shield-checkmark-24-filled" />
            </div>
            <div class="stat-content">
              <div class="stat-label">账户状态</div>
              <div class="stat-value">正常</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">
              <Icon icon="fluent:person-tag-24-filled" />
            </div>
            <div class="stat-content">
              <div class="stat-label">用户ID</div>
              <div class="stat-value">#{{ userId }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <div v-if="passwordDialogVisible" class="password-dialog-overlay" @click="passwordDialogVisible = false">
      <div class="password-dialog" @click.stop>
        <div class="dialog-header">
          <h3>修改密码</h3>
          <button class="close-btn" @click="passwordDialogVisible = false">
            <Icon icon="fluent:dismiss-24-regular" />
          </button>
        </div>

        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">当前密码</label>
            <input 
              v-model="passwordForm.oldPassword"
              type="password"
              class="form-input"
              placeholder="请输入当前密码"
            />
          </div>

          <div class="form-group">
            <label class="form-label">新密码</label>
            <input 
              v-model="passwordForm.newPassword"
              type="password"
              class="form-input"
              placeholder="请输入新密码（至少6个字符）"
            />
          </div>

          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input 
              v-model="passwordForm.confirmPassword"
              type="password"
              class="form-input"
              placeholder="请再次输入新密码"
            />
          </div>
        </div>

        <div class="dialog-actions">
          <button class="cancel-btn" @click="passwordDialogVisible = false">取消</button>
          <button 
            class="confirm-btn" 
            @click="updatePassword" 
            :disabled="passwordLoading || !passwordForm.oldPassword || !passwordForm.newPassword"
          >
            <Icon v-if="passwordLoading" icon="fluent:spinner-ios-20-filled" class="spinning" />
            {{ passwordLoading ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 32px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.page-header {
  margin-bottom: 32px;

  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 32px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 8px 0;

    .iconify {
      color: var(--color-primary);
    }
  }

  .page-subtitle {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.profile-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.profile-card, .stats-card {
  background: var(--color-bg-elevated);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border-primary);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--color-border-secondary);

  .avatar-wrapper {
    position: relative;

    .user-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid var(--color-primary);
      box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.2);
    }

    .avatar-edit {
      position: absolute;
      bottom: 0;
      right: 0;

      .avatar-edit-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--color-primary);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        &:hover {
          background: var(--color-primary-dark);
          transform: scale(1.1);
        }

        .iconify {
          font-size: 16px;
        }
      }
    }
  }

  .user-basic-info {
    .username {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    .user-role {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-primary);
      font-weight: 500;

      .iconify {
        font-size: 18px;
      }
    }
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .section-actions {
    display: flex;
    gap: 12px;
  }

  .edit-btn, .save-btn, .cancel-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;

    .iconify {
      font-size: 16px;
    }
  }

  .edit-btn {
    background: var(--color-bg-secondary);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);

    &:hover {
      background: var(--color-primary);
      color: white;
    }
  }

  .save-btn {
    background: var(--color-primary);
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: var(--color-primary-dark);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cancel-btn {
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-primary);

    &:hover {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
    }
  }
}

.info-form {
  .form-group {
    margin-bottom: 24px;

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      font-size: 14px;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
      }

      &::placeholder {
        color: var(--color-text-muted);
      }
    }

    .form-value {
      display: block;
      padding: 12px 16px;
      background: var(--color-bg-secondary);
      border-radius: 12px;
      color: var(--color-text-primary);
      font-size: 14px;
    }

    .avatar-input-group {
      display: flex;
      gap: 12px;

      .form-input {
        flex: 1;
      }

      .random-avatar-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 12px 16px;
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        transition: all 0.3s ease;

        &:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .iconify {
          font-size: 16px;
        }
      }
    }
  }
}

.account-section {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--color-border-secondary);

  .account-actions {
    .action-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      margin-bottom: 12px;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border-primary);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: var(--color-bg-secondary);
        border-color: var(--color-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .action-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: rgba(var(--color-primary-rgb), 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary);

        &.danger {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
        }

        .iconify {
          font-size: 24px;
        }
      }

      .action-content {
        flex: 1;

        .action-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }

        .action-desc {
          font-size: 14px;
          color: var(--color-text-secondary);
        }
      }

      .action-arrow {
        font-size: 20px;
        color: var(--color-text-muted);
      }
    }
  }
}

.stats-card {
  .stats-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 24px 0;
  }

  .stats-grid {
    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 0;
      border-bottom: 1px solid var(--color-border-secondary);

      &:last-child {
        border-bottom: none;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: rgba(var(--color-primary-rgb), 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary);

        .iconify {
          font-size: 24px;
        }
      }

      .stat-content {
        .stat-label {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
        }
      }
    }
  }
}

// 密码对话框样式
.password-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.password-dialog {
  background: var(--color-bg-elevated);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  width: 90%;
  max-width: 480px;
  animation: slideUp 0.3s ease;

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    border-bottom: 1px solid var(--color-border-secondary);

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--color-bg-secondary);
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }

      .iconify {
        font-size: 18px;
      }
    }
  }

  .dialog-content {
    padding: 32px;
  }

  .dialog-actions {
    display: flex;
    gap: 12px;
    padding: 0 32px 32px 32px;

    .cancel-btn, .confirm-btn {
      flex: 1;
      padding: 12px 24px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .iconify {
        font-size: 16px;
      }
    }

    .cancel-btn {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-primary);

      &:hover {
        background: var(--color-bg-tertiary);
      }
    }

    .confirm-btn {
      background: var(--color-primary);
      color: white;
      border: none;

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

// 动画
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
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