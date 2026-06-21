const express = require('express');
const repository = require('../models/repository');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { parsePagination, parseSort, validateResourcePayload } = require('../utils/validation');

const router = express.Router();

function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages
    }
  };
}

function validateResource(req, res, next) {
  const result = validateResourcePayload(req.body);
  if (result.error) {
    return fail(res, 400, result.error);
  }
  req.body = result.payload;
  next();
}

router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const { sortBy, order } = parseSort(req.query);
    const resources = await repository.listResources({
      keyword: String(req.query.keyword || ''),
      category: String(req.query.category || ''),
      sortBy,
      order
    });

    ok(res, {
      ...paginate(resources, page, pageSize),
      sort: { sortBy, order }
    }, '获取成功');
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const resource = await repository.getResource(req.params.id, { incrementView: true });
    if (!resource) {
      return fail(res, 404, '资源不存在');
    }
    ok(res, resource, '获取成功');
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireAdmin, validateResource, async (req, res, next) => {
  try {
    const resource = await repository.createResource(req.body);
    ok(res, resource, '新增成功');
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, requireAdmin, validateResource, async (req, res, next) => {
  try {
    const resource = await repository.updateResource(req.params.id, req.body);
    if (!resource) {
      return fail(res, 404, '资源不存在');
    }
    ok(res, resource, '修改成功');
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const deleted = await repository.deleteResource(req.params.id);
    if (!deleted) {
      return fail(res, 404, '资源不存在');
    }
    ok(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const comments = await repository.listComments(req.params.id);
    ok(res, comments, '获取成功');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const content = String(req.body.content || '').trim();
    if (!content) {
      return fail(res, 400, '反馈内容不能为空');
    }

    if (content.length > 500) {
      return fail(res, 400, '反馈内容不能超过 500 个字符');
    }

    const comment = await repository.createComment({
      userId: req.user.id,
      resourceId: req.params.id,
      content
    });

    if (!comment) {
      return fail(res, 404, '资源不存在');
    }

    ok(res, comment, '反馈提交成功');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/rating', optionalAuth, async (req, res, next) => {
  try {
    const rating = await repository.getRatingSummary(req.params.id, req.user && req.user.id);
    if (!rating) {
      return fail(res, 404, '资源不存在');
    }
    ok(res, rating, '获取成功');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/rating', requireAuth, async (req, res, next) => {
  try {
    const score = Number(req.body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return fail(res, 400, '评分必须是 1 到 5 的整数');
    }

    const rating = await repository.upsertRating({
      userId: req.user.id,
      resourceId: req.params.id,
      score
    });

    if (!rating) {
      return fail(res, 404, '资源不存在');
    }

    ok(res, rating, '评分成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
