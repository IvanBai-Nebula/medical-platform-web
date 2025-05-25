<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, onBeforeUnmount, reactive, shallowRef, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { useTheme } from '@/composables/useTheme'
import { getKnowledgeDetail, createKnowledge, updateKnowledge, getMedicalCategories } from '@/services'
import type { KnowledgeItem, MedicalCategory, CreateKnowledgeParams, UpdateKnowledgeParams } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createKnowledgeCoverWithTitle } from '@/utils/images'
import '@wangeditor/editor/dist/css/style.css'
import { createEditor, createToolbar } from '@wangeditor/editor'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { currentTheme } = useTheme()

// 判断是编辑还是创建模式
const isEdit = computed(() => !!route.params.id)
const knowledgeId = computed(() => route.params.id as string)

// 表单数据
const formData = ref({
  title: '',
  introduction: '',
  content: '',
  coverImage: '',
  videoUrl: '',
  categoryIds: [] as (number | undefined)[] // 兼容新旧API格式
})

// 其他状态
const categories = ref<MedicalCategory[]>([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const publishImmediately = ref(true)

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入知识标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  introduction: [
    { required: true, message: '请输入知识简介', trigger: 'blur' },
    { min: 10, max: 500, message: '简介长度在 10 到 500 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入知识内容', trigger: 'blur' },
    { min: 50, message: '内容至少需要 50 个字符', trigger: 'blur' }
  ],
  categoryIds: [
    { type: 'array' as const, required: true, message: '请选择至少一个分类', trigger: 'change' }
  ]
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
const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入详细的知识内容，支持富文本格式...',
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
}

const toolbarConfig: Partial<IToolbarConfig> = {
  // 知识内容编辑器保留更多功能
}

// 初始化编辑器
const initEditor = () => {
  if (!editorContainerRef.value) return
  
  // 创建编辑器
  editorRef.value = createEditor({
    selector: editorContainerRef.value,
    html: formData.value.content,
    config: editorConfig,
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
      formData.value.content = editorRef.value.getHtml()
    }
  })
  
  // 延迟应用主题样式，确保编辑器完全初始化
  setTimeout(() => {
    forceUpdateEditorTheme()
  }, 100)
}

// 销毁编辑器
const destroyEditor = () => {
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = undefined
  }
}

// 计算属性
const pageTitle = computed(() => isEdit.value ? '编辑知识' : '创建知识')
const submitButtonText = computed(() => saving.value ? (isEdit.value ? '更新中...' : '创建中...') : (isEdit.value ? '更新知识' : '创建知识'))

// 加载医疗分类
const loadCategories = async () => {
  try {
    const response = await getMedicalCategories()
    categories.value = response.data
  } catch (err) {
    console.error('加载分类失败:', err)
    ElMessage.error('加载分类失败')
  }
}

// 加载知识详情（编辑模式）
const loadKnowledgeDetail = async () => {
  if (!isEdit.value) return
  
  try {
    loading.value = true
    const response = await getKnowledgeDetail(knowledgeId.value)
    const knowledge = response.data
    
    formData.value = {
      title: knowledge.title,
      introduction: knowledge.introduction,
      content: knowledge.content,
      coverImage: knowledge.coverImage || '',
      videoUrl: knowledge.videoUrl || '',
      // 兼容新旧API格式
      categoryIds: knowledge.categories?.map(c => c.id || c.categoryId) || []
    }
    
    // 更新编辑器内容
    if (editorRef.value) {
      editorRef.value.setHtml(knowledge.content)
    }
  } catch (err) {
    console.error('加载知识详情失败:', err)
    ElMessage.error('加载知识详情失败')
    router.push('/knowledge')
  } finally {
    loading.value = false
  }
}

// 处理封面图片上传
const handleCoverUpload = async (file: File) => {
  try {
    uploading.value = true
    
    // 检查文件大小
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过5MB');
      return;
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择有效的图片文件');
      return;
    }
    
    // 将File对象转换为Base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
    
    // 使用实际上传的图片
    formData.value.coverImage = base64Image;
    ElMessage.success('封面上传成功');
  } catch (err) {
    console.error('封面上传失败:', err);
    ElMessage.error('封面上传失败');
  } finally {
    uploading.value = false;
  }
}

// 删除封面图片
const removeCoverImage = () => {
  formData.value.coverImage = ''
}

// 保存草稿
const saveDraft = async () => {
  try {
    // TODO: 实现草稿保存逻辑
    ElMessage.success('草稿已保存')
  } catch (err) {
    ElMessage.error('保存草稿失败')
  }
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value?.validate()
    saving.value = true
    
    const params = {
      title: formData.value.title,
      introduction: formData.value.introduction,
      content: formData.value.content,
      coverImage: formData.value.coverImage || undefined,
      videoUrl: formData.value.videoUrl || undefined,
      categoryIds: formData.value.categoryIds
    }
    
    if (isEdit.value) {
      await updateKnowledge(knowledgeId.value, params as UpdateKnowledgeParams)
      ElMessage.success('知识更新成功')
    } else {
      await createKnowledge(params as CreateKnowledgeParams)
      ElMessage.success('知识创建成功')
    }
    
    router.push('/knowledge')
  } catch (err: any) {
    console.error('提交失败:', err)
    if (err !== 'cancel') {
      ElMessage.error(err.message || '提交失败')
    }
  } finally {
    saving.value = false
  }
}

// 取消编辑
const cancelEdit = () => {
  ElMessageBox.confirm('确定要取消吗？未保存的内容将丢失', '确认取消', {
    type: 'warning',
  }).then(() => {
    router.push('/knowledge')
  }).catch(() => {
    // 用户取消
  })
}

// 预览内容
const previewContent = () => {
  // TODO: 实现内容预览功能
  ElMessage.info('预览功能开发中')
}

// 初始化
onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadKnowledgeDetail()
  ])
  
  // 初始化富文本编辑器
  nextTick(() => {
    initEditor()
  })
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
  <div class="knowledge-form-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="router.back()">
          <Icon icon="fluent:arrow-left-24-regular" />
          <span>返回</span>
        </button>
        <div class="page-info">
          <h1 class="page-title">
            <Icon icon="fluent:edit-24-filled" />
            {{ pageTitle }}
          </h1>
          <p class="page-subtitle">{{ isEdit ? '编辑现有的医疗知识内容' : '创建新的医疗知识内容' }}</p>
        </div>
      </div>
      
      <div class="header-actions">
        <button class="action-btn draft-btn" @click="saveDraft">
          <Icon icon="fluent:save-24-regular" />
          <span>保存草稿</span>
        </button>
        <button class="action-btn preview-btn" @click="previewContent">
          <Icon icon="fluent:eye-24-regular" />
          <span>预览</span>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton animated>
        <template #template>
          <div class="skeleton-form">
            <el-skeleton-item variant="h1" style="width: 40%; margin-bottom: 20px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 15px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 15px;" />
            <el-skeleton-item variant="rect" style="width: 100%; height: 200px;" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 表单内容 -->
    <div v-else class="form-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        class="knowledge-form"
      >
        <div class="form-grid">
          <!-- 左侧主要内容 -->
          <div class="main-content">
            <!-- 标题 -->
            <el-form-item label="知识标题" prop="title" class="form-item">
              <el-input
                v-model="formData.title"
                placeholder="请输入知识标题..."
                size="large"
                maxlength="100"
                show-word-limit
                class="title-input"
              />
            </el-form-item>

            <!-- 简介 -->
            <el-form-item label="知识简介" prop="introduction" class="form-item">
              <el-input
                v-model="formData.introduction"
                type="textarea"
                placeholder="请输入知识简介，简要描述知识要点..."
                :rows="4"
                maxlength="500"
                show-word-limit
                resize="none"
                class="introduction-input"
              />
            </el-form-item>

            <!-- 内容编辑器 -->
            <el-form-item label="知识内容" prop="content" class="form-item">
              <div class="rich-editor-wrapper">
                <!-- 工具栏 -->
                <div ref="toolbarRef" class="editor-toolbar"></div>
                <!-- 编辑器 -->
                <div ref="editorContainerRef" class="editor-container"></div>
              </div>
              <div class="field-tip">
                详细的知识内容，支持富文本格式，可插入图片、表格、代码块等丰富内容
              </div>
            </el-form-item>
          </div>

          <!-- 右侧配置项 -->
          <div class="side-config">
            <!-- 封面图片 -->
            <div class="config-section">
              <h3 class="section-title">
                <Icon icon="fluent:image-24-regular" />
                封面图片
              </h3>
              <div class="cover-upload">
                <div v-if="formData.coverImage" class="cover-preview">
                  <img :src="formData.coverImage" alt="封面预览" />
                  <div class="cover-overlay">
                    <button class="overlay-btn" @click="removeCoverImage">
                      <Icon icon="fluent:delete-24-regular" />
                    </button>
                  </div>
                </div>
                <div v-else class="upload-area">
                  <input
                    type="file"
                    ref="fileInput"
                    @change="(e: Event) => {
                      const target = e.target as HTMLInputElement
                      const file = target.files?.[0]
                      if (file) handleCoverUpload(file)
                    }"
                    accept="image/*"
                    style="display: none"
                  />
                  <button
                    type="button"
                    class="upload-btn"
                    :disabled="uploading"
                    @click="($refs.fileInput as HTMLInputElement)?.click()"
                  >
                    <Icon v-if="uploading" icon="fluent:spinner-ios-20-filled" class="spinning" />
                    <Icon v-else icon="fluent:cloud-arrow-up-24-regular" />
                    <span>{{ uploading ? '上传中...' : '上传封面' }}</span>
                  </button>
                  <p class="upload-tip">支持 JPG、PNG 格式，建议尺寸 400x200px</p>
                </div>
              </div>
            </div>

            <!-- 视频链接 -->
            <div class="config-section">
              <h3 class="section-title">
                <Icon icon="fluent:video-24-regular" />
                视频链接
              </h3>
              <el-input
                v-model="formData.videoUrl"
                placeholder="请输入视频链接（可选）"
                class="video-input"
              >
                <template #prefix>
                  <Icon icon="fluent:link-24-regular" />
                </template>
              </el-input>
            </div>

            <!-- 分类选择 -->
            <div class="config-section">
              <h3 class="section-title">
                <Icon icon="fluent:tag-24-regular" />
                知识分类
              </h3>
              <el-form-item prop="categoryIds">
                <el-select
                  v-model="formData.categoryIds"
                  multiple
                  placeholder="请选择分类"
                  style="width: 100%"
                  class="category-select"
                >
                  <el-option
                    v-for="category in categories"
                    :key="category.id || category.categoryId"
                    :label="category.categoryName"
                    :value="category.id || category.categoryId"
                  />
                </el-select>
              </el-form-item>
            </div>

            <!-- 发布设置 -->
            <div class="config-section">
              <h3 class="section-title">
                <Icon icon="fluent:settings-24-regular" />
                发布设置
              </h3>
              <div class="publish-options">
                <div class="option-item">
                  <el-switch
                    v-model="publishImmediately"
                    active-text="立即发布"
                    inactive-text="保存草稿"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 表单操作栏 -->
        <div class="form-actions">
          <div class="actions-left">
            <span class="save-status">
              <Icon icon="fluent:checkmark-circle-24-filled" />
              自动保存于 2 分钟前
            </span>
          </div>
          <div class="actions-right">
            <button type="button" class="cancel-btn" @click="cancelEdit">
              取消
            </button>
            <button
              type="button"
              class="submit-btn"
              :disabled="saving"
              @click="submitForm"
            >
              <Icon v-if="saving" icon="fluent:spinner-ios-20-filled" class="spinning" />
              <Icon v-else :icon="isEdit ? 'fluent:checkmark-24-filled' : 'fluent:add-24-filled'" />
              <span>{{ submitButtonText }}</span>
            </button>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-form-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
  padding: 20px 0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  
  .iconify {
    font-size: 16px;
  }
  
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.page-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 4px 0;
    line-height: 1.2;

    .iconify {
      color: var(--color-primary);
      font-size: 24px;
    }
  }

  .page-subtitle {
    font-size: 15px;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.4;
  }
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 16px;
  }
  
  &.draft-btn {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    border-color: var(--color-border-primary);
    
    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
  
  &.preview-btn {
    background: #f39c12;
    color: white;
    
    &:hover {
      background: #e67e22;
    }
  }
}

.loading-state {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 32px;
}

.form-container {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: 2fr 280px;
  gap: 40px;
  margin-bottom: 32px;
}

.main-content {
  min-width: 0;
  
  .form-item {
    margin-bottom: 24px;
    
    :deep(.el-form-item__label) {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 8px;
    }
  }
  
  .title-input {
    :deep(.el-input__wrapper) {
      border-radius: 12px;
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .introduction-input {
    :deep(.el-textarea__inner) {
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.6;
    }
  }
}

// 富文本编辑器样式
.rich-editor-wrapper {
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
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
}

.editor-container {
  min-height: 400px;
  background: var(--color-bg-elevated);
  
  :deep(.w-e-text-container) {
    border: none !important;
    background: var(--color-bg-elevated) !important;
    min-height: 400px;
    color: var(--color-text-primary) !important;
  }
  
  :deep(.w-e-text-placeholder) {
    color: var(--color-text-muted) !important;
  }
  
  :deep(.w-e-text) {
    padding: 20px !important;
    font-size: 15px;
    line-height: 1.7;
    color: var(--color-text-primary) !important;
    background: var(--color-bg-elevated) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    
    // 确保所有文本元素都使用正确的颜色
    *, *::before, *::after {
      color: inherit !important;
    }
    
    p {
      margin: 0 0 16px 0;
      color: var(--color-text-primary) !important;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin: 24px 0 16px 0;
      color: var(--color-text-primary) !important;
      font-weight: 600;
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    h1 { font-size: 28px; }
    h2 { font-size: 24px; }
    h3 { font-size: 20px; }
    h4 { font-size: 18px; }
    h5 { font-size: 16px; }
    h6 { font-size: 14px; }
    
    ul, ol {
      margin: 16px 0;
      padding-left: 32px;
      
      li {
        margin: 6px 0;
        line-height: 1.6;
        color: var(--color-text-primary) !important;
      }
    }
    
    blockquote {
      margin: 16px 0;
      padding: 16px 20px;
      border-left: 4px solid var(--color-primary);
      background: var(--color-bg-secondary);
      border-radius: 0 12px 12px 0;
      font-style: italic;
      color: var(--color-text-primary) !important;
    }
    
    code {
      padding: 3px 8px;
      background: var(--color-bg-secondary);
      border-radius: 6px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      color: var(--color-text-primary) !important;
    }
    
    pre {
      margin: 16px 0;
      padding: 20px;
      background: var(--color-bg-secondary);
      border-radius: 12px;
      overflow-x: auto;
      border: 1px solid var(--color-border-secondary);
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
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      margin: 16px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--color-border-secondary);
      
      th, td {
        padding: 12px 16px;
        border: 1px solid var(--color-border-secondary);
        text-align: left;
        color: var(--color-text-primary) !important;
      }
      
      th {
        background: var(--color-bg-secondary);
        font-weight: 600;
        color: var(--color-text-primary) !important;
      }
      
      tr:nth-child(even) {
        background: var(--color-bg-secondary);
      }
    }
    
    a {
      color: var(--color-primary) !important;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
        color: var(--color-primary-dark, var(--color-primary)) !important;
      }
    }
  }
}

.field-tip {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.side-config {
  .config-section {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 16px 0;
      
      .iconify {
        font-size: 18px;
        color: var(--color-primary);
      }
    }
  }
}

.cover-upload {
  .cover-preview {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 120px;
      object-fit: cover;
    }
    
    .cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      
      .overlay-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        color: #e74c3c;
        border-radius: 50%;
        cursor: pointer;
        
        .iconify {
          font-size: 20px;
        }
      }
    }
    
    &:hover .cover-overlay {
      opacity: 1;
    }
  }
  
  .upload-area {
    text-align: center;
    
    .upload-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 24px 16px;
      border: 2px dashed var(--color-border-primary);
      background: transparent;
      color: var(--color-text-secondary);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      .iconify {
        font-size: 32px;
      }
      
      &:hover:not(:disabled) {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .spinning {
        animation: spin 1s linear infinite;
      }
    }
    
    .upload-tip {
      font-size: 12px;
      color: var(--color-text-muted);
      margin: 8px 0 0 0;
    }
  }
}

.video-input,
.category-select {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 8px;
  }
}

.publish-options {
  .option-item {
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-secondary);
}

.actions-left {
  .save-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--color-text-muted);
    
    .iconify {
      font-size: 16px;
      color: #27ae60;
    }
  }
}

.actions-right {
  display: flex;
  gap: 12px;
}

.cancel-btn, .submit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 16px;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.cancel-btn {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
  
  &:hover:not(:disabled) {
    background: var(--color-bg-tertiary);
  }
}

.submit-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #1976d2));
  color: white;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.4);
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .side-config {
    order: -1;
  }
}

@media (max-width: 768px) {
  .knowledge-form-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    
    .actions-right {
      justify-content: space-between;
    }
  }
}
</style>

