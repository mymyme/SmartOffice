// 管理员路由
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const {
    validateAdminCreateUser,
    validateAdminUpdateUser,
    validateUserId,
    validatePagination
} = require('../middleware/validator');

// 所有管理员路由都需要认证和管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 获取用户列表
router.get('/users', validatePagination, adminController.getUsers);

// 获取用户详情
router.get('/users/:id', validateUserId, adminController.getUserDetail);

// 创建新用户
router.post('/users', validateAdminCreateUser, adminController.createUser);

// 更新用户信息
router.put('/users/:id', validateUserId, validateAdminUpdateUser, adminController.updateUser);

// 删除用户
router.delete('/users/:id', validateUserId, adminController.deleteUser);

// 重置用户密码
router.post('/users/:id/reset-password', validateUserId, adminController.resetPassword);

// 更改用户角色
router.put('/users/:id/role', validateUserId, adminController.changeRole);

// 更改用户状态（启用/禁用）
router.put('/users/:id/status', validateUserId, adminController.changeStatus);

// 获取系统统计数据
router.get('/stats', adminController.getStats);

// 获取用户操作日志
router.get('/users/:id/logs', validateUserId, validatePagination, adminController.getUserLogs);

module.exports = router;

