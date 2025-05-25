<script setup lang="ts">
import { useUserStore } from '@/stores/modules/user'
import { useRouter } from 'vue-router'
import { ElButton, ElCard, ElAlert, ElMessage } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()

// User info
const token = computed(() => userStore.token)
const userInfo = computed(() => userStore.userInfo)
const role = computed(() => userStore.role)
const isAdmin = computed(() => userStore.isAdmin)

// Fix user role
const fixAdminRole = () => {
  // Check if the user should be an admin based on properties
  if (userStore.userInfo) {
    const info = userStore.userInfo;
    const shouldBeAdmin = 
      'adminId' in info || 
      (info.role === 'admin') || 
      ('isSuperAdmin' in info && info.isSuperAdmin);
    
    if (shouldBeAdmin) {
      userStore.setAdminRole();
      ElMessage.success('管理员权限已设置！建议刷新页面以确保权限生效');
    } else {
      ElMessage.warning('用户信息中没有管理员权限标识');
    }
  } else {
    ElMessage.error('没有用户信息，无法确定角色');
  }
}

// Refresh user info
const refreshUserInfo = async () => {
  await userStore.initStore()
  ElMessage.success('用户信息已刷新！')
}

// Navigate to admin route
const goToDashboard = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="admin-debug-container">
    <h1>管理员权限调试工具</h1>
    
    <el-card class="debug-card">
      <template #header>
        <div class="card-header">
          <h2>用户状态信息</h2>
        </div>
      </template>
      
      <div class="info-row">
        <div class="label">令牌存在：</div>
        <div class="value">{{ !!token ? '是' : '否' }}</div>
      </div>
      
      <div class="info-row">
        <div class="label">用户信息：</div>
        <div class="value">{{ userInfo ? '已加载' : '未加载' }}</div>
      </div>
      
      <div class="info-row">
        <div class="label">角色：</div>
        <div class="value">{{ role || '未设置' }}</div>
      </div>
      
      <div class="info-row">
        <div class="label">是否管理员：</div>
        <div class="value" :class="{ 'admin-true': isAdmin, 'admin-false': !isAdmin }">
          {{ isAdmin ? '是' : '否' }}
        </div>
      </div>
      
      <div class="info-row">
        <div class="label">用户详情：</div>
        <div class="value">
          <pre>{{ userInfo ? JSON.stringify(userInfo, null, 2) : '无数据' }}</pre>
        </div>
      </div>
    </el-card>
    
    <div class="actions">
      <el-button type="primary" @click="refreshUserInfo">刷新用户信息</el-button>
      <el-button type="success" @click="fixAdminRole">修复管理员权限</el-button>
      <el-button type="info" @click="goToDashboard">进入仪表盘</el-button>
    </div>
    
    <el-alert
      v-if="!isAdmin"
      title="管理员权限未正确配置"
      type="warning"
      description="您的账号应该是管理员，但系统未正确识别。请点击上方的'修复管理员权限'按钮。"
      show-icon
      :closable="false"
    />
  </div>
</template>

<style scoped>
.admin-debug-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

.debug-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.label {
  font-weight: bold;
  min-width: 120px;
}

.value {
  flex-grow: 1;
  word-break: break-all;
}

.value pre {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  margin: 0;
  overflow: auto;
}

.admin-true {
  color: #67c23a;
  font-weight: bold;
}

.admin-false {
  color: #f56c6c;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
</style> 