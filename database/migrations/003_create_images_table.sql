-- 创建图片管理表
CREATE TABLE IF NOT EXISTS images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID（外键）',
  filename VARCHAR(255) NOT NULL COMMENT '存储文件名',
  original_name VARCHAR(255) COMMENT '原始文件名',
  file_size INT COMMENT '文件大小（字节）',
  mime_type VARCHAR(50) COMMENT '文件MIME类型',
  width INT COMMENT '图片宽度',
  height INT COMMENT '图片高度',
  storage_path VARCHAR(500) COMMENT '存储路径',
  url VARCHAR(500) COMMENT '访问URL',
  thumbnail_url VARCHAR(500) COMMENT '缩略图URL',
  usage_count INT DEFAULT 0 COMMENT '使用次数统计',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 外键约束：用户删除时级联删除其图片
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- 索引优化
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_filename (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户图片表';

-- 注释说明
-- 该表用于存储用户上传的图片信息
-- 每个用户只能访问自己上传的图片（通过user_id隔离）
-- 支持自动生成缩略图
-- 用户删除时会自动删除其所有图片记录

