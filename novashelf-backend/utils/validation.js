const categories = ['互动剧本', '叙事文本', '视觉设定', '创作工具', '声音素材', '灵感备忘'];
const sortFields = ['created_at', 'view_count', 'rating', 'title'];
const sortOrders = ['asc', 'desc'];

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (err) {
    return false;
  }
}

function isLocalUpload(value) {
  return typeof value === 'string' && value.startsWith('/uploads/');
}

function cleanString(value, maxLength) {
  const text = String(value || '').trim();
  return maxLength ? text.slice(0, maxLength) : text;
}

function parsePositiveInteger(value, fallback, { min = 1, max = 100 } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function parsePagination(query) {
  const page = parsePositiveInteger(query.page, 1, { min: 1, max: 9999 });
  const pageSize = parsePositiveInteger(query.pageSize, 8, { min: 1, max: 50 });
  return { page, pageSize };
}

function parseSort(query) {
  const sortBy = sortFields.includes(query.sortBy) ? query.sortBy : 'created_at';
  const order = sortOrders.includes(String(query.order || '').toLowerCase())
    ? String(query.order).toLowerCase()
    : 'desc';
  return { sortBy, order };
}

function validateResourcePayload(body) {
  const payload = {
    title: cleanString(body.title, 100),
    cover: cleanString(body.cover, 255),
    category: cleanString(body.category || '灵感备忘', 50),
    tags: cleanString(body.tags, 255),
    description: cleanString(body.description, 5000),
    download_url: cleanString(body.download_url, 255)
  };

  if (payload.title.length < 2) {
    return { error: '素材标题至少需要 2 个字符' };
  }

  if (!categories.includes(payload.category)) {
    return { error: '请选择有效的素材类型' };
  }

  if (!payload.description) {
    return { error: '素材摘要不能为空' };
  }

  if (!payload.download_url || !isHttpUrl(payload.download_url)) {
    return { error: '资料入口必须是有效的 http 或 https 地址' };
  }

  if (payload.cover && !isHttpUrl(payload.cover) && !isLocalUpload(payload.cover)) {
    return { error: '封面链接必须是有效图片地址，或使用上传后的封面路径' };
  }

  return { payload };
}

module.exports = {
  categories,
  parsePagination,
  parseSort,
  validateResourcePayload
};
