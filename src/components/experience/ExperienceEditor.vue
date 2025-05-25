<script setup lang="ts">
import type { CreateExperienceParams, ExperienceItem, UpdateExperienceParams } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
  experience?: ExperienceItem
  knowledgeId?: number // 如果从知识详情页创建，会传入知识ID
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'created', experience: ExperienceItem): void
  (e: 'updated', experience: ExperienceItem): void
}>()

// 本地定义枚举
enum ExperienceStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 通过
  REJECTED = 'rejected', // 驳回
}

// 模拟知识服务
const knowledgeService = {
  getKnowledgeList: async () => ({
    data: [
      {
        knowledgeId: 1,
        introduction: '高血压知识',
        content: '',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        knowledgeId: 2,
        introduction: '糖尿病知识',
        content: '',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        knowledgeId: 3,
        introduction: '中风急救知识',
        content: '',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  }),
}

// 模拟服务
const experienceService = {
  createExperience: async (data: CreateExperienceParams): Promise<{ data: ExperienceItem }> => {
    // 模拟返回数据
    return {
      data: {
        experienceId: 1,
        userId: 101,
        username: '当前用户',
        knowledgeId: data.knowledgeId,
        title: data.title,
        content: data.content,
        likeCount: 0,
        isLiked: false,
        status: ExperienceStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  },
  updateExperience: async (id: number | string, data: UpdateExperienceParams): Promise<{ data: ExperienceItem }> => {
    // 模拟返回数据
    return {
      data: {
        experienceId: typeof id === 'number' ? id : Number.parseInt(id),
        userId: 101,
        username: '当前用户',
        knowledgeId: 1,
        title: '默认标题',
        content: data.content,
        likeCount: 0,
        isLiked: false,
        status: ExperienceStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  },
}

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})
const isEdit = computed(() => !!props.experience)
const knowledgeOptions = ref<{ value: number, label: string }[]>([])

// 判断是否固定了知识ID（从知识详情页创建时）
const knowledgeIdFixed = computed(() => !!props.knowledgeId)

// 表单数据
const form = reactive<{
  knowledgeId: number
  title: string
  content: string
}>({
  knowledgeId: props.knowledgeId || 0,
  title: '',
  content: '',
})

// 表单验证规则
const rules = reactive<FormRules>({
  knowledgeId: [
    { required: true, message: '请选择关联的知识文章', trigger: 'change' },
  ],
  title: [
    { required: true, message: '请输入心得标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应在2-50个字符之间', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入心得内容', trigger: 'blur' },
    { min: 10, message: '内容不能少于10个字符', trigger: 'blur' },
  ],
})

// 当对话框可见时，加载数据
watch(() => props.visible, async (visible) => {
  if (visible) {
    // 如果是编辑模式，加载表单数据
    if (isEdit.value) {
      form.title = props.experience?.title || ''
      form.content = props.experience?.content || ''
      form.knowledgeId = props.experience?.knowledgeId || 0
    }
    else {
      // 新建模式，如果没有固定的knowledgeId，加载知识文章列表
      if (!knowledgeIdFixed.value) {
        await loadKnowledgeOptions()
      }
      else {
        form.knowledgeId = props.knowledgeId || 0
      }
      form.title = ''
      form.content = ''
    }
  }
})

// 加载知识选项
const loadKnowledgeOptions = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const response = await knowledgeService.getKnowledgeList()
    knowledgeOptions.value = response.data.map(item => ({
      value: item.knowledgeId,
      label: item.introduction,
    }))
  }
  catch (error) {
    errorMessage.value = '加载知识文章列表失败，请重试'
    console.error('加载知识选项失败:', error)
  }
  finally {
    loading.value = false
  }
}

// 创建心得
const createExperience = async () => {
  try {
    submitting.value = true
    errorMessage.value = ''

    const createData: CreateExperienceParams = {
      knowledgeId: form.knowledgeId,
      title: form.title,
      content: form.content,
    }

    const response = await experienceService.createExperience(createData)
    ElMessage.success('学习心得提交成功，等待审核')
    emit('created', response.data)
    dialogVisible.value = false
  }
  catch (error) {
    errorMessage.value = '提交学习心得失败，请重试'
    console.error('创建心得失败:', error)
  }
  finally {
    submitting.value = false
  }
}

// 更新心得
const updateExperience = async () => {
  if (!props.experience) { return }

  try {
    submitting.value = true
    errorMessage.value = ''

    const updateData: UpdateExperienceParams = {
      content: form.content,
    }

    const response = await experienceService.updateExperience(
      props.experience.experienceId,
      updateData,
    )

    ElMessage.success('学习心得更新成功，等待审核')
    emit('updated', response.data)
    dialogVisible.value = false
  }
  catch (error) {
    errorMessage.value = '更新学习心得失败，请重试'
    console.error('更新心得失败:', error)
  }
  finally {
    submitting.value = false
  }
}

// 提交表单
const handleSubmit = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        await updateExperience()
      }
      else {
        await createExperience()
      }
    }
    else {
      ElMessage.warning('请完成必填项')
    }
  })
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

// 初始化
onMounted(async () => {
  if (props.visible && !isEdit.value && !knowledgeIdFixed.value) {
    await loadKnowledgeOptions()
  }
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑学习心得' : '分享学习心得'"
    width="60%"
    :before-close="handleClose"
  >
    <div v-if="loading" class="editor-loading">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else>
      <div v-if="errorMessage" class="error-message">
        <el-alert type="error" :title="errorMessage" :closable="false" show-icon />
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="experience-form">
        <el-form-item
          v-if="!isEdit && knowledgeOptions.length > 0"
          label="关联知识文章"
          prop="knowledgeId"
        >
          <el-select
            v-model="form.knowledgeId"
            placeholder="请选择关联的知识文章"
            style="width: 100%"
            :disabled="knowledgeIdFixed"
          >
            <el-option
              v-for="item in knowledgeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="心得标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入心得标题"
            class="title-input"
          />
        </el-form-item>

        <el-form-item label="心得内容" prop="content">
          <el-alert
            v-if="isEdit && experience?.status === 'rejected'"
            type="warning"
            title="驳回原因"
            :description="experience?.reviewComments"
            :closable="false"
            show-icon
            class="rejection-reason"
          />

          <el-input
            v-model="form.content"
            type="textarea"
            :autosize="{ minRows: 5, maxRows: 12 }"
            placeholder="请分享您对这篇文章的心得体会..."
            class="content-textarea"
          />
        </el-form-item>
      </el-form>

      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '更新' : '提交' }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

  <style scoped>
  .experience-form {
  margin: 16px 0;
}

.editor-loading {
  padding: 20px;
}

.error-message {
  margin-bottom: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  gap: 12px;
}

.content-textarea {
  margin-top: 8px;
}

.rejection-reason {
  margin-bottom: 16px;
}

.title-input {
  margin-top: 8px;
}
</style>
