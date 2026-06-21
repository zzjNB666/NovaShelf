const bcrypt = require('bcryptjs');
const { getPool, shouldUseMock } = require('../db');
const { sampleComments, sampleRatings, sampleResources } = require('../data/sampleData');

const now = () => new Date().toISOString();
const mockResources = sampleResources.map((item) => ({ ...item }));
const mockComments = sampleComments.map((item) => ({ ...item }));
const mockRatings = sampleRatings.map((item) => ({ ...item }));

const mock = {
  nextUserId: 3,
  nextResourceId: Math.max(...mockResources.map((item) => item.id)) + 1,
  nextCommentId: Math.max(...mockComments.map((item) => item.id)) + 1,
  nextRatingId: Math.max(...mockRatings.map((item) => item.id)) + 1,
  users: [
    {
      id: 1,
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      avatar: 'https://api.dicebear.com/8.x/thumbs/svg?seed=admin',
      role: 'admin',
      created_at: '2026-06-01T09:00:00.000Z'
    },
    {
      id: 2,
      username: 'demo',
      password: bcrypt.hashSync('demo123', 10),
      avatar: 'https://api.dicebear.com/8.x/thumbs/svg?seed=demo',
      role: 'user',
      created_at: '2026-06-02T09:00:00.000Z'
    }
  ],
  resources: mockResources,
  comments: mockComments,
  ratings: mockRatings
};

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function normalizeId(id) {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function decorateResource(resource) {
  const ratings = mock.ratings.filter((rating) => rating.resource_id === resource.id);
  const comments = mock.comments.filter((comment) => comment.resource_id === resource.id);
  const average = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
    : 0;

  return {
    ...resource,
    average_score: Number(average.toFixed(1)),
    rating_count: ratings.length,
    comment_count: comments.length
  };
}

function commentWithUser(comment) {
  const user = mock.users.find((item) => item.id === comment.user_id);
  return {
    ...comment,
    username: user ? user.username : '未知用户',
    avatar: user ? user.avatar : ''
  };
}

function sortResources(resources, sortBy = 'created_at', order = 'desc') {
  const direction = order === 'asc' ? 1 : -1;
  const getValue = (resource) => {
    if (sortBy === 'rating') return Number(resource.average_score || 0);
    if (sortBy === 'view_count') return Number(resource.view_count || 0);
    if (sortBy === 'title') return String(resource.title || '');
    return new Date(resource.created_at).getTime();
  };

  return [...resources].sort((a, b) => {
    const left = getValue(a);
    const right = getValue(b);
    if (typeof left === 'string' || typeof right === 'string') {
      return String(left).localeCompare(String(right), 'zh-CN') * direction;
    }
    return (left - right) * direction;
  });
}

async function mysqlQuery(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findUserByUsername(username) {
  if (shouldUseMock()) {
    return mock.users.find((user) => user.username === username) || null;
  }

  const rows = await mysqlQuery('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

async function findUserById(id) {
  const userId = normalizeId(id);
  if (!userId) return null;

  if (shouldUseMock()) {
    return mock.users.find((user) => user.id === userId) || null;
  }

  const rows = await mysqlQuery('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function createUser({ username, password, avatar = '', role = 'user' }) {
  if (shouldUseMock()) {
    const user = {
      id: mock.nextUserId++,
      username,
      password,
      avatar: avatar || `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(username)}`,
      role,
      created_at: now()
    };
    mock.users.push(user);
    return user;
  }

  const rows = await mysqlQuery(
    'INSERT INTO users (username, password, avatar, role) VALUES (?, ?, ?, ?)',
    [username, password, avatar, role]
  );
  return findUserById(rows.insertId);
}

async function listUsers() {
  if (shouldUseMock()) {
    return mock.users.map(sanitizeUser).sort((a, b) => b.id - a.id);
  }

  return mysqlQuery('SELECT id, username, avatar, role, created_at FROM users ORDER BY id DESC');
}

async function updateUserRole(id, role) {
  const userId = normalizeId(id);
  if (!userId || !['user', 'admin'].includes(role)) return null;

  if (shouldUseMock()) {
    const user = mock.users.find((item) => item.id === userId);
    if (!user) return null;
    user.role = role;
    return sanitizeUser(user);
  }

  await mysqlQuery('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  return findUserById(userId).then(sanitizeUser);
}

async function listResources({ keyword = '', category = '', sortBy = 'created_at', order = 'desc' } = {}) {
  if (shouldUseMock()) {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const normalizedCategory = category.trim();
    const rows = mock.resources
      .filter((resource) => {
        const matchesKeyword = !normalizedKeyword
          || [resource.title, resource.tags, resource.description]
            .join(' ')
            .toLowerCase()
            .includes(normalizedKeyword);
        const matchesCategory = !normalizedCategory || resource.category === normalizedCategory;
        return matchesKeyword && matchesCategory;
      })
      .map(decorateResource);

    return sortResources(rows, sortBy, order);
  }

  const params = [];
  let where = 'WHERE 1=1';
  if (keyword) {
    where += ' AND (r.title LIKE ? OR r.tags LIKE ? OR r.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (category) {
    where += ' AND r.category = ?';
    params.push(category);
  }

  const rows = await mysqlQuery(
    `SELECT r.*,
      COALESCE(ROUND(AVG(rt.score), 1), 0) AS average_score,
      COUNT(DISTINCT rt.id) AS rating_count,
      COUNT(DISTINCT c.id) AS comment_count
     FROM resources r
     LEFT JOIN ratings rt ON rt.resource_id = r.id
     LEFT JOIN comments c ON c.resource_id = r.id
     ${where}
     GROUP BY r.id`,
    params
  );

  return sortResources(rows, sortBy, order);
}

async function getResource(id, { incrementView = false } = {}) {
  const resourceId = normalizeId(id);
  if (!resourceId) return null;

  if (shouldUseMock()) {
    const resource = mock.resources.find((item) => item.id === resourceId);
    if (!resource) return null;
    if (incrementView) {
      resource.view_count += 1;
    }
    return decorateResource(resource);
  }

  if (incrementView) {
    await mysqlQuery('UPDATE resources SET view_count = view_count + 1 WHERE id = ?', [resourceId]);
  }

  const rows = await mysqlQuery(
    `SELECT r.*,
      COALESCE(ROUND(AVG(rt.score), 1), 0) AS average_score,
      COUNT(DISTINCT rt.id) AS rating_count,
      COUNT(DISTINCT c.id) AS comment_count
     FROM resources r
     LEFT JOIN ratings rt ON rt.resource_id = r.id
     LEFT JOIN comments c ON c.resource_id = r.id
     WHERE r.id = ?
     GROUP BY r.id
     LIMIT 1`,
    [resourceId]
  );
  return rows[0] || null;
}

async function createResource(payload) {
  const resource = {
    title: payload.title,
    cover: payload.cover || '',
    category: payload.category || '灵感备忘',
    tags: payload.tags || '',
    description: payload.description || '',
    download_url: payload.download_url || '',
    view_count: 0
  };

  if (shouldUseMock()) {
    const created = {
      id: mock.nextResourceId++,
      ...resource,
      created_at: now()
    };
    mock.resources.push(created);
    return decorateResource(created);
  }

  const rows = await mysqlQuery(
    `INSERT INTO resources
      (title, cover, category, tags, description, download_url, view_count)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      resource.title,
      resource.cover,
      resource.category,
      resource.tags,
      resource.description,
      resource.download_url,
      resource.view_count
    ]
  );
  return getResource(rows.insertId);
}

async function updateResource(id, payload) {
  const resourceId = normalizeId(id);
  if (!resourceId) return null;

  if (shouldUseMock()) {
    const resource = mock.resources.find((item) => item.id === resourceId);
    if (!resource) return null;
    Object.assign(resource, {
      title: payload.title,
      cover: payload.cover || '',
      category: payload.category || '灵感备忘',
      tags: payload.tags || '',
      description: payload.description || '',
      download_url: payload.download_url || ''
    });
    return decorateResource(resource);
  }

  await mysqlQuery(
    `UPDATE resources
     SET title = ?, cover = ?, category = ?, tags = ?, description = ?, download_url = ?
     WHERE id = ?`,
    [
      payload.title,
      payload.cover || '',
      payload.category || '灵感备忘',
      payload.tags || '',
      payload.description || '',
      payload.download_url || '',
      resourceId
    ]
  );
  return getResource(resourceId);
}

async function deleteResource(id) {
  const resourceId = normalizeId(id);
  if (!resourceId) return false;

  if (shouldUseMock()) {
    const index = mock.resources.findIndex((resource) => resource.id === resourceId);
    if (index === -1) return false;
    mock.resources.splice(index, 1);
    mock.comments = mock.comments.filter((comment) => comment.resource_id !== resourceId);
    mock.ratings = mock.ratings.filter((rating) => rating.resource_id !== resourceId);
    return true;
  }

  const rows = await mysqlQuery('DELETE FROM resources WHERE id = ?', [resourceId]);
  return rows.affectedRows > 0;
}

async function listComments(resourceId) {
  const id = normalizeId(resourceId);
  if (!id) return [];

  if (shouldUseMock()) {
    return mock.comments
      .filter((comment) => comment.resource_id === id)
      .map(commentWithUser)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return mysqlQuery(
    `SELECT c.*, u.username, u.avatar
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.resource_id = ?
     ORDER BY c.created_at DESC`,
    [id]
  );
}

async function listAllComments() {
  if (shouldUseMock()) {
    return mock.comments
      .map((comment) => {
        const resource = mock.resources.find((item) => item.id === comment.resource_id);
        return {
          ...commentWithUser(comment),
          resource_title: resource ? resource.title : '已删除资源'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return mysqlQuery(
    `SELECT c.*, u.username, u.avatar, r.title AS resource_title
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN resources r ON r.id = c.resource_id
     ORDER BY c.created_at DESC`
  );
}

async function getComment(id) {
  const commentId = normalizeId(id);
  if (!commentId) return null;

  if (shouldUseMock()) {
    const comment = mock.comments.find((item) => item.id === commentId);
    return comment ? commentWithUser(comment) : null;
  }

  const rows = await mysqlQuery(
    `SELECT c.*, u.username, u.avatar
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = ?
     LIMIT 1`,
    [commentId]
  );
  return rows[0] || null;
}

async function createComment({ userId, resourceId, content }) {
  const id = normalizeId(resourceId);
  if (!id) return null;

  if (shouldUseMock()) {
    const resource = mock.resources.find((item) => item.id === id);
    if (!resource) return null;
    const comment = {
      id: mock.nextCommentId++,
      user_id: userId,
      resource_id: id,
      content,
      created_at: now()
    };
    mock.comments.push(comment);
    return commentWithUser(comment);
  }

  const rows = await mysqlQuery(
    'INSERT INTO comments (user_id, resource_id, content) VALUES (?, ?, ?)',
    [userId, id, content]
  );
  return getComment(rows.insertId);
}

async function deleteComment(id) {
  const commentId = normalizeId(id);
  if (!commentId) return false;

  if (shouldUseMock()) {
    const index = mock.comments.findIndex((comment) => comment.id === commentId);
    if (index === -1) return false;
    mock.comments.splice(index, 1);
    return true;
  }

  const rows = await mysqlQuery('DELETE FROM comments WHERE id = ?', [commentId]);
  return rows.affectedRows > 0;
}

async function upsertRating({ userId, resourceId, score }) {
  const id = normalizeId(resourceId);
  const normalizedScore = Number(score);
  if (!id || normalizedScore < 1 || normalizedScore > 5) return null;

  if (shouldUseMock()) {
    const resource = mock.resources.find((item) => item.id === id);
    if (!resource) return null;
    let rating = mock.ratings.find((item) => item.user_id === userId && item.resource_id === id);
    if (!rating) {
      rating = {
        id: mock.nextRatingId++,
        user_id: userId,
        resource_id: id,
        score: normalizedScore,
        created_at: now()
      };
      mock.ratings.push(rating);
    } else {
      rating.score = normalizedScore;
      rating.created_at = now();
    }
    return getRatingSummary(id, userId);
  }

  await mysqlQuery(
    `INSERT INTO ratings (user_id, resource_id, score)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE score = VALUES(score), created_at = CURRENT_TIMESTAMP`,
    [userId, id, normalizedScore]
  );
  return getRatingSummary(id, userId);
}

async function getRatingSummary(resourceId, userId = null) {
  const id = normalizeId(resourceId);
  if (!id) return null;

  if (shouldUseMock()) {
    const resource = mock.resources.find((item) => item.id === id);
    if (!resource) return null;

    const ratings = mock.ratings.filter((rating) => rating.resource_id === id);
    const average = ratings.length
      ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
      : 0;
    const userRating = userId
      ? ratings.find((rating) => rating.user_id === userId)
      : null;

    return {
      average_score: Number(average.toFixed(1)),
      rating_count: ratings.length,
      user_score: userRating ? userRating.score : null
    };
  }

  const resourceRows = await mysqlQuery('SELECT id FROM resources WHERE id = ? LIMIT 1', [id]);
  if (!resourceRows[0]) {
    return null;
  }

  const rows = await mysqlQuery(
    `SELECT COALESCE(ROUND(AVG(score), 1), 0) AS average_score,
      COUNT(*) AS rating_count
     FROM ratings
     WHERE resource_id = ?`,
    [id]
  );
  let userScore = null;
  if (userId) {
    const userRows = await mysqlQuery(
      'SELECT score FROM ratings WHERE resource_id = ? AND user_id = ? LIMIT 1',
      [id, userId]
    );
    userScore = userRows[0] ? userRows[0].score : null;
  }

  return {
    average_score: rows[0] ? Number(rows[0].average_score) : 0,
    rating_count: rows[0] ? Number(rows[0].rating_count) : 0,
    user_score: userScore
  };
}

async function getStats() {
  if (shouldUseMock()) {
    const byCategory = mock.resources.reduce((items, resource) => {
      const existing = items.find((item) => item.category === resource.category);
      if (existing) {
        existing.count += 1;
      } else {
        items.push({ category: resource.category, count: 1 });
      }
      return items;
    }, []);

    const topResources = mock.resources
      .map(decorateResource)
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 5);

    return {
      user_count: mock.users.length,
      resource_count: mock.resources.length,
      comment_count: mock.comments.length,
      rating_count: mock.ratings.length,
      total_views: mock.resources.reduce((sum, resource) => sum + resource.view_count, 0),
      by_category: byCategory,
      top_resources: topResources
    };
  }

  const [userRows, resourceRows, commentRows, ratingRows, viewRows, byCategory, topResources] =
    await Promise.all([
      mysqlQuery('SELECT COUNT(*) AS count FROM users'),
      mysqlQuery('SELECT COUNT(*) AS count FROM resources'),
      mysqlQuery('SELECT COUNT(*) AS count FROM comments'),
      mysqlQuery('SELECT COUNT(*) AS count FROM ratings'),
      mysqlQuery('SELECT COALESCE(SUM(view_count), 0) AS count FROM resources'),
      mysqlQuery('SELECT category, COUNT(*) AS count FROM resources GROUP BY category ORDER BY count DESC'),
      mysqlQuery('SELECT * FROM resources ORDER BY view_count DESC LIMIT 5')
    ]);

  return {
    user_count: userRows[0].count,
    resource_count: resourceRows[0].count,
    comment_count: commentRows[0].count,
    rating_count: ratingRows[0].count,
    total_views: viewRows[0].count,
    by_category: byCategory,
    top_resources: topResources
  };
}

module.exports = {
  mode: shouldUseMock() ? 'mock' : 'mysql',
  sanitizeUser,
  findUserByUsername,
  findUserById,
  createUser,
  listUsers,
  updateUserRole,
  listResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  listComments,
  listAllComments,
  getComment,
  createComment,
  deleteComment,
  upsertRating,
  getRatingSummary,
  getStats
};
