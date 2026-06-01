// 对话记录路由
const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 保存对话记录
router.post('/save', conversationController.saveConversation);

// 获取对话历史
router.get('/history', conversationController.getHistory);

// 获取对话统计
router.get('/stats', conversationController.getStats);

// 获取对话列表（按会话分组）
router.get('/list', conversationController.getConversationList);

// 获取指定会话的详细内容
router.get('/:sessionId', conversationController.getConversationDetail);

module.exports = router;

