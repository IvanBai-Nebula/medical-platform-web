<script setup lang="ts">
import type { ExperienceItem, PaginationData } from '@/types'
import { useUserStore } from '@/stores/modules/user'

const props = defineProps<{
  experiences: ExperienceItem[]
  pagination: PaginationData
  loading: boolean
  errorMessage: string
  canCreate?: boolean
}>()

const emit = defineEmits<{
  (e: 'pageChange', page: number): void
  (e: 'create'): void
  (e: 'edit', experience: ExperienceItem): void
  (e: 'delete', experience: ExperienceItem): void
}>()

const userStore = useUserStore()

const isOwner = (experience: ExperienceItem): boolean => {
  const currentUser = userStore.currentUser
  if (!currentUser) { return false }

  // 根据用户类型判断
  if ('userId' in currentUser) {
    return currentUser.userId === experience.userId
  }

  // 管理员可以看到所有操作
  if ('adminId' in currentUser) {
    return true
  }

  return false
}

const handlePageChange = (page: number) => {
  emit('pageChange', page)
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="mt-20px">
    <div v-if="loading" class="p-20px flex flex-col items-center gap-16px">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="errorMessage" class="my-20px">
      <el-alert type="error" :title="errorMessage" :closable="false" show-icon />
    </div>

    <div v-else-if="experiences.length === 0" class="p-20px flex flex-col items-center gap-16px">
      <el-empty description="暂无学习心得" />
      <el-button v-if="canCreate" type="primary" @click="emit('create')">
        分享我的学习心得
      </el-button>
    </div>

    <div v-else class="experiences-container">
      <div class="experiences-header">
        <h3 class="section-title">学习心得 ({{ pagination.total }})</h3>
        <el-button v-if="canCreate" type="primary" @click="emit('create')">
          分享我的学习心得
        </el-button>
      </div>

      <div class="experiences-content">
        <div v-for="item in experiences" :key="item.experienceId" class="experience-item">
          <div class="experience-header">
            <div class="user-info">
              <el-avatar :src="item.avatar" :size="36">
                {{ item.username?.substring(0, 1) }}
              </el-avatar>
              <span class="username">{{ item.username }}</span>
              <el-tag v-if="item.status === 'approved'" type="success" size="small">已通过</el-tag>
              <el-tag v-if="item.status === 'pending'" type="warning" size="small">待审核</el-tag>
              <el-tag v-if="item.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
            </div>
            <span class="experience-time">{{ formatDate(item.createdAt) }}</span>
          </div>

          <div class="experience-content" v-html="item.content" />

          <div v-if="item.status === 'rejected'" class="review-comment">
            <div class="review-header">
              <span class="review-title">驳回理由:</span>
              <span class="reviewer">审核人: {{ item.reviewerName }}</span>
            </div>
            <div class="review-content">{{ item.reviewComments }}</div>
          </div>

          <div v-if="isOwner(item)" class="experience-actions">
            <el-button
              v-if="item.status !== 'approved'"
              type="primary"
              text
              @click="emit('edit', item)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              text
              @click="emit('delete', item)"
            >
              删除
            </el-button>
          </div>
        </div>

        <el-pagination
          v-if="pagination.totalPages > 1"
          layout="prev, pager, next"
          :total="pagination.total"
          :current-page="pagination.current"
          :page-size="pagination.pageSize"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>
