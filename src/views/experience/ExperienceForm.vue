<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { useTheme } from '@/composables/useTheme'
import { 
  getExperienceDetail, 
  createExperience, 
  updateExperience,
  reviewExperience,
  getKnowledgeList 
} from '@/services'
import type { ExperienceItem, CreateExperienceParams, KnowledgeItem } from '@/types'
import type { UpdateExperienceParams, ReviewExperienceParams } from '@/services/type/experience.d'
import type { KnowledgeListResponse } from '@/services/type/knowledge.d'
import { ExperienceStatus } from '@/services/type/experience.d'
import '@wangeditor/editor/dist/css/style.css'
import { createEditor, createToolbar } from '@wangeditor/editor'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { currentTheme } = useTheme()

// 表单数据
const form = ref<{
  knowledgeId: number | undefined
  title: string
  content: string
}>({
  knowledgeId: undefined,
  title: '',
  content: '',
})

// 管理员状态管理
const adminForm = ref<{
  status: string
  reviewComments: string
}>({
  status: 'pending',
  reviewComments: '',
})

// 状态
const loading = ref(true)
const submitting = ref(false)
const knowledgeOptions = ref<KnowledgeItem[]>([])
const experience = ref<ExperienceItem | null>(null)

// 计算属性
const experienceId = computed(() => route.params.id as string)
const isEdit = computed(() => !!experienceId.value)
const pageTitle = computed(() => isEdit.value ? '编辑学习心得' : '发布学习心得')
const isAdmin = computed(() => userStore.isAdmin)
const currentUserId = computed(() => {
  return userStore.userInfo && 'adminId' in userStore.userInfo 
    ? userStore.userInfo.adminId 
    : userStore.userInfo?.userId
})

// 从URL参数获取预选的知识文章ID
const preSelectedKnowledgeId = computed(() => {
  const knowledgeId = route.query.knowledgeId as string
  return knowledgeId ? parseInt(knowledgeId) : null
})

// 权限检查 - 管理员可以管理状态，但不能编辑别人的内容
const canEditContent = computed(() => {
  if (!isEdit.value) return true // 新建模式可以编辑
  if (!experience.value) return false
  return experience.value.userId === currentUserId.value // 只能编辑自己的内容
})

const canManageStatus = computed(() => {
  return isAdmin.value && isEdit.value // 管理员在编辑模式下可以管理状态
})

// 获取选中的知识文章信息
const selectedKnowledgeInfo = computed(() => {
  if (!form.value.knowledgeId) return null
  return knowledgeOptions.value.find(k => k.knowledgeId === form.value.knowledgeId)
})

// 表单验证规则
const rules = {
  knowledgeId: [
    { required: true, message: '请选择关联的知识文章', trigger: 'change' },
  ],
  title: [
    { required: true, message: '请输入心得标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应在2-50个字符之间', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入心得内容', trigger: 'change' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (!value || value.trim() === '' || value === '<p><br></p>') {
          callback(new Error('请输入心得内容'))
        } else {
          // 移除HTML标签来计算实际文本长度
          const textContent = value.replace(/<[^>]*>/g, '').trim()
          if (textContent.length < 10) {
            callback(new Error('内容至少需要10个字符'))
          } else if (textContent.length > 2000) {
            callback(new Error('内容不能超过2000个字符'))
          } else {
            callback()
          }
        }
      },
      trigger: 'change'
    },
  ],
}

const formRef = ref()

// 富文本编辑器相关
const editorRef = shallowRef<IDomEditor>()
const toolbarRef = ref()
const editorContainerRef = ref()

// 强制更新编辑器主题样式
const forceUpdateEditorTheme = () => {
  if (!editorRef.value || !editorContainerRef.value) return
  
  console.log('强制更新编辑器主题:', currentTheme.value)
  
  // 等待多个渲染帧确保DOM完全更新
  const applyStyles = () => {
    const textContainer = editorContainerRef.value?.querySelector('.w-e-text-container') as HTMLElement
    const textElement = textContainer?.querySelector('.w-e-text') as HTMLElement
    
    if (textContainer && textElement) {
      const isDark = currentTheme.value === 'dark'
      const bgColor = isDark ? '#1e1e1e' : '#ffffff'
      const textColor = isDark ? '#ffffff' : '#212121'
      
      // 移除旧样式并强制设置新样式
      const elements = [textContainer, textElement]
      elements.forEach((el: HTMLElement) => {
        if (el) {
          el.removeAttribute('style')
          el.style.cssText = `
            background-color: ${bgColor} !important;
            color: ${textColor} !important;
            background: ${bgColor} !important;
          `
        }
      })
      
      // 强制应用到所有子元素和新输入的内容
      const applyToElements = () => {
        const allElements = textElement.querySelectorAll('*')
        allElements.forEach((el: Element) => {
          if (el instanceof HTMLElement) {
            el.style.setProperty('color', textColor, 'important')
            el.style.setProperty('background-color', 'transparent', 'important')
          }
        })
        
        // 设置编辑器焦点时的样式
        textElement.addEventListener('focus', () => {
          textElement.style.setProperty('color', textColor, 'important')
        })
        
        // 监听输入事件，确保新输入的文字有正确颜色
        textElement.addEventListener('input', () => {
          setTimeout(() => {
            const newElements = textElement.querySelectorAll('*')
            newElements.forEach((el: Element) => {
              if (el instanceof HTMLElement) {
                el.style.setProperty('color', textColor, 'important')
              }
            })
          }, 10)
        })
      }
      
      applyToElements()
      
      // 定期检查并重新应用样式
      const intervalId = setInterval(() => {
        if (textElement && textElement.isConnected) {
          textElement.style.setProperty('background-color', bgColor, 'important')
          textElement.style.setProperty('color', textColor, 'important')
          textContainer.style.setProperty('background-color', bgColor, 'important')
          textContainer.style.setProperty('color', textColor, 'important')
          applyToElements()
        } else {
          clearInterval(intervalId)
        }
      }, 1000)
      
      console.log('编辑器主题更新完成', { bgColor, textColor })
    }
  }
  
  // 多次尝试应用样式
  requestAnimationFrame(() => {
    applyStyles()
    setTimeout(applyStyles, 100)
    setTimeout(applyStyles, 300)
    setTimeout(applyStyles, 500)
  })
}

// 编辑器配置
const getEditorConfig = (): Partial<IEditorConfig> => ({
  placeholder: '请详细分享您的学习心得和体会...',
  readOnly: !canEditContent.value, // 根据权限设置只读模式
  autoFocus: false, // 避免自动聚焦导致的样式问题
  scroll: true,
  MENU_CONF: {
    uploadImage: {
      server: '/api/upload/image', // 上传图片的API
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5M
      allowedFileTypes: ['image/*'],
      onSuccess: (file: File, res: any) => {
        console.log('图片上传成功', file, res)
      },
      onFailed: (file: File, res: any) => {
        console.error('图片上传失败', file, res)
      },
      onError: (file: File, err: any) => {
        console.error('图片上传出错', file, err)
      }
    },
    uploadVideo: {
      server: '/api/upload/video',
      fieldName: 'file',
      maxFileSize: 50 * 1024 * 1024, // 50M
      allowedFileTypes: ['video/*']
    }
  }
})

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    'group-video', // 排除视频相关功能
    'fullScreen' // 排除全屏功能
  ]
}

// 初始化编辑器
const initEditor = () => {
  if (!editorContainerRef.value || !toolbarRef.value) {
    console.warn('编辑器容器元素未找到')
    return
  }
  
  // 销毁已有的编辑器
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = undefined
  }
  
  try {
    // 创建编辑器
    editorRef.value = createEditor({
      selector: editorContainerRef.value,
      html: form.value.content || '',
      config: getEditorConfig(),
      mode: 'default'
    })

    // 创建工具栏
    const toolbar = createToolbar({
      editor: editorRef.value,
      selector: toolbarRef.value,
      config: toolbarConfig,
      mode: 'default'
    })

    // 监听编辑器内容变化
    editorRef.value.on('change', () => {
      if (editorRef.value) {
        form.value.content = editorRef.value.getHtml()
        // 触发表单验证
        nextTick(() => {
          formRef.value?.validateField('content')
        })
      }
    })
    
    // 延迟应用主题样式，确保编辑器完全初始化
    setTimeout(() => {
      forceUpdateEditorTheme()
    }, 100)
    
    console.log('富文本编辑器初始化成功')
  } catch (error) {
    console.error('富文本编辑器初始化失败:', error)
  }
}

// 销毁编辑器
const destroyEditor = () => {
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = undefined
  }
}

// 加载知识文章列表
const loadKnowledgeOptions = async () => {
  try {
    const response = await getKnowledgeList({
      page: 1,
      pageSize: 100,
    })
    
    // 类型断言成any以便处理不同的数据结构
    const responseAny = response as any;
    
    // 处理嵌套的API响应结构
    if (responseAny.data?.data) {
      // 新API结构: { data: { data: KnowledgeItem[] } }
      knowledgeOptions.value = responseAny.data.data;
    } else if (Array.isArray(responseAny.data)) {
      // 旧API结构: { data: KnowledgeItem[] }
      knowledgeOptions.value = responseAny.data;
    } else {
      // 兜底，确保始终是数组
      knowledgeOptions.value = [];
      console.warn('无法识别的知识文章数据结构:', responseAny);
    }
    
    console.log('知识文章列表加载成功:', knowledgeOptions.value)
  } catch (err: any) {
    console.error('加载知识文章列表失败:', err)
    ElMessage.error('加载知识文章列表失败')
    // 确保knowledgeOptions始终是数组
    knowledgeOptions.value = []
  }
}

// 加载心得详情（编辑模式）
const loadExperienceDetail = async () => {
  if (!isEdit.value) return
  
  try {
    const response = await getExperienceDetail(experienceId.value)
    
    // 处理嵌套的API响应结构，使用类型断言
    const responseAny = response as any
    const responseData = responseAny.data?.data || responseAny.data
    
    if (!responseData) {
      throw new Error('获取心得详情失败：数据结构异常')
    }
    
    experience.value = responseData
    
    // 填充表单
    form.value = {
      knowledgeId: responseData.knowledgeId,
      title: responseData.title,
      content: responseData.content,
    }
    
    // 填充管理员表单
    if (isAdmin.value) {
      adminForm.value = {
        status: responseData.status || 'pending',
        reviewComments: responseData.reviewComments || '',
      }
    }
  } catch (err: any) {
    console.error('加载心得详情失败:', err)
    ElMessage.error('加载心得详情失败')
    router.push('/experience')
  }
}

// 权限检查
const checkPermissions = () => {
  if (isEdit.value && experience.value) {
    const currentUserId = userStore.userInfo && 'adminId' in userStore.userInfo 
      ? userStore.userInfo.adminId 
      : userStore.userInfo?.userId
    
    const isOwner = experience.value.userId === currentUserId
    const isAdmin = userStore.isAdmin
    
    if (!isOwner && !isAdmin) {
      ElMessage.error('您没有权限编辑此心得')
      router.push('/experience')
      return false
    }
  }
  
  if (!userStore.isAuthenticated) {
    ElMessage.error('请先登录')
    router.push('/login')
    return false
  }
  
  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    submitting.value = true
    
    // 验证表单
    const valid = await formRef.value.validate().catch((validationError: any) => {
      console.warn('表单验证失败:', validationError)
      return false
    })
    
    if (!valid) {
      submitting.value = false
      return
    }
    
    if (isEdit.value) {
      if (canManageStatus.value) {
        // 管理员审核操作
        const reviewData: ReviewExperienceParams = {
          status: adminForm.value.status as any,
          reviewComments: adminForm.value.reviewComments || undefined,
        }
        
        await reviewExperience(experienceId.value, reviewData)
        ElMessage.success('审核状态更新成功')
      } else {
        // 普通用户更新心得内容
        const updateData: UpdateExperienceParams = {
          content: form.value.content,
        }
        
        await updateExperience(experienceId.value, updateData)
        ElMessage.success('心得更新成功，等待审核')
      }
    } else {
      // 创建心得
      const createData: CreateExperienceParams = {
        knowledgeId: form.value.knowledgeId!,
        title: form.value.title,
        content: form.value.content,
      }
      
      await createExperience(createData)
      ElMessage.success('心得发布成功，等待审核')
    }
    
    router.push('/experience')
  } catch (err: any) {
    console.error('提交失败:', err)
    ElMessage.error(err.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  router.back()
}

// 初始化
onMounted(async () => {
  try {
    loading.value = true
    
    // 权限检查
    if (!checkPermissions()) return
    
    // 并行加载数据
    const promises = [loadKnowledgeOptions()]
    
    if (isEdit.value) {
      promises.push(loadExperienceDetail())
    }
    
    await Promise.all(promises)
    
    // 如果是新建模式且有预选的知识文章ID，自动填入
    if (!isEdit.value && preSelectedKnowledgeId.value) {
      form.value.knowledgeId = preSelectedKnowledgeId.value
      
      // 根据选中的知识文章，生成建议的标题
      const selectedKnowledge = knowledgeOptions.value.find(k => k.knowledgeId === preSelectedKnowledgeId.value)
      if (selectedKnowledge) {
        form.value.title = `关于《${selectedKnowledge.title}》的学习心得`
      }
    }
    
    // 二次权限检查（编辑模式下需要等数据加载完成）
    if (isEdit.value) {
      checkPermissions()
    }
  } catch (err: any) {
    console.error('初始化失败:', err)
    ElMessage.error('页面初始化失败')
  } finally {
    loading.value = false
    
    // 在数据加载完成且页面不在加载状态后再初始化编辑器
    nextTick(() => {
      setTimeout(() => {
        initEditor()
      }, 100) // 给一个小延迟确保DOM完全渲染
    })
  }
})

// 监听主题变化
watch(currentTheme, () => {
  console.log('主题变化检测到:', currentTheme.value)
  // 延迟执行以确保DOM已更新
  setTimeout(() => {
    forceUpdateEditorTheme()
  }, 50)
}, { immediate: false })

// 组件销毁前清理编辑器
onBeforeUnmount(() => {
  destroyEditor()
})
</script>

<template>
  <div class="experience-form-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="handleCancel">
          <Icon icon="fluent:arrow-left-24-regular" />
          <span>返回</span>
        </button>
        <h1 class="page-title">
          <Icon icon="fluent:edit-24-regular" />
          {{ pageTitle }}
        </h1>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-content">
        <Icon icon="fluent:spinner-ios-20-filled" class="spinning" />
        <span>加载中...</span>
      </div>
    </div>

    <!-- 表单内容 -->
    <div v-else class="form-container">
      <!-- 驳回提示（编辑模式下且状态为驳回） -->
      <div v-if="isEdit && experience?.status === ExperienceStatus.REJECTED" class="rejection-notice">
        <ElAlert
          type="warning"
          title="审核未通过"
          :description="`驳回原因：${experience?.reviewComments || '无具体原因'}`"
          :closable="false"
          show-icon
        />
      </div>

      <div class="form-wrapper">
        <ElForm
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="experience-form"
        >
          <!-- 关联知识文章 -->
          <ElFormItem label="关联知识文章" prop="knowledgeId">
            <div class="knowledge-selection">
              <ElSelect
                v-if="!isEdit"
                v-model="form.knowledgeId"
                placeholder="请选择要关联的知识文章"
                :disabled="isEdit"
                class="knowledge-select"
                filterable
                clearable
              >
                <ElOption
                  v-for="knowledge in knowledgeOptions"
                  :key="knowledge.knowledgeId"
                  :label="knowledge.title"
                  :value="knowledge.knowledgeId"
                >
                  <div class="knowledge-option">
                    <div class="knowledge-title">{{ knowledge.title }}</div>
                    <div class="knowledge-meta">
                      <span class="knowledge-category">{{ knowledge.categories?.[0]?.categoryName || '健康知识' }}</span>
                      <span class="knowledge-views">浏览: {{ knowledge.viewCount || 0 }}</span>
                    </div>
                  </div>
                </ElOption>
              </ElSelect>
              
              <div class="field-tip">
                <Icon v-if="isEdit" icon="fluent:info-24-regular" />
                {{ isEdit ? '编辑时不能修改关联的知识文章' : '请选择您要分享心得的知识文章，支持搜索' }}
              </div>
              
              <!-- 已选择的知识文章预览 -->
              <div v-if="form.knowledgeId && selectedKnowledgeInfo" class="selected-knowledge-preview">
                <div class="preview-header">
                  <Icon icon="fluent:book-24-filled" />
                  <span>已选择的知识文章</span>
                </div>
                <div class="preview-content">
                  <h4 class="preview-title">{{ selectedKnowledgeInfo.title }}</h4>
                  <p class="preview-summary">{{ selectedKnowledgeInfo.introduction || '暂无简介' }}</p>
                  <div class="preview-meta">
                    <span class="meta-item">
                      <Icon icon="fluent:tag-24-regular" />
                      {{ selectedKnowledgeInfo.categories?.[0]?.categoryName || '健康知识' }}
                    </span>
                    <span class="meta-item">
                      <Icon icon="fluent:eye-24-regular" />
                      {{ selectedKnowledgeInfo.viewCount || 0 }} 浏览
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ElFormItem>

          <!-- 心得标题 -->
          <ElFormItem label="心得标题" prop="title">
            <ElInput
              v-model="form.title"
              placeholder="请输入心得标题"
              :disabled="isEdit || !canEditContent"
              class="title-input"
            />
            <div class="field-tip">
              {{ isEdit ? '编辑时不能修改标题' : '简洁明了的标题有助于其他用户了解您的心得' }}
            </div>
          </ElFormItem>

          <!-- 心得内容 -->
          <ElFormItem label="心得内容" prop="content">
            <div class="rich-editor-wrapper" :class="{ 'editor-disabled': !canEditContent }">
              <!-- 工具栏 -->
              <div ref="toolbarRef" class="editor-toolbar"></div>
              <!-- 编辑器 -->
              <div ref="editorContainerRef" class="editor-container"></div>
            </div>
            <div class="field-tip">
              <span v-if="canEditContent">
                分享您在学习过程中的感悟、实践经验或疑问，支持富文本格式，可插入图片、列表等内容
              </span>
              <span v-else class="content-readonly-tip">
                                    <Icon icon="fluent:lock-24-regular" />
                管理员只能审核状态，不能编辑其他用户的心得内容
              </span>
            </div>
          </ElFormItem>
          
          <!-- 管理员状态管理 -->
          <template v-if="canManageStatus">
            <div class="admin-section">
              <div class="admin-section-header">
                <div class="header-icon">
                  <Icon icon="fluent:shield-24-filled" />
                </div>
                <div class="header-content">
                  <h3>内容审核管理</h3>
                  <p>管理员可以审核心得内容并设置状态</p>
                </div>
                <div class="admin-badge">
                  <Icon icon="fluent:certificate-24-regular" />
                  <span>管理员</span>
                </div>
              </div>
              
              <div class="admin-form-content">
                <!-- 当前状态显示 -->
                <div class="current-status-display">
                  <div class="status-label">当前状态</div>
                  <div class="status-badge-large" :class="`status-${experience?.status || 'pending'}`">
                                         <Icon 
                       :icon="experience?.status === 'approved' ? 'fluent:checkmark-circle-24-filled' : 
                              experience?.status === 'rejected' ? 'fluent:dismiss-circle-24-regular' :
                              'fluent:clock-24-filled'" 
                     />
                    <span>
                      {{ experience?.status === 'approved' ? '已通过' : 
                         experience?.status === 'rejected' ? '已驳回' : '待审核' }}
                    </span>
                  </div>
                </div>
                
                <!-- 审核状态选择 -->
                <ElFormItem label="设置审核状态" class="status-form-item">
                  <ElSelect 
                    v-model="adminForm.status" 
                    placeholder="请选择审核状态" 
                    class="status-select"
                    size="large"
                  >
                    <ElOption value="pending" label="待审核">
                      <div class="status-option">
                        <Icon icon="fluent:clock-24-filled" class="status-icon pending" />
                        <div class="status-text">
                          <span class="status-name">待审核</span>
                          <span class="status-desc">需要进一步审核</span>
                        </div>
                      </div>
                    </ElOption>
                    <ElOption value="approved" label="审核通过">
                      <div class="status-option">
                        <Icon icon="fluent:checkmark-circle-24-filled" class="status-icon approved" />
                        <div class="status-text">
                          <span class="status-name">审核通过</span>
                          <span class="status-desc">内容符合要求，允许发布</span>
                        </div>
                      </div>
                    </ElOption>
                    <ElOption value="rejected" label="审核驳回">
                      <div class="status-option">
                        <Icon icon="fluent:dismiss-circle-24-regular" class="status-icon rejected" />
                        <div class="status-text">
                          <span class="status-name">审核驳回</span>
                          <span class="status-desc">内容需要修改或不符合要求</span>
                        </div>
                      </div>
                    </ElOption>
                  </ElSelect>
                </ElFormItem>
                
                <!-- 审核意见 -->
                <ElFormItem 
                  v-if="adminForm.status === 'rejected'" 
                  label="驳回原因" 
                  class="review-form-item"
                >
                  <ElInput
                    v-model="adminForm.reviewComments"
                    type="textarea"
                    placeholder="请详细说明驳回原因，帮助作者改进内容..."
                    :rows="4"
                    maxlength="200"
                    show-word-limit
                    class="review-comments"
                  />
                  <div class="field-tip review-tip">
                    <Icon icon="fluent:lightbulb-24-regular" />
                    <span>请提供建设性的反馈意见，帮助作者改进内容质量</span>
                  </div>
                </ElFormItem>
                
                <!-- 审核说明 -->
                <div class="review-guidelines">
                  <div class="guidelines-header">
                    <Icon icon="fluent:document-24-regular" />
                    <span>审核指南</span>
                  </div>
                  <ul class="guidelines-list">
                    <li>确保内容真实可靠，符合医疗健康标准</li>
                    <li>检查是否包含不当或有害信息</li>
                    <li>验证内容与关联知识文章的相关性</li>
                    <li>评估内容对其他用户的价值和意义</li>
                  </ul>
                </div>
              </div>
            </div>
          </template>
        </ElForm>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <ElButton size="large" @click="handleCancel">
            取消
          </ElButton>
          <ElButton 
            type="primary" 
            size="large" 
            :loading="submitting"
            @click="handleSubmit"
          >
            <template v-if="submitting">
              <Icon icon="fluent:spinner-ios-20-filled" class="spinning" />
              提交中...
            </template>
            <template v-else>
              <Icon v-if="canManageStatus" icon="fluent:shield-24-regular" />
              <Icon v-else-if="isEdit" icon="fluent:edit-24-regular" />
              <Icon v-else icon="fluent:add-24-regular" />
              {{ canManageStatus ? '更新审核状态' : (isEdit ? '更新心得' : '发布心得') }}
            </template>
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.experience-form-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 20px;
}

.page-header {
  margin-bottom: 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 16px;
  }
  
  &:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  
  .iconify {
    font-size: 32px;
    color: var(--color-primary);
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
  
  .iconify {
    font-size: 32px;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
}

.rejection-notice {
  margin-bottom: 24px;
}

.form-wrapper {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border-primary);
}

.experience-form {
  .el-form-item {
    margin-bottom: 24px;
  }
  
  .el-form-item__label {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 14px;
    margin-bottom: 8px;
  }
}

.knowledge-select,
.title-input {
  width: 100%;
}

// 知识文章选择相关样式
.knowledge-selection {
  .knowledge-select {
    margin-bottom: 16px;
    
    // 自定义下拉选项的样式
    :deep(.el-select-dropdown) {
      .el-select-dropdown__item {
        height: auto;
        min-height: 60px;
        padding: 0;
        line-height: 1.4;
        
        &:hover {
          background-color: var(--color-bg-secondary);
        }
        
        &.selected {
          background-color: rgba(var(--color-primary-rgb), 0.1);
          color: var(--color-primary);
          font-weight: 500;
        }
      }
    }
    
    // 输入框样式
    :deep(.el-input__wrapper) {
      min-height: 48px;
      padding: 8px 12px;
    }
    
    :deep(.el-input__inner) {
      line-height: 1.4;
    }
  }
}

.knowledge-option {
  padding: 12px 0;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  .knowledge-title {
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 6px;
    line-height: 1.4;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .knowledge-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--color-text-muted);
    align-items: center;
    
    .knowledge-category {
      padding: 3px 8px;
      background: var(--color-primary);
      color: white;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }
    
    .knowledge-views {
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
    }
  }
}

.selected-knowledge-preview {
  margin-top: 16px;
  padding: 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 12px;
  
  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-primary);
    
    .iconify {
      font-size: 16px;
    }
  }
  
  .preview-content {
    .preview-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    
    .preview-summary {
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0 0 12px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .preview-meta {
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
  }
}

// 富文本编辑器样式
.rich-editor-wrapper {
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.3s ease;
  
  &:hover {
    border-color: var(--color-primary);
  }
  
  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
  }
}

.editor-toolbar {
  border-bottom: 1px solid var(--color-border-secondary);
  background: var(--color-bg-secondary);
  
  :deep(.w-e-toolbar) {
    border: none !important;
    background: transparent !important;
  }
  
  :deep(.w-e-bar-item) {
    color: var(--color-text-primary) !important;
    border: none !important;
    
    &:hover {
      background: var(--color-bg-primary) !important;
      color: var(--color-primary) !important;
    }
    
    &.w-e-bar-item-active {
      background: var(--color-primary) !important;
      color: white !important;
    }
    
    // 修复图标颜色
    svg {
      fill: currentColor !important;
    }
  }
  
  // 分割线颜色
  :deep(.w-e-bar-divider) {
    background-color: var(--color-border-secondary) !important;
  }
  
  // 下拉菜单样式
  :deep(.w-e-drop-panel) {
    background: var(--color-bg-elevated) !important;
    border: 1px solid var(--color-border-primary) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    
    .w-e-dp-item {
      color: var(--color-text-primary) !important;
      
      &:hover {
        background: var(--color-bg-secondary) !important;
      }
    }
  }
}

.editor-container {
  min-height: 300px;
  background: var(--color-bg-elevated);
  
  :deep(.w-e-text-container) {
    border: none !important;
    background: var(--color-bg-elevated) !important;
    min-height: 300px;
    color: var(--color-text-primary) !important;
  }
  
  :deep(.w-e-text-placeholder) {
    color: var(--color-text-muted) !important;
  }
  
  :deep(.w-e-text) {
    padding: 16px !important;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-primary) !important;
    background: var(--color-bg-elevated) !important;
    
    // 确保所有文本元素都使用正确的颜色
    *, *::before, *::after {
      color: inherit !important;
    }
    
    p {
      margin: 0 0 12px 0;
      color: var(--color-text-primary) !important;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin: 16px 0 12px 0;
      color: var(--color-text-primary) !important;
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    ul, ol {
      margin: 12px 0;
      padding-left: 24px;
      
      li {
        margin: 4px 0;
        color: var(--color-text-primary) !important;
      }
    }
    
    blockquote {
      margin: 12px 0;
      padding: 12px 16px;
      border-left: 4px solid var(--color-primary);
      background: var(--color-bg-secondary);
      border-radius: 0 8px 8px 0;
      color: var(--color-text-primary) !important;
    }
    
    code {
      padding: 2px 6px;
      background: var(--color-bg-secondary);
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      color: var(--color-text-primary) !important;
    }
    
    pre {
      margin: 12px 0;
      padding: 16px;
      background: var(--color-bg-secondary);
      border-radius: 8px;
      overflow-x: auto;
      color: var(--color-text-primary) !important;
      
      code {
        padding: 0;
        background: transparent;
        color: inherit !important;
      }
    }
    
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      
      th, td {
        padding: 8px 12px;
        border: 1px solid var(--color-border-secondary);
        text-align: left;
        color: var(--color-text-primary) !important;
      }
      
      th {
        background: var(--color-bg-secondary);
        font-weight: 600;
      }
    }
    
    // 链接样式
    a {
      color: var(--color-primary) !important;
      text-decoration: underline;
      
      &:hover {
        color: var(--color-primary-dark, var(--color-primary)) !important;
      }
    }
    
    // 强调文本
    strong, b {
      color: var(--color-text-primary) !important;
      font-weight: 600;
    }
    
    em, i {
      color: var(--color-text-primary) !important;
    }
    
    // 删除线
    s, del {
      color: var(--color-text-secondary) !important;
    }
    
    // 下划线
    u, ins {
      color: var(--color-text-primary) !important;
    }
  }
}

.field-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
  
  .content-readonly-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-warning);
    font-weight: 500;
    
    .iconify {
      font-size: 14px;
    }
  }
}

// 禁用编辑器样式
.editor-disabled {
  opacity: 0.7;
  pointer-events: none;
  
  .editor-toolbar {
    background: var(--color-bg-tertiary) !important;
  }
  
  .editor-container {
    background: var(--color-bg-tertiary) !important;
  }
}

// 管理员审核区域样式
.admin-section {
  margin-top: 32px;
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.02) 0%, rgba(var(--color-primary-rgb), 0.05) 100%);
  border: 2px solid rgba(var(--color-primary-rgb), 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(var(--color-primary-rgb), 0.08);
}

.admin-section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--color-primary);
  color: white;
  
  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    
    .iconify {
      font-size: 24px;
    }
  }
  
  .header-content {
    flex: 1;
    
    h3 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    
    p {
      font-size: 14px;
      margin: 0;
      opacity: 0.9;
    }
  }
  
  .admin-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    
    .iconify {
      font-size: 16px;
    }
  }
}

.admin-form-content {
  padding: 24px;
}

.current-status-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border-secondary);
  
  .status-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
  
  .status-badge-large {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    
    .iconify {
      font-size: 18px;
    }
    
    &.status-pending {
      background: rgba(255, 193, 7, 0.1);
      color: #856404;
      border: 1px solid rgba(255, 193, 7, 0.3);
      
      .iconify {
        color: #ffc107;
      }
    }
    
    &.status-approved {
      background: rgba(40, 167, 69, 0.1);
      color: #155724;
      border: 1px solid rgba(40, 167, 69, 0.3);
      
      .iconify {
        color: #28a745;
      }
    }
    
    &.status-rejected {
      background: rgba(220, 53, 69, 0.1);
      color: #721c24;
      border: 1px solid rgba(220, 53, 69, 0.3);
      
      .iconify {
        color: #dc3545;
      }
    }
  }
}

.status-form-item,
.review-form-item {
  margin-bottom: 24px;
  
  :deep(.el-form-item__label) {
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.status-select {
  width: 100%;
  
  :deep(.el-select__wrapper) {
    border-radius: 10px;
    min-height: 48px;
  }
}

.status-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  
  .status-icon {
    font-size: 20px;
    
    &.pending {
      color: #ffc107;
    }
    
    &.approved {
      color: #28a745;
    }
    
    &.rejected {
      color: #dc3545;
    }
  }
  
  .status-text {
    .status-name {
      display: block;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 2px;
    }
    
    .status-desc {
      display: block;
      font-size: 12px;
      color: var(--color-text-muted);
      line-height: 1.3;
    }
  }
}

.review-comments {
  width: 100%;
  
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    line-height: 1.6;
    padding: 12px;
    font-size: 14px;
  }
}

.review-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px 16px;
  background: rgba(var(--color-warning-rgb), 0.05);
  border: 1px solid rgba(var(--color-warning-rgb), 0.1);
  border-radius: 8px;
  
  .iconify {
    font-size: 16px;
    color: var(--color-warning);
    flex-shrink: 0;
  }
  
  span {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }
}

.review-guidelines {
  margin-top: 24px;
  padding: 20px;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border-secondary);
  
  .guidelines-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    
    .iconify {
      font-size: 18px;
      color: var(--color-primary);
    }
  }
  
  .guidelines-list {
    margin: 0;
    padding-left: 0;
    list-style: none;
    
    li {
      position: relative;
      padding: 8px 0 8px 24px;
      font-size: 14px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      
      &:before {
        content: '•';
        position: absolute;
        left: 8px;
        color: var(--color-primary);
        font-weight: bold;
      }
      
      &:not(:last-child) {
        border-bottom: 1px solid var(--color-border-tertiary);
      }
    }
  }
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 32px 0 24px 0;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-secondary);
}

.submit-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--color-border-secondary);
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  
  .iconify {
    font-size: 16px;
    color: var(--color-warning);
    flex-shrink: 0;
  }
  
  &.admin-tip {
    background: var(--color-bg-secondary);
    padding: 12px 16px;
    border-radius: 8px;
    border-left: 4px solid var(--color-primary);
    color: var(--color-text-primary);
    
    .iconify {
      color: var(--color-primary);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .experience-form-page {
    padding: 16px;
  }
  
  .form-wrapper {
    padding: 24px 20px;
  }
  
  .header-left {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .page-title {
    font-size: 24px;
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .experience-form-page {
    padding: 12px;
  }
  
  .form-wrapper {
    padding: 20px 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
}
</style> 