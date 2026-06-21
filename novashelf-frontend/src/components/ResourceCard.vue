<script setup>
import { computed, ref, watch } from 'vue';
import { Download, Eye, Image as ImageIcon, MessageSquare, Star } from 'lucide-vue-next';
import { getCategoryLabel } from '../constants';

const props = defineProps({
  resource: {
    type: Object,
    required: true
  }
});

const tags = computed(() => {
  return String(props.resource.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 3);
});

const coverFailed = ref(false);
const coverSrc = computed(() => String(props.resource.cover || '').trim());
const shouldShowCover = computed(() => coverSrc.value && !coverFailed.value);
const displayCategory = computed(() => getCategoryLabel(props.resource.category));

watch(coverSrc, () => {
  coverFailed.value = false;
});
</script>

<template>
  <article class="resource-card">
    <RouterLink class="cover-link" :to="`/resources/${resource.id}`">
      <img
        v-if="shouldShowCover"
        :src="coverSrc"
        :alt="resource.title"
        loading="lazy"
        @error="coverFailed = true"
      />
      <div v-else class="cover-placeholder" aria-hidden="true">
        <ImageIcon :size="30" />
        <span>{{ displayCategory || 'Nova Shelf' }}</span>
      </div>
    </RouterLink>

    <div class="resource-card-body">
      <div class="resource-meta-row">
        <span class="category-pill">{{ displayCategory }}</span>
        <span class="metric">
          <Star :size="15" />
          {{ Number(resource.average_score || 0).toFixed(1) }}
        </span>
      </div>

      <RouterLink class="resource-title" :to="`/resources/${resource.id}`">
        {{ resource.title }}
      </RouterLink>

      <p>{{ resource.description }}</p>

      <div class="tag-row" aria-label="素材标签">
        <span v-for="tag in tags" :key="tag">{{ tag }}</span>
      </div>

      <div class="card-footer">
        <span class="metric">
          <Eye :size="15" />
          {{ resource.view_count || 0 }}
        </span>
        <span class="metric">
          <MessageSquare :size="15" />
          {{ resource.comment_count || 0 }}
        </span>
        <a class="icon-button" :href="resource.download_url" target="_blank" rel="noreferrer" title="打开资料链接">
          <Download :size="17" />
        </a>
      </div>
    </div>
  </article>
</template>
