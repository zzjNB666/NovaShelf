<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-vue-next';
import ResourceCard from '../components/ResourceCard.vue';
import { categoryOptions } from '../constants';
import { getResources, normalizeResourceResponse } from '../api/resources';

const resources = ref([]);
const loading = ref(false);
const error = ref('');
const lastSyncedAt = ref('');
let refreshTimer = null;

const filters = reactive({
  keyword: '',
  category: '',
  sortBy: 'created_at',
  order: 'desc',
  page: 1,
  pageSize: 8
});

const pagination = reactive({
  page: 1,
  pageSize: 8,
  total: 0,
  totalPages: 1
});

const totalViews = computed(() => resources.value.reduce((sum, item) => sum + Number(item.view_count || 0), 0));
const avgScore = computed(() => {
  if (!resources.value.length) return '0.0';
  const total = resources.value.reduce((sum, item) => sum + Number(item.average_score || 0), 0);
  return (total / resources.value.length).toFixed(1);
});

async function loadResources({ silent = false } = {}) {
  if (!silent) {
    loading.value = true;
  }
  error.value = '';
  try {
    const res = await getResources({
      keyword: filters.keyword || undefined,
      category: filters.category || undefined,
      sortBy: filters.sortBy,
      order: filters.order,
      page: filters.page,
      pageSize: filters.pageSize
    });
    const payload = normalizeResourceResponse(res);
    resources.value = payload.items;
    Object.assign(pagination, payload.pagination);
    lastSyncedAt.value = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (err) {
    error.value = err.message;
  } finally {
    if (!silent) {
      loading.value = false;
    }
  }
}

function resetAndLoad() {
  filters.page = 1;
  loadResources();
}

function selectCategory(category) {
  filters.category = filters.category === category ? '' : category;
  resetAndLoad();
}

function changePage(page) {
  if (page < 1 || page > pagination.totalPages || page === filters.page) return;
  filters.page = page;
  loadResources();
}

onMounted(() => {
  loadResources();
  refreshTimer = window.setInterval(() => {
    loadResources({ silent: true });
  }, 8000);
});

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer);
});
</script>

<template>
  <section class="workspace-head">
    <div>
      <span class="eyebrow">Nova Shelf</span>
      <h1>创作灵感资料台</h1>
      <p>集中整理互动剧本、视觉设定、创作工具和声音素材，快速进入可用资料。</p>
    </div>
    <form class="search-bar" @submit.prevent="resetAndLoad">
      <Search :size="19" />
      <input v-model.trim="filters.keyword" placeholder="搜索素材标题、标签或摘要" />
      <button class="button primary" type="submit">
        <Search :size="17" />
        <span>搜索</span>
      </button>
    </form>
  </section>

  <section class="stats-strip" aria-label="素材统计">
    <div>
      <strong>{{ pagination.total }}</strong>
      <span>素材总量</span>
    </div>
    <div>
      <strong>{{ totalViews }}</strong>
      <span>本页热度</span>
    </div>
    <div>
      <strong>{{ avgScore }}</strong>
      <span>灵感评分</span>
    </div>
  </section>

  <div class="live-sync-row" aria-label="实时同步状态">
    <span class="signal-chip">Auto Sync</span>
    <span>每 8 秒同步当前资料视图</span>
    <time v-if="lastSyncedAt">上次同步 {{ lastSyncedAt }}</time>
  </div>

  <section class="filter-row" aria-label="素材类型">
    <button
      class="segmented-item"
      :class="{ active: !filters.category }"
      type="button"
      @click="selectCategory('')"
    >
      全部
    </button>
    <button
      v-for="category in categoryOptions"
      :key="category.value"
      class="segmented-item"
      :class="{ active: filters.category === category.value }"
      type="button"
      @click="selectCategory(category.value)"
    >
      {{ category.label }}
    </button>
    <label class="inline-control">
      <span>排序</span>
      <select v-model="filters.sortBy" @change="resetAndLoad">
        <option value="created_at">发布时间</option>
        <option value="view_count">访问量</option>
        <option value="rating">评分</option>
        <option value="title">标题</option>
      </select>
    </label>
    <label class="inline-control">
      <span>方向</span>
      <select v-model="filters.order" @change="resetAndLoad">
        <option value="desc">降序</option>
        <option value="asc">升序</option>
      </select>
    </label>
    <button class="button ghost compact" type="button" @click="loadResources">
      <RefreshCw :size="16" />
      <span>刷新</span>
    </button>
  </section>

  <p v-if="error" class="error-text">{{ error }}</p>
  <p v-else-if="loading" class="empty-text">正在加载素材...</p>

  <template v-else>
    <section class="resource-grid" aria-label="素材列表">
      <ResourceCard v-for="item in resources" :key="item.id" :resource="item" />
      <p v-if="!resources.length" class="empty-text">没有找到匹配素材</p>
    </section>

    <nav v-if="pagination.totalPages > 1" class="pagination-bar" aria-label="分页">
      <button class="button ghost compact" type="button" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">
        <ChevronLeft :size="16" />
        <span>上一页</span>
      </button>
      <span>第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共 {{ pagination.total }} 条</span>
      <button class="button ghost compact" type="button" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">
        <span>下一页</span>
        <ChevronRight :size="16" />
      </button>
    </nav>
  </template>
</template>
