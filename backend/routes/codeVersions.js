// 代码块版本管理路由
const express = require('express');
const router = express.Router();
const codeVersionController = require('../controllers/codeVersionController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 保存代码块版本
router.post('/save', codeVersionController.saveVersion);

// 获取会话的所有版本数据
router.get('/session/:session_id', codeVersionController.getSessionVersions);

// 更新当前激活版本
router.put('/current', codeVersionController.updateCurrentVersion);

// 删除代码块版本
router.delete('/delete', codeVersionController.deleteVersion);

module.exports = router;

