<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getUsers, 
  deleteUser, 
  updateUserStatus, 
  isSuperAdmin,
  createAdmin,
  UserStatus,
  type UserListParams,
  type UserListResponse,
  type AdminWithStatus,
  type UserWithStatus,
  type CreateAdminParams,
  ADMIN_FORMAT_REQUIREMENTS
} from '@/services'

const router = useRouter()
const userStore = useUserStore()

// 数据状态
const loading = ref(false)
const userList = ref<(AdminWithStatus | UserWithStatus)[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 权限检查
const isSuperAdminUser = ref(false)

// 搜索和筛选
const searchForm = reactive({
  search: '',
  role: 'all' as 'all' | 'admin' | 'user',
  status: '' as UserStatus | ''
})

// 创建管理员弹窗
const createAdminVisible = ref(false)
const createAdminForm = reactive<CreateAdminParams>({
  username: '',
  password: '',
  email: '',
  isSuperAdmin: false
})
const createAdminLoading = ref(false)

// 表单验证规则
const createAdminRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, message: ADMIN_FORMAT_REQUIREMENTS.username, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码长度在 6 到 30 个字符', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          callback(new Error('请输入密码'));
          return;
        }
        if (!/[A-Z]/.test(value)) {
          callback(new Error('密码必须包含大写字母'));
          return;
        }
        if (!/[a-z]/.test(value)) {
          callback(new Error('密码必须包含小写字母'));
          return;
        }
        if (!/[0-9]/.test(value)) {
          callback(new Error('密码必须包含数字'));
          return;
        }
        callback();
      }, 
      trigger: 'blur' 
    }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
    { max: 100, message: '邮箱最多100个字符', trigger: 'blur' }
  ]
}

const createAdminFormRef = ref()

// 计算属性
const filteredUsers = computed(() => {
  if (!userList.value || !Array.isArray(userList.value)) {
    return []
  }

  return userList.value.filter(user => {
    if (searchForm.search) {
      const searchTerm = searchForm.search.toLowerCase()
      const matchesSearch = user.username.toLowerCase().includes(searchTerm) ||
                           user.email?.toLowerCase().includes(searchTerm)
      if (!matchesSearch) return false
    }
    
    if (searchForm.role !== 'all') {
      const isAdmin = 'adminId' in user
      if (searchForm.role === 'admin' && !isAdmin) return false
      if (searchForm.role === 'user' && isAdmin) return false
    }
    
    if (searchForm.status && user.status !== searchForm.status) {
      return false
    }
    
    return true
  })
})

// 用户状态选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'inactive' },
  { label: '封禁', value: 'banned' }
]

// 获取用户状态标签类型
const getStatusType = (status: UserStatus) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'banned': return 'danger'
    default: return 'info'
  }
}

// 获取用户状态文本
const getStatusText = (status: UserStatus) => {
  switch (status) {
    case 'active': return '正常'
    case 'inactive': return '禁用'
    case 'banned': return '封禁'
    default: return '未知'
  }
}

// 获取用户角色
const getUserRole = (user: AdminWithStatus | UserWithStatus): string => {
  // 检查新API格式用户类型
  if (user.userType === 'admin' && user.isSuperAdmin) {
    return '超级管理员'
  }
  else if (user.userType === 'admin') {
    return '管理员'
  }
  // 检查旧API格式
  else if ('adminId' in user) {
    return user.isSuperAdmin ? '超级管理员' : '管理员'
  }
  
  return '普通用户'
}

// 获取用户角色标签类型
const getRoleType = (user: AdminWithStatus | UserWithStatus): string => {
  // 检查新API格式
  if (user.userType === 'admin' && user.isSuperAdmin) {
    return 'danger'
  }
  else if (user.userType === 'admin') {
    return 'warning'
  }
  // 检查旧API格式
  else if ('adminId' in user) {
    return user.isSuperAdmin ? 'danger' : 'warning'
  }
  
  return 'primary'
}

// 获取用户头像
const getUserAvatar = (user: AdminWithStatus | UserWithStatus): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  if (user.avatar) {
    // 检查是否已经是完整URL或数据URL
    if (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) {
      return user.avatar;
    }
    // 相对路径添加基础URL
    return `${baseUrl}${user.avatar}`;
  }
  
  // 默认头像
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
}

// 获取用户ID
const getUserId = (user: AdminWithStatus | UserWithStatus): number => {
  // 新API格式直接使用id
  if (user.id) {
    return user.id
  }
  // 旧API格式
  return 'adminId' in user ? user.adminId : user.userId
}

// 格式化日期
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 检查权限
const checkPermissions = async () => {
  try {
    isSuperAdminUser.value = await isSuperAdmin()
  } catch (error) {
    console.error('检查权限失败:', error)
    isSuperAdminUser.value = false
  }
}

// 加载用户列表
const loadUsers = async () => {
  try {
    loading.value = true
    const params: UserListParams = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchForm.search || undefined,
      role: searchForm.role === 'all' ? undefined : searchForm.role,
      status: searchForm.status || undefined
    }
    
    const response = await getUsers(params)
    
    // 处理嵌套的API响应结构
    if (response.data && response.data.data) {
      // 新API格式: { data: { data: [...], pagination: {...} } }
      userList.value = response.data.data
      total.value = response.data.pagination?.total || 0
    } else if (response.users) {
      // 旧API格式: { users: [...], total: number, page: number, limit: number }
      userList.value = response.users
      total.value = response.total
    } else {
      // 兜底，防止undefined错误
      userList.value = []
      total.value = 0
      console.warn('无法识别的用户数据结构:', response)
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
    userList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索用户
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

// 重置搜索
const handleReset = () => {
  searchForm.search = ''
  searchForm.role = 'all'
  searchForm.status = ''
  currentPage.value = 1
  loadUsers()
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadUsers()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadUsers()
}

// 更新用户状态
const handleUpdateStatus = async (user: AdminWithStatus | UserWithStatus, newStatus: UserStatus) => {
  try {
    const userId = getUserId(user)
    const confirmText = `确定要将用户 ${user.username} 的状态改为"${getStatusText(newStatus)}"吗？`
    
    await ElMessageBox.confirm(confirmText, '确认操作', {
      type: 'warning'
    })
    
    await updateUserStatus(userId, newStatus)
    ElMessage.success('用户状态更新成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('更新用户状态失败:', error)
      ElMessage.error('更新用户状态失败')
    }
  }
}

// 删除用户
const handleDelete = async (user: AdminWithStatus | UserWithStatus) => {
  try {
    const userId = getUserId(user)
    const confirmText = `确定要删除用户 ${user.username} 吗？此操作不可恢复！`
    
    await ElMessageBox.confirm(confirmText, '确认删除', {
      type: 'error',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    
    await deleteUser(userId)
    ElMessage.success('用户删除成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  }
}

// 创建管理员
const handleCreateAdmin = async () => {
  try {
    await createAdminFormRef.value?.validate()
    createAdminLoading.value = true
    
    await createAdmin(createAdminForm)
    ElMessage.success('管理员创建成功')
    
    // 重置表单
    createAdminFormRef.value?.resetFields()
    Object.assign(createAdminForm, {
      username: '',
      password: '',
      email: '',
      isSuperAdmin: false
    })
    
    createAdminVisible.value = false
    loadUsers()
  } catch (error: any) {
    console.error('创建管理员失败:', error)
    
    // 处理格式要求错误
    if (error.response?.data?.formatRequirements) {
      const { formatRequirements } = error.response.data;
      let errorMsg = '创建管理员失败：\n';
      Object.entries(formatRequirements).forEach(([field, requirement]) => {
        errorMsg += `- ${field}: ${requirement}\n`;
      });
      ElMessage.error(errorMsg);
    } else {
      ElMessage.error(error.message || '创建管理员失败');
    }
  } finally {
    createAdminLoading.value = false
  }
}

// 取消创建管理员
const handleCancelCreateAdmin = () => {
  createAdminFormRef.value?.resetFields()
  createAdminVisible.value = false
}

// 初始化
onMounted(async () => {
  await checkPermissions()
  await loadUsers()
})
</script>

<template>
  <div class="user-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="fluent:people-24-filled" />
          用户管理
        </h1>
        <p class="page-subtitle">管理平台用户和管理员账号</p>
      </div>
      
             <div class="header-actions">
         <button 
           v-if="isSuperAdminUser"
           class="create-admin-btn"
           @click="createAdminVisible = true"
         >
           <div class="btn-shine"></div>
           <Icon icon="fluent:person-add-24-filled" />
           创建管理员
         </button>
         <button 
           class="refresh-btn"
           :disabled="loading"
           @click="loadUsers"
         >
           <Icon :icon="loading ? 'fluent:arrow-sync-24-filled' : 'fluent:arrow-clockwise-24-filled'" :class="{ spinning: loading }" />
           {{ loading ? '刷新中...' : '刷新' }}
         </button>
       </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <ElCard>
        <div class="search-form">
          <ElRow :gutter="20">
            <ElCol :span="6">
              <ElInput
                v-model="searchForm.search"
                placeholder="搜索用户名或邮箱"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <Icon icon="fluent:search-24-regular" />
                </template>
              </ElInput>
            </ElCol>
            <ElCol :span="4">
              <ElSelect v-model="searchForm.role" placeholder="用户角色">
                <ElOption label="全部角色" value="all" />
                <ElOption label="管理员" value="admin" />
                <ElOption label="普通用户" value="user" />
              </ElSelect>
            </ElCol>
            <ElCol :span="4">
              <ElSelect v-model="searchForm.status" placeholder="用户状态">
                <ElOption 
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElCol>
            <ElCol :span="10">
                             <div class="search-actions">
                 <button class="search-btn" @click="handleSearch">
                   <Icon icon="fluent:search-24-regular" />
                   搜索
                 </button>
                 <button class="reset-btn" @click="handleReset">
                   <Icon icon="fluent:arrow-reset-24-regular" />
                   重置
                 </button>
               </div>
            </ElCol>
          </ElRow>
        </div>
      </ElCard>
    </div>

    <!-- 用户列表 -->
    <div class="users-section">
      <ElCard>
        <template #header>
          <div class="card-header">
            <span>用户列表 ({{ total }})</span>
          </div>
        </template>

                 <ElTable 
           v-loading="loading"
           :data="filteredUsers"
           style="width: 100%"
           row-key="id"
         >
          <ElTableColumn label="用户信息" min-width="200">
            <template #default="{ row }">
              <div class="user-info">
                <ElAvatar :size="40" :src="getUserAvatar(row)" />
                <div class="user-details">
                  <div class="username">{{ row.username }}</div>
                  <div class="email">{{ row.email || '未设置邮箱' }}</div>
                </div>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn label="角色" width="120">
            <template #default="{ row }">
              <ElTag :type="getRoleType(row)" size="small">
                {{ getUserRole(row) }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="状态" width="100">
            <template #default="{ row }">
              <ElTag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="最后更新" width="160">
            <template #default="{ row }">
              {{ formatDate(row.updatedAt) }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="操作" min-width="240" fixed="right">
            <template #default="{ row }">
                             <div class="table-actions">
                 <ElDropdown trigger="click">
                   <button class="status-btn">
                     状态管理
                     <Icon icon="fluent:chevron-down-24-regular" />
                   </button>
                   <template #dropdown>
                     <ElDropdownMenu>
                       <ElDropdownItem 
                         v-if="row.status !== 'active'"
                         @click="handleUpdateStatus(row, 'active')"
                       >
                         <Icon icon="fluent:checkmark-24-regular" />
                         启用
                       </ElDropdownItem>
                       <ElDropdownItem 
                         v-if="row.status !== 'inactive'"
                         @click="handleUpdateStatus(row, 'inactive')"
                       >
                         <Icon icon="fluent:pause-24-regular" />
                         禁用
                       </ElDropdownItem>
                       <ElDropdownItem 
                         v-if="row.status !== 'banned'"
                         @click="handleUpdateStatus(row, 'banned')"
                       >
                         <Icon icon="fluent:prohibited-24-regular" />
                         封禁
                       </ElDropdownItem>
                     </ElDropdownMenu>
                   </template>
                 </ElDropdown>

                 <button 
                   v-if="!('adminId' in row && row.isSuperAdmin) && !(row.userType === 'admin' && row.isSuperAdmin)"
                   class="delete-btn"
                   @click="handleDelete(row)"
                 >
                   <Icon icon="fluent:delete-24-regular" />
                   删除
                 </button>
               </div>
            </template>
          </ElTableColumn>
        </ElTable>

                 <!-- 分页 -->
         <div class="pagination-wrapper">
           <div class="pagination-info">
             <span class="pagination-text">
               共 <span class="total-count">{{ total }}</span> 条记录，
               每页显示 
               <ElSelect v-model="pageSize" class="page-size-select" @change="handleSizeChange">
                 <ElOption label="10" :value="10" />
                 <ElOption label="20" :value="20" />
                 <ElOption label="50" :value="50" />
                 <ElOption label="100" :value="100" />
               </ElSelect>
               条
             </span>
           </div>
           <ElPagination
             v-model:current-page="currentPage"
             :total="total"
             :page-size="pageSize"
             layout="prev, pager, next"
             @current-change="handlePageChange"
             class="custom-pagination"
           />
         </div>
      </ElCard>
    </div>

    <!-- 创建管理员弹窗 -->
    <ElDialog
      v-model="createAdminVisible"
      title="创建管理员账号"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm
        ref="createAdminFormRef"
        :model="createAdminForm"
        :rules="createAdminRules"
        label-width="80px"
      >
        <ElFormItem label="用户名" prop="username">
          <ElInput 
            v-model="createAdminForm.username"
            placeholder="请输入管理员用户名"
            clearable
          />
        </ElFormItem>

        <ElFormItem label="密码" prop="password">
          <ElInput 
            v-model="createAdminForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </ElFormItem>

        <ElFormItem label="邮箱" prop="email">
          <ElInput 
            v-model="createAdminForm.email"
            placeholder="请输入邮箱地址（可选）"
            clearable
          />
        </ElFormItem>

        <ElFormItem label="权限级别">
          <ElCheckbox v-model="createAdminForm.isSuperAdmin">
            设为超级管理员
          </ElCheckbox>
          <div class="form-tip">
            超级管理员拥有所有权限，包括创建和管理其他管理员
          </div>
        </ElFormItem>
      </ElForm>

             <template #footer>
         <div class="dialog-footer">
           <button class="cancel-btn" @click="handleCancelCreateAdmin">
             <Icon icon="fluent:dismiss-24-regular" />
             取消
           </button>
           <button 
             class="confirm-btn"
             :disabled="createAdminLoading"
             @click="handleCreateAdmin"
           >
             <Icon :icon="createAdminLoading ? 'fluent:arrow-sync-24-filled' : 'fluent:person-add-24-filled'" :class="{ spinning: createAdminLoading }" />
             {{ createAdminLoading ? '创建中...' : '创建管理员' }}
           </button>
         </div>
       </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.user-management-page {
  padding: 20px;
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 4px 0;
      
      .iconify {
        color: var(--color-primary);
        font-size: 32px;
      }
    }
    
    .page-subtitle {
      font-size: 15px;
      color: var(--color-text-secondary);
      margin: 0;
    }
  }
  
  .header-actions {
  display: flex;
  gap: 16px;
  
  .create-admin-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #1976d2));
    color: white;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    
    .iconify {
      font-size: 16px;
    }
    
    .btn-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s ease;
    }
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.4);
      
      .btn-shine {
        left: 100%;
      }
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: 2px solid var(--color-primary);
    background: var(--color-bg-elevated);
    color: var(--color-primary);
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    
    .iconify {
      font-size: 16px;
      transition: transform 0.3s ease;
    }
    
    .spinning {
      animation: spin 1s linear infinite;
    }
    
    &:hover:not(:disabled) {
      background: var(--color-primary);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }
}
}

.search-section {
  margin-bottom: 24px;
  
  .search-form {
    .search-actions {
      display: flex;
      gap: 12px;
      
      .search-btn, .reset-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        
        .iconify {
          font-size: 16px;
        }
      }
      
      .search-btn {
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
        color: white;
        box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.2);
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
        }
      }
      
      .reset-btn {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-primary);
        
        &:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-border-secondary);
          transform: translateY(-1px);
        }
      }
    }
  }
}

.users-section {
  .card-header {
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .user-details {
      .username {
        font-weight: 500;
        color: var(--color-text-primary);
        margin-bottom: 4px;
      }
      
      .email {
        font-size: 12px;
        color: var(--color-text-muted);
      }
    }
  }
  
  .table-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    
    .status-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 12px;
      height: 32px;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
      
      .iconify {
        font-size: 16px;
      }
      
      &:hover {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
    }
    
    .delete-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 0 12px;
      height: 32px;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
      
      .iconify {
        font-size: 16px;
      }
      
      &:hover {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      }
    }
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding: 20px 0;
    border-top: 1px solid var(--color-border-secondary);
    
    .pagination-info {
      .pagination-text {
        color: var(--color-text-secondary);
        font-size: 14px;
        
        .total-count {
          color: var(--color-primary);
          font-weight: 600;
        }
        
        .page-size-select {
          margin: 0 8px;
          width: 80px;
          
          :deep(.el-input__inner) {
            border-radius: 8px;
            border-color: var(--color-border-primary);
            padding: 0 8px;
            height: 32px;
            line-height: 32px;
          }
        }
      }
    }
    
    .custom-pagination {
      :deep(.el-pagination) {
        .el-pager li {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-primary);
          border-radius: 8px;
          margin: 0 2px;
          min-width: 36px;
          height: 36px;
          line-height: 34px;
          transition: all 0.2s ease;
          
          &:hover {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
            transform: translateY(-1px);
          }
          
          &.is-active {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
          }
        }
        
        .btn-prev, .btn-next {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-primary);
          border-radius: 8px;
          margin: 0 4px;
          min-width: 36px;
          height: 36px;
          transition: all 0.2s ease;
          
          &:hover {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
            transform: translateY(-1px);
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
          }
        }
      }
    }
  }
}

.form-tip {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  
  .cancel-btn, .confirm-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    
    .iconify {
      font-size: 16px;
    }
    
    .spinning {
      animation: spin 1s linear infinite;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
  }
  
  .cancel-btn {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-primary);
    
    &:hover:not(:disabled) {
      background: var(--color-bg-tertiary);
      transform: translateY(-1px);
    }
  }
  
  .confirm-btn {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
    color: white;
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.2);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    }
  }
}

// 动画
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 768px) {
  .user-management-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .search-form {
    .el-row {
      flex-direction: column;
      
      .el-col {
        margin-bottom: 12px;
        width: 100% !important;
      }
    }
  }
}
</style>