<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { BarChart3, ChevronLeft, ChevronRight, MessageSquare, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-vue-next';
import AdminResourceForm from '../components/AdminResourceForm.vue';
import { getCategoryLabel } from '../constants';
import { authState } from '../stores/auth';
import {
  createResource,
  deleteComment,
  deleteResource,
  getResources,
  normalizeResourceResponse,
  updateResource
} from '../api/resources';
import { getAdminComments, getStats, getUsers, updateUserRole } from '../api/admin';

const tabs = [
  { key: 'resources', label: '素材编排', icon: Plus },
  { key: 'users', label: '成员权限', icon: Users },
  { key: 'comments', label: '反馈审核', icon: MessageSquare },
  { key: 'stats', label: '数据看板', icon: BarChart3 }
];

const activeTab = ref('resources');
const resources = ref([]);
const users = ref([]);
const comments = ref([]);
const stats = ref(null);
const editing = ref(null);
const formOpen = ref(false);
const error = ref('');
const loading = ref(false);
const saving = ref(false);
const lastSyncedAt = ref('');
let refreshTimer = null;

const resourceQuery = reactive({
  page: 1,
  pageSize: 10,
  sortBy: 'created_at',
  order: 'desc'
});

const resourcePagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
});

const isAdmin = computed(() => authState.user?.role === 'admin');
const canLoadAdminData = computed(() => authState.ready && isAdmin.value);

async function loadResourcesForAdmin() {
  const resourceRes = await getResources({
    page: resourceQuery.page,
    pageSize: resourceQuery.pageSize,
    sortBy: resourceQuery.sortBy,
    order: resourceQuery.order
  });
  const payload = normalizeResourceResponse(resourceRes);
  resources.value = payload.items;
  Object.assign(resourcePagination, payload.pagination);
}

async function loadAll() {
  if (!canLoadAdminData.value || loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    const [userRes, commentRes, statsRes] = await Promise.all([
      getUsers(),
      getAdminComments(),
      getStats()
    ]);
    await loadResourcesForAdmin();
    users.value = userRes.data.data;
    comments.value = commentRes.data.data;
    stats.value = statsRes.data.data;
    lastSyncedAt.value = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function startCreate() {
  editing.value = null;
  formOpen.value = true;
  activeTab.value = 'resources';
}

function startEdit(resource) {
  editing.value = resource;
  formOpen.value = true;
  activeTab.value = 'resources';
}

async function saveResource(payload) {
  saving.value = true;
  error.value = '';
  try {
    if (editing.value) {
      await updateResource(editing.value.id, payload);
    } else {
      await createResource(payload);
      resourceQuery.page = 1;
    }
    formOpen.value = false;
    editing.value = null;
    await loadAll();
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function removeResource(resource) {
  if (!window.confirm(`移除素材「${resource.title}」？`)) return;
  await deleteResource(resource.id);
  if (resources.value.length === 1 && resourceQuery.page > 1) {
    resourceQuery.page -= 1;
  }
  await loadAll();
}

async function removeComment(comment) {
  if (!window.confirm('删除这条反馈？')) return;
  await deleteComment(comment.id);
  await loadAll();
}

async function changeRole(user) {
  await updateUserRole(user.id, user.role);
  await loadAll();
}

function changeResourcePage(page) {
  if (page < 1 || page > resourcePagination.totalPages || page === resourceQuery.page) return;
  resourceQuery.page = page;
  loadAll();
}

function resetResourceSort() {
  resourceQuery.page = 1;
  loadAll();
}

function formatDate(value) {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

watch(canLoadAdminData, (ready) => {
  if (ready) {
    loadAll();
  }
});

onMounted(() => {
  loadAll();
  refreshTimer = window.setInterval(() => {
    if (!formOpen.value) {
      loadAll();
    }
  }, 10000);
});

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer);
});
</script>

<template>
  <section v-if="!authState.ready" class="auth-layout">
    <div class="auth-form">
      <h1>控制台</h1>
      <p class="empty-text">正在恢复登录状态...</p>
    </div>
  </section>

  <section v-else-if="!isAdmin" class="auth-layout">
    <div class="auth-form">
      <h1>控制台</h1>
      <p class="empty-text">当前账号没有管理员权限</p>
      <RouterLink class="button primary" to="/login">登录管理员账号</RouterLink>
    </div>
  </section>

  <template v-else>
    <section class="workspace-head admin-command-head">
      <div>
        <span class="eyebrow">Console</span>
        <h1>素材控制台</h1>
        <p>编排素材条目、成员权限、反馈内容和访问数据。</p>
      </div>
      <div class="admin-head-actions">
        <span v-if="lastSyncedAt" class="signal-chip">上次同步 {{ lastSyncedAt }}</span>
        <button class="button ghost" type="button" @click="loadAll">
          <RefreshCw :size="16" />
          <span>{{ loading ? '同步中' : '同步' }}</span>
        </button>
        <button class="button primary" type="button" @click="startCreate">
          <Plus :size="17" />
          <span>新增素材</span>
        </button>
      </div>
    </section>

    <section class="filter-row admin-tabs" aria-label="管理标签">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="segmented-item"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </section>

    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-else-if="loading && !resources.length" class="empty-text">正在加载控制台数据...</p>

    <AdminResourceForm
      v-if="formOpen"
      :value="editing"
      :saving="saving"
      @save="saveResource"
      @cancel="formOpen = false"
    />

    <section v-if="activeTab === 'resources'" class="admin-panel">
      <div class="table-toolbar">
        <label class="inline-control">
          <span>排序</span>
          <select v-model="resourceQuery.sortBy" @change="resetResourceSort">
            <option value="created_at">发布时间</option>
            <option value="view_count">访问量</option>
            <option value="rating">评分</option>
            <option value="title">标题</option>
          </select>
        </label>
        <label class="inline-control">
          <span>方向</span>
          <select v-model="resourceQuery.order" @change="resetResourceSort">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </label>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>素材类型</th>
              <th>标记</th>
              <th>热度</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="resource in resources" :key="resource.id">
              <td>{{ resource.title }}</td>
              <td>{{ getCategoryLabel(resource.category) }}</td>
              <td>{{ Number(resource.average_score || 0).toFixed(1) }}</td>
              <td>{{ resource.view_count }}</td>
              <td class="table-actions">
                <button class="icon-button" type="button" title="编辑素材" @click="startEdit(resource)">
                  <Pencil :size="16" />
                </button>
                <button class="icon-button danger" type="button" title="移除素材" @click="removeResource(resource)">
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="resourcePagination.totalPages > 1" class="pagination-bar" aria-label="控制台素材分页">
        <button class="button ghost compact" type="button" :disabled="resourcePagination.page <= 1" @click="changeResourcePage(resourcePagination.page - 1)">
          <ChevronLeft :size="16" />
          <span>上一页</span>
        </button>
        <span>第 {{ resourcePagination.page }} / {{ resourcePagination.totalPages }} 页，共 {{ resourcePagination.total }} 条</span>
        <button class="button ghost compact" type="button" :disabled="resourcePagination.page >= resourcePagination.totalPages" @click="changeResourcePage(resourcePagination.page + 1)">
          <span>下一页</span>
          <ChevronRight :size="16" />
        </button>
      </nav>
    </section>

    <section v-if="activeTab === 'users'" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>用户名</th>
            <th>角色</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>
              <select v-model="user.role" :disabled="user.id === authState.user?.id" @change="changeRole(user)">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="activeTab === 'comments'" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>素材</th>
            <th>用户</th>
            <th>反馈内容</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comment in comments" :key="comment.id">
            <td>{{ comment.resource_title }}</td>
            <td>{{ comment.username }}</td>
            <td>{{ comment.content }}</td>
            <td>
              <button class="icon-button danger" type="button" title="删除反馈" @click="removeComment(comment)">
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="activeTab === 'stats' && stats" class="stats-dashboard">
      <div class="stats-strip">
        <div>
          <strong>{{ stats.resource_count }}</strong>
          <span>素材</span>
        </div>
        <div>
          <strong>{{ stats.user_count }}</strong>
          <span>用户</span>
        </div>
        <div>
          <strong>{{ stats.comment_count }}</strong>
          <span>反馈</span>
        </div>
        <div>
          <strong>{{ stats.total_views }}</strong>
          <span>访问</span>
        </div>
      </div>
      <div class="stats-columns">
        <div class="table-wrap">
          <h2>素材类型分布</h2>
          <table>
            <tbody>
              <tr v-for="item in stats.by_category" :key="item.category">
                <td>{{ getCategoryLabel(item.category) }}</td>
                <td>{{ item.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-wrap">
          <h2>访问排行</h2>
          <table>
            <tbody>
              <tr v-for="item in stats.top_resources" :key="item.id">
                <td>{{ item.title }}</td>
                <td>{{ item.view_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </template>
</template>
