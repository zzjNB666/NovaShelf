<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Download, Eye, Image as ImageIcon, MessageSquare, Send, Star } from 'lucide-vue-next';
import CommentList from '../components/CommentList.vue';
import StarRating from '../components/StarRating.vue';
import { getCategoryLabel } from '../constants';
import { authState } from '../stores/auth';
import {
  createComment,
  deleteComment,
  getComments,
  getRating,
  getResource,
  submitRating
} from '../api/resources';

const route = useRoute();
const router = useRouter();
const resource = ref(null);
const comments = ref([]);
const rating = ref({ average_score: 0, rating_count: 0, user_score: null });
const score = ref(0);
const commentText = ref('');
const loading = ref(false);
const error = ref('');
const coverFailed = ref(false);

const coverSrc = computed(() => String(resource.value?.cover || '').trim());
const shouldShowCover = computed(() => coverSrc.value && !coverFailed.value);
const displayCategory = computed(() => getCategoryLabel(resource.value?.category));
const tags = computed(() => {
  return String(resource.value?.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
});

async function loadDetail() {
  loading.value = true;
  error.value = '';
  try {
    const [resourceRes, commentsRes, ratingRes] = await Promise.all([
      getResource(route.params.id),
      getComments(route.params.id),
      getRating(route.params.id)
    ]);
    resource.value = resourceRes.data.data;
    coverFailed.value = false;
    comments.value = commentsRes.data.data;
    rating.value = ratingRes.data.data;
    score.value = rating.value.user_score || 0;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleRating(value) {
  if (!authState.user) {
    router.push('/login');
    return;
  }
  score.value = value;
  const res = await submitRating(route.params.id, value);
  rating.value = res.data.data;
}

async function handleComment() {
  if (!authState.user) {
    router.push('/login');
    return;
  }
  const content = commentText.value.trim();
  if (!content) return;
  await createComment(route.params.id, { content });
  commentText.value = '';
  const res = await getComments(route.params.id);
  comments.value = res.data.data;
}

async function handleDeleteComment(comment) {
  await deleteComment(comment.id);
  comments.value = comments.value.filter((item) => item.id !== comment.id);
}

onMounted(loadDetail);
</script>

<template>
  <p v-if="error" class="error-text">{{ error }}</p>
  <p v-else-if="loading || !resource" class="empty-text">正在加载详情...</p>

  <template v-else>
    <section class="detail-layout">
      <div class="detail-cover">
        <img v-if="shouldShowCover" :src="coverSrc" :alt="resource.title" @error="coverFailed = true" />
        <div v-else class="cover-placeholder large" aria-hidden="true">
          <ImageIcon :size="42" />
          <span>{{ displayCategory || 'Nova Shelf' }}</span>
        </div>
      </div>

      <div class="detail-main">
        <div class="resource-meta-row">
          <span class="category-pill">{{ displayCategory }}</span>
          <span class="metric">
            <Eye :size="16" />
            {{ resource.view_count }}
          </span>
        </div>
        <h1>{{ resource.title }}</h1>
        <p class="detail-description">{{ resource.description }}</p>

        <div class="tag-row">
          <span v-for="tag in tags" :key="tag">{{ tag }}</span>
        </div>

        <div class="detail-actions">
          <a class="button primary" :href="resource.download_url" target="_blank" rel="noreferrer">
            <Download :size="18" />
            <span>打开资料</span>
          </a>
        </div>
      </div>

      <aside class="rating-panel">
        <div class="rating-score">
          <Star :size="24" />
          <strong>{{ Number(rating.average_score || 0).toFixed(1) }}</strong>
          <span>{{ rating.rating_count }} 人标记</span>
        </div>
        <StarRating :model-value="score" @update:model-value="handleRating" />
      </aside>
    </section>

    <section class="comments-section">
      <div class="section-title-row">
        <h2>资料反馈</h2>
        <span class="metric">
          <MessageSquare :size="16" />
          {{ comments.length }}
        </span>
      </div>

      <form class="comment-form" @submit.prevent="handleComment">
        <textarea v-model="commentText" rows="3" placeholder="记录使用体验、补充说明或整理建议" />
        <button class="button primary" type="submit">
          <Send :size="17" />
          <span>提交反馈</span>
        </button>
      </form>

      <CommentList :comments="comments" :current-user="authState.user" @delete="handleDeleteComment" />
    </section>
  </template>
</template>
