const jwt = require('jsonwebtoken');
const repository = require('../models/repository');
const { fail } = require('../utils/response');
const { getJwtSecret } = require('../utils/security');

function getToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7);
}

async function requireAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) {
      return fail(res, 401, '请先登录');
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await repository.findUserById(payload.id);

    if (!user) {
      return fail(res, 401, '登录状态已失效');
    }

    req.user = repository.sanitizeUser(user);
    next();
  } catch (err) {
    fail(res, 401, '登录状态已失效');
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (token) {
      const payload = jwt.verify(token, getJwtSecret());
      const user = await repository.findUserById(payload.id);
      req.user = user ? repository.sanitizeUser(user) : null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return fail(res, 403, '需要管理员权限');
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};
