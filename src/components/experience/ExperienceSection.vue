<script setup lang="ts">
import type { ExperienceItem, PaginationData } from '@/types'
import { ElMessage } from 'element-plus'
import { computed, defineProps, onMounted, ref, watch } from 'vue'
import { experienceService } from '@/services'
import { useUserStore } from '@/stores/modules/user'
import ExperienceEditor from './ExperienceEditor.vue'
import ExperienceList from './ExperienceList.vue'

const props = defineProps<{
  knowledgeId: number
}>()

// 状态管理
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isAuthenticated)

// UI状态
const loading = ref(false)
const errorMessage = ref('')
const editorVisible = ref(false)
const deleteDialogVisible = ref(false)
const deleting = ref(false)

// 数据状态
const experiences = ref<ExperienceItem[]>([])
const pagination = ref<PaginationData>({
  total: 0,
  current: 1,
  pageSize: 10,
  totalPages: 0,
  hasMore: false,
})
const selectedExperience = ref<ExperienceItem | undefined>(undefined)
const experienceIdToDelete = ref<number | null>(null)

// 监听知识ID变化，重新加载心得
watch(() => props.knowledgeId, (newId) => {
  if (newId) {
    loadExperiences()
  }
})

// 加载知识文章相关的学习心得
const loadExperiences = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const response = await experienceService.getKnowledgeExperiences(
      props.knowledgeId,
      {
        page: pagination.value.current,
        pageSize: pagination.value.pageSize,
      },
    )

    experiences.value = response.data
    pagination.value = response.pagination
  }
  catch (error) {
    errorMessage.value = '加载学习心得失败，请重试'
    console.error('加载学习心得失败:', error)
  }
  finally {
    loading.value = false
  }
}

// 处理页面变化
const handlePageChange = (page: number) => {
  pagination.value.current = page
  loadExperiences()
}

// 打开创建对话框
const openCreateDialog = () => {
  selectedExperience.value = undefined // 确保不是编辑模式
  editorVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (experience: ExperienceItem) => {
  selectedExperience.value = experience
  editorVisible.value = true
}

// 处理删除点击
const handleDelete = (experience: ExperienceItem) => {
  experienceIdToDelete.value = experience.experienceId
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!experienceIdToDelete.value) { return }

  try {
    deleting.value = true

    await experienceService.deleteExperience(experienceIdToDelete.value)
    ElMessage.success('学习心得已删除')

    // 刷新列表
    loadExperiences()
    deleteDialogVisible.value = false
  }
  catch (error) {
    ElMessage.error('删除失败，请重试')
    console.error('删除心得失败:', error)
  }
  finally {
    deleting.value = false
    experienceIdToDelete.value = null
  }
}

// 处理心得创建成功
const handleExperienceCreated = () => {
  loadExperiences()
}

// 处理心得更新成功
const handleExperienceUpdated = () => {
  loadExperiences()
}

// 初始化
onMounted(() => {
  if (props.knowledgeId) {
    loadExperiences()
  }
})
</script>

<template>
  <div class="experience-section">
    <ExperienceList
      :experiences="experiences"
      :pagination="pagination"
      :loading="loading"
      :error-message="errorMessage"
      :can-create="isLoggedIn"
      @pageChange="handlePageChange"
      @create="openCreateDialog"
      @edit="openEditDialog"
      @delete="handleDelete"
    />

    <ExperienceEditor
      v-model:visible="editorVisible"
      :knowledge-id="knowledgeId"
      :experience="selectedExperience"
      @created="handleExperienceCreated"
      @updated="handleExperienceUpdated"
    />

    <el-dialog
      v-model="deleteDialogVisible"
      title="删除确认"
      width="30%"
    >
      <span>确定要删除这条学习心得吗？此操作不可撤销。</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" :loading="deleting" @click="confirmDelete">确定删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.experience-section {
  margin-top: 32px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
