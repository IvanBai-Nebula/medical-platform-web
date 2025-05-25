<script setup lang="ts">
defineProps<{
  title: string
  summary: string
  date: string
  author: string
  type: 'knowledge' | 'experience'
}>()
</script>

<template>
  <div class="content-card" :class="`type-${type}`">
    <div class="content-header">
      <h4 class="content-title">{{ title }}</h4>
      <span class="content-type">{{ type === 'knowledge' ? '知识' : '经验' }}</span>
    </div>
    <p class="content-summary">{{ summary }}</p>
    <div class="content-meta">
      <span class="content-author">{{ author }}</span>
      <span class="content-date">{{ date }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  padding: 20px;
  @include transition(all);
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    @include box-shadow(var(--shadow-md));
    border-color: var(--color-primary);
  }

  &.type-knowledge {
    border-left: 4px solid var(--color-medical-blue);

    .content-type {
      background: var(--color-medical-blue);
      color: #ffffff;
    }
  }

  &.type-experience {
    border-left: 4px solid var(--color-medical-green);

    .content-type {
      background: var(--color-medical-green);
      color: #ffffff;
    }
  }
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.content-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.content-type {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 12px;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  @include transition(all);
}

.content-summary {
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.content-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--color-text-muted);
}

.content-author {
  font-weight: 500;
}

.content-date {
  opacity: 0.8;
}
</style>
