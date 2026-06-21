CREATE DATABASE IF NOT EXISTS novashelf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE novashelf;

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

CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_created_at ON resources(created_at);
CREATE INDEX idx_resources_view_count ON resources(view_count);
CREATE INDEX idx_comments_resource ON comments(resource_id);
CREATE INDEX idx_ratings_resource ON ratings(resource_id);
