const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('../models/repository');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { getJwtSecret } = require('../utils/security');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (username.length < 3 || password.length < 6) {
      return fail(res, 400, '用户名至少 3 位，密码至少 6 位');
    }

    const existingUser = await repository.findUserByUsername(username);
    if (existingUser) {
      return fail(res, 409, '用户名已存在');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await repository.createUser({
      username,
      password: passwordHash,
      role: 'user'
    });

    const safeUser = repository.sanitizeUser(user);
    ok(res, { token: signToken(safeUser), user: safeUser }, '注册成功');
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const user = await repository.findUserByUsername(username);

    if (!user) {
      return fail(res, 401, '用户名或密码错误');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return fail(res, 401, '用户名或密码错误');
    }

    const safeUser = repository.sanitizeUser(user);
    ok(res, { token: signToken(safeUser), user: safeUser }, '登录成功');
  } catch (err) {
    next(err);
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  ok(res, req.user, '获取成功');
});

router.post('/logout', (req, res) => {
  ok(res, null, '退出成功');
});

module.exports = router;
