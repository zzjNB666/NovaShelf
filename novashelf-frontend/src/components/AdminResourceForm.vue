<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ImagePlus, Save, X } from 'lucide-vue-next';
import { categories, categoryOptions } from '../constants';
import { uploadCover } from '../api/resources';

const props = defineProps({
  value: {
    type: Object,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['save', 'cancel']);
const uploading = ref(false);
const localError = ref('');

const form = reactive({
  title: '',
  cover: '',
  category: '互动剧本',
  tags: '',
  description: '',
  download_url: ''
});

const isEditing = computed(() => Boolean(props.value?.id));

watch(
  () => props.value,
  (value) => {
    localError.value = '';
    Object.assign(form, {
      title: value?.title || '',
      cover: value?.cover || '',
      category: value?.category || '互动剧本',
      tags: value?.tags || '',
      description: value?.description || '',
      download_url: value?.download_url || ''
    });
  },
  { immediate: true }
);

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (err) {
    return false;
  }
}

function validate() {
  if (form.title.trim().length < 2) return '标题至少需要 2 个字符';
  if (!categories.includes(form.category)) return '请选择有效分类';
  if (!form.description.trim()) return '描述不能为空';
  if (!isHttpUrl(form.download_url.trim())) return '资料入口必须是有效的 http 或 https 地址';
  if (form.cover.trim() && !isHttpUrl(form.cover.trim()) && !form.cover.trim().startsWith('/uploads/')) {
    return '封面链接必须是有效图片地址，或使用上传后的封面路径';
  }
  return '';
}

async function handleCoverUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  localError.value = '';

  if (!file.type.startsWith('image/')) {
    localError.value = '只能上传图片文件';
    event.target.value = '';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    localError.value = '图片不能超过 2MB';
    event.target.value = '';
    return;
  }

  uploading.value = true;
  try {
    const res = await uploadCover(file);
    form.cover = res.data.data.url;
  } catch (err) {
    localError.value = err.message;
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
}

function submit() {
  const error = validate();
  if (error) {
    localError.value = error;
    return;
  }

  localError.value = '';
  emit('save', {
    title: form.title.trim(),
    cover: form.cover.trim(),
    category: form.category,
    tags: form.tags.trim(),
    description: form.description.trim(),
    download_url: form.download_url.trim()
  });
}
</script>

<template>
  <form class="admin-form" @submit.prevent="submit">
    <div class="form-header">
      <div>
        <h2>{{ isEditing ? '编辑素材' : '新增素材' }}</h2>
        <p>填写素材卡片信息，支持上传本地封面图。</p>
      </div>
      <button class="button ghost compact" type="button" @click="emit('cancel')">
        <X :size="17" />
        <span>关闭</span>
      </button>
    </div>

    <p v-if="localError" class="error-text">{{ localError }}</p>

    <div class="form-grid">
      <label>
        <span>素材标题</span>
        <input v-model.trim="form.title" required maxlength="100" />
      </label>
      <label>
        <span>素材类型</span>
        <select v-model="form.category">
          <option v-for="category in categoryOptions" :key="category.value" :value="category.value">{{ category.label }}</option>
        </select>
      </label>
      <label class="wide">
        <span>封面图链接</span>
        <input v-model.trim="form.cover" placeholder="https://... 或 /uploads/xxx.jpg" />
      </label>
      <label class="wide upload-row">
        <span>上传封面图</span>
        <input type="file" accept="image/*" @change="handleCoverUpload" />
        <small>{{ uploading ? '上传中...' : '支持 jpg、png、webp、gif，最大 2MB' }}</small>
      </label>
      <label class="wide">
        <span>标签</span>
        <input v-model.trim="form.tags" placeholder="灵感,结构,工具" maxlength="255" />
      </label>
      <label class="wide">
        <span>资料入口</span>
        <input v-model.trim="form.download_url" placeholder="https://..." required />
      </label>
      <label class="wide">
        <span>素材摘要</span>
        <textarea v-model.trim="form.description" rows="4" maxlength="5000" required />
      </label>
    </div>

    <div class="form-actions">
      <button class="button primary" type="submit" :disabled="saving || uploading">
        <Save :size="17" />
        <span>{{ saving ? '保存中' : '保存素材' }}</span>
      </button>
      <label class="button ghost file-button">
        <ImagePlus :size="17" />
        <span>{{ uploading ? '上传中' : '上传封面图' }}</span>
        <input type="file" accept="image/*" @change="handleCoverUpload" />
      </label>
    </div>
  </form>
</template>
