const express = require('express');
const repository = require('../models/repository');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const comment = await repository.getComment(req.params.id);
    if (!comment) {
      return fail(res, 404, '反馈不存在');
    }

    const canDelete = req.user.role === 'admin' || comment.user_id === req.user.id;
    if (!canDelete) {
      return fail(res, 403, '只能删除自己的反馈');
    }

    await repository.deleteComment(req.params.id);
    ok(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
