-- 为AI对话表添加HTML内容字段
-- 执行时间: 2025-11-19

USE monaco_editor_db;

-- 添加html_content字段到ai_conversations表
ALTER TABLE ai_conversations
ADD COLUMN html_content LONGTEXT COMMENT 'HTML文件内容';

-- 说明：
-- html_content: 存储对话过程中生成的HTML代码内容
-- 每次保存对话时会更新此字段，存储当前编辑器中的完整HTML内容

