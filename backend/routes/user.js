// 用户路由
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validateUpdateProfile, validateChangePassword } = require('../middleware/validator');
const { upload } = require('../utils/upload');

// 所有用户路由都需要认证
router.use(authenticate);

// 获取个人信息
router.get('/profile', userController.getProfile);

// 更新个人信息
router.put('/profile', validateUpdateProfile, userController.updateProfile);

// 修改密码
router.post('/change-password', validateChangePassword, userController.changePassword);

// 上传头像
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

// 删除头像（恢复默认）
router.delete('/avatar', userController.deleteAvatar);

// 获取登录历史
router.get('/login-history', userController.getLoginHistory);

// 获取活动会话
router.get('/sessions', userController.getActiveSessions);

module.exports = router;

