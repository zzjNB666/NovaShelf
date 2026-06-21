require('dotenv').config();

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { sampleComments, sampleRatings, sampleResources } = require('../data/sampleData');

function toMysqlDateTime(value) {
  return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  const dbName = process.env.DB_NAME || 'novashelf';
  const resetSampleData = process.argv.includes('--reset') || process.env.RESET_SAMPLE_DATA === 'true';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  await connection.query(`
    CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    USE ${dbName};

    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(255),
      role ENUM('user', 'admin') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(100) NOT NULL,
      cover VARCHAR(255),
      category VARCHAR(50) NOT NULL DEFAULT '灵感备忘',
      tags VARCHAR(255),
      description TEXT,
      download_url VARCHAR(255),
      view_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_resources_category CHECK (category IN ('互动剧本', '叙事文本', '视觉设定', '创作工具', '声音素材', '灵感备忘'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      resource_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_comments_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      resource_id INT NOT NULL,
      score INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_rating (user_id, resource_id),
      CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_ratings_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      CONSTRAINT chk_rating_score CHECK (score BETWEEN 1 AND 5)
    );
  `);

  await connection.changeUser({ database: dbName });

  const indexStatements = [
    'CREATE INDEX idx_resources_category ON resources(category)',
    'CREATE INDEX idx_resources_created_at ON resources(created_at)',
    'CREATE INDEX idx_resources_view_count ON resources(view_count)',
    'CREATE INDEX idx_comments_resource ON comments(resource_id)',
    'CREATE INDEX idx_ratings_resource ON ratings(resource_id)'
  ];

  for (const statement of indexStatements) {
    try {
      await connection.query(statement);
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') {
        throw err;
      }
    }
  }

  if (resetSampleData) {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE ratings');
    await connection.query('TRUNCATE TABLE comments');
    await connection.query('TRUNCATE TABLE resources');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  const adminPassword = await bcrypt.hash('admin123', 10);
  const demoPassword = await bcrypt.hash('demo123', 10);

  await connection.query(
    `INSERT INTO users (username, password, avatar, role)
     VALUES
      ('admin', ?, 'https://api.dicebear.com/8.x/thumbs/svg?seed=admin', 'admin'),
      ('demo', ?, 'https://api.dicebear.com/8.x/thumbs/svg?seed=demo', 'user')
     ON DUPLICATE KEY UPDATE avatar = VALUES(avatar), role = VALUES(role)`,
    [adminPassword, demoPassword]
  );

  for (const resource of sampleResources) {
    const [[existing]] = await connection.query(
      'SELECT id FROM resources WHERE title = ? LIMIT 1',
      [resource.title]
    );

    if (!existing) {
      await connection.query(
        `INSERT INTO resources
          (title, cover, category, tags, description, download_url, view_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resource.title,
          resource.cover,
          resource.category,
          resource.tags,
          resource.description,
          resource.download_url,
          resource.view_count,
          toMysqlDateTime(resource.created_at)
        ]
      );
    } else {
      await connection.query(
        `UPDATE resources
         SET cover = ?, category = ?, tags = ?, description = ?, download_url = ?, view_count = ?, created_at = ?
         WHERE id = ?`,
        [
          resource.cover,
          resource.category,
          resource.tags,
          resource.description,
          resource.download_url,
          resource.view_count,
          toMysqlDateTime(resource.created_at),
          existing.id
        ]
      );
    }
  }

  const [[admin]] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
  const [[demo]] = await connection.query('SELECT id FROM users WHERE username = ?', ['demo']);
  const [resources] = await connection.query('SELECT id, title FROM resources ORDER BY id ASC');

  const resourceByTitle = Object.fromEntries(resources.map((resource) => [resource.title, resource.id]));
  const userId = demo.id;
  const adminId = admin.id;

  const userIdMap = {
    1: adminId,
    2: userId
  };

  const [[commentCount]] = await connection.query('SELECT COUNT(*) AS count FROM comments');
  if (Number(commentCount.count) === 0) {
    for (const comment of sampleComments) {
      const resource = sampleResources.find((item) => item.id === comment.resource_id);
      const resourceId = resource ? resourceByTitle[resource.title] : null;
      const mappedUserId = userIdMap[comment.user_id];

      if (resourceId && mappedUserId) {
        await connection.query(
          `INSERT INTO comments (user_id, resource_id, content, created_at)
           VALUES (?, ?, ?, ?)`,
          [mappedUserId, resourceId, comment.content, toMysqlDateTime(comment.created_at)]
        );
      }
    }
  }

  for (const rating of sampleRatings) {
    const resource = sampleResources.find((item) => item.id === rating.resource_id);
    const resourceId = resource ? resourceByTitle[resource.title] : null;
    const mappedUserId = userIdMap[rating.user_id];

    if (resourceId && mappedUserId) {
      await connection.query(
        `INSERT INTO ratings (user_id, resource_id, score, created_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score), created_at = VALUES(created_at)`,
        [mappedUserId, resourceId, rating.score, toMysqlDateTime(rating.created_at)]
      );
    }
  }

  await connection.end();
  console.log(`Seed completed for ${dbName}. Admin: admin / admin123, User: demo / demo123`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
