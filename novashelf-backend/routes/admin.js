const express = require('express');
const repository = require('../models/repository');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await repository.getStats();
    ok(res, stats, '获取成功');
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await repository.listUsers();
    ok(res, users, '获取成功');
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/role', async (req, res, next) => {
  try {
    const role = String(req.body.role || '');
    const targetUserId = Number(req.params.id);

    if (!['user', 'admin'].includes(role)) {
      return fail(res, 400, '角色只能是 user 或 admin');
    }

    if (targetUserId === req.user.id && role !== 'admin') {
      return fail(res, 400, '不能把自己的管理员权限改为普通用户');
    }

    const user = await repository.updateUserRole(req.params.id, role);
    if (!user) {
      return fail(res, 404, '用户不存在');
    }

    ok(res, user, '修改成功');
  } catch (err) {
    next(err);
  }
});

router.get('/comments', async (req, res, next) => {
  try {
    const comments = await repository.listAllComments();
    ok(res, comments, '获取成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
