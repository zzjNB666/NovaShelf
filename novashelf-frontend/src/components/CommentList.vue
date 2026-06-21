<script setup>
import { computed } from 'vue';
import { Trash2 } from 'lucide-vue-next';

const props = defineProps({
  comments: {
    type: Array,
    default: () => []
  },
  currentUser: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['delete']);

const canDelete = computed(() => (comment) => {
  if (!props.currentUser) return false;
  return props.currentUser.role === 'admin' || props.currentUser.id === comment.user_id;
});

function formatDate(value) {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<template>
  <div class="comment-list">
    <p v-if="!comments.length" class="empty-text">暂无反馈</p>
    <article v-for="comment in comments" :key="comment.id" class="comment-item">
      <img :src="comment.avatar" :alt="comment.username" />
      <div>
        <div class="comment-head">
          <strong>{{ comment.username }}</strong>
          <time>{{ formatDate(comment.created_at) }}</time>
          <button
            v-if="canDelete(comment)"
            class="icon-button danger"
            type="button"
            title="删除反馈"
            @click="emit('delete', comment)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
        <p>{{ comment.content }}</p>
      </div>
    </article>
  </div>
</template>
