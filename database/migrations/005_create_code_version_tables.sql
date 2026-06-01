-- 代码块版本管理表结构创建脚本
-- 版本：1.0
-- 创建日期：2024-12-04
-- 说明：创建代码块版本管理所需的两张表

-- ==================== 代码块版本数据表 ====================
CREATE TABLE IF NOT EXISTS `code_block_versions` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `session_id` VARCHAR(255) NOT NULL COMMENT '会话ID',
  `block_id` VARCHAR(255) NOT NULL COMMENT '代码块ID',
  `version` INT(11) NOT NULL COMMENT '版本号',
  `content` LONGTEXT NOT NULL COMMENT '代码内容',
  `is_original` TINYINT(1) DEFAULT 0 COMMENT '是否为原始版本（1=是，0=否）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_block_version` (`session_id`, `block_id`, `version`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_block_id` (`block_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码块版本管理表';

-- ==================== 代码块当前版本跟踪表 ====================
CREATE TABLE IF NOT EXISTS `code_block_current_versions` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `session_id` VARCHAR(255) NOT NULL COMMENT '会话ID',
  `block_id` VARCHAR(255) NOT NULL COMMENT '代码块ID',
  `current_version` INT(11) NOT NULL COMMENT '当前激活版本号',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_session_block` (`user_id`, `session_id`, `block_id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码块当前版本跟踪表';

-- ==================== 插入测试数据（可选） ====================
-- 注意：实际部署时可以删除这部分，这里仅用于开发测试

-- INSERT INTO code_block_versions
-- (user_id, session_id, block_id, version, content, is_original, created_at)
-- VALUES
-- (1, 'test_session_001', 'codeblock_1733299200000_0', 1, '<!DOCTYPE html><html><body>Test</body></html>', 1, NOW());

-- ==================== 权限说明 ====================
-- 确保应用用户有以下权限：
-- GRANT SELECT, INSERT, UPDATE, DELETE ON aicode.code_block_versions TO 'your_app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON aicode.code_block_current_versions TO 'your_app_user'@'%';

-- ==================== 索引说明 ====================
-- 1. uk_session_block_version: 确保同一会话、同一代码块、同一版本号唯一
-- 2. uk_user_session_block: 确保同一用户、同一会话、同一代码块只有一条当前版本记录
-- 3. idx_user_id: 加速按用户查询
-- 4. idx_session_id: 加速按会话查询
-- 5. idx_block_id: 加速按代码块查询
-- 6. idx_created_at: 支持按时间范围查询和排序

-- ==================== 清理脚本（如需回滚） ====================
-- DROP TABLE IF EXISTS code_block_current_versions;
-- DROP TABLE IF EXISTS code_block_versions;

