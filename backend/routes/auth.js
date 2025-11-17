// 认证路由
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateRegister } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

// 登录
router.post('/login', validateLogin, authController.login);

// 注册
router.post('/register', validateRegister, authController.register);

// 登出
router.post('/logout', authenticate, authController.logout);

// 检查登录状态
router.get('/check', authenticate, authController.check);

// 刷新令牌
router.post('/refresh', authController.refreshToken);

module.exports = router;

