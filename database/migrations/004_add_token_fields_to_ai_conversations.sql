-- 为AI对话表添加token统计字段
-- 执行时间: 2025-11-17

USE monaco_editor_db;

-- 添加token统计字段到ai_conversations表
ALTER TABLE ai_conversations
ADD COLUMN input_tokens INT DEFAULT 0 COMMENT '输入token数量',
ADD COLUMN output_tokens INT DEFAULT 0 COMMENT '输出token数量',
ADD COLUMN total_tokens INT DEFAULT 0 COMMENT '总token数量',
ADD COLUMN model VARCHAR(100) COMMENT 'AI模型名称',
ADD INDEX idx_user_tokens (user_id, total_tokens);

-- 说明：
-- input_tokens: 用户输入消息消耗的token数
-- output_tokens: AI回复消息消耗的token数
-- total_tokens: 总token数（input + output）
-- model: 使用的AI模型（如 gpt-3.5-turbo, gpt-4等）

