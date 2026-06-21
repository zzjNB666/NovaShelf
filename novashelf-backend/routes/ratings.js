const express = require('express');
const repository = require('../models/repository');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.get('/:resourceId', optionalAuth, async (req, res, next) => {
  try {
    const rating = await repository.getRatingSummary(req.params.resourceId, req.user && req.user.id);
    if (!rating) {
      return fail(res, 404, '资源不存在');
    }
    ok(res, rating, '获取成功');
  } catch (err) {
    next(err);
  }
});

router.post('/:resourceId', requireAuth, async (req, res, next) => {
  try {
    const score = Number(req.body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return fail(res, 400, '评分必须是 1 到 5 的整数');
    }

    const rating = await repository.upsertRating({
      userId: req.user.id,
      resourceId: req.params.resourceId,
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
