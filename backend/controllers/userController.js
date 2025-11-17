// 用户控制器
const User = require('../models/User');
const Session = require('../models/Session');
const { verifyPassword, checkPasswordStrength } = require('../utils/hash');
const { processAvatar, deleteAvatar, getAvatarUrl } = require('../utils/upload');
const db = require('../config/database');

/**
 * 记录用户操作日志
 */
async function logUserAction(userId, action, description, status, ipAddress, userAgent) {
    try {
        await db.query(
            `INSERT INTO ${db.tables.userLogs}
             (user_id, action, description, status, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, action, description, status, ipAddress, userAgent]
        );
    } catch (error) {
        console.error('记录日志失败:', error);
    }
}

/**
 * 获取个人信息
 * GET /api/user/profile
 */
async function getProfile(req, res) {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 移除敏感信息
        delete user.password_hash;
        delete user.login_attempts;
        delete user.locked_until;

        return res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('获取个人信息错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取个人信息失败'
        });
    }
}

/**
 * 更新个人信息
 * PUT /api/user/profile
 */
async function updateProfile(req, res) {
    try {
        const { email, full_name, phone, bio } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        const updateData = {};

        // 检查邮箱是否已被其他用户使用
        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== req.userId) {
                return res.status(409).json({
                    success: false,
                    message: '邮箱已被使用'
                });
            }
            updateData.email = email;
        }

        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone !== undefined) updateData.phone = phone;
        if (bio !== undefined) updateData.bio = bio;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有提供要更新的数据'
            });
        }

        await User.update(req.userId, updateData);

        // 记录日志
        await logUserAction(
            req.userId,
            'PROFILE_UPDATED',
            `更新个人信息: ${Object.keys(updateData).join(', ')}`,
            'success',
            ipAddress,
            userAgent
        );

        // 获取更新后的用户信息
        const updatedUser = await User.findById(req.userId);
        delete updatedUser.password_hash;
        delete updatedUser.login_attempts;
        delete updatedUser.locked_until;

        return res.json({
            success: true,
            message: '个人信息更新成功',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('更新个人信息错误:', error);
        return res.status(500).json({
            success: false,
            message: '更新个人信息失败'
        });
    }
}

/**
 * 修改密码
 * POST /api/user/change-password
 */
async function changePassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        // 获取用户完整信息（包括密码哈希）
        const user = await User.findByUsername(req.user.username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证旧密码
        const isOldPasswordValid = await verifyPassword(oldPassword, user.password_hash);

        if (!isOldPasswordValid) {
            await logUserAction(
                req.userId,
                'PASSWORD_CHANGE_FAILED',
                '旧密码错误',
                'failed',
                ipAddress,
                userAgent
            );

            return res.status(401).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 检查新密码强度
        const passwordCheck = checkPasswordStrength(newPassword);
        if (!passwordCheck.valid) {
            return res.status(400).json({
                success: false,
                message: passwordCheck.message
            });
        }

        // 更新密码
        await User.updatePassword(req.userId, newPassword);

        // 记录日志
        await logUserAction(
            req.userId,
            'PASSWORD_CHANGED',
            '密码修改成功',
            'success',
            ipAddress,
            userAgent
        );

        // 删除所有会话（强制重新登录）
        await Session.deleteAllByUserId(req.userId);

        return res.json({
            success: true,
            message: '密码修改成功，请重新登录'
        });

    } catch (error) {
        console.error('修改密码错误:', error);
        return res.status(500).json({
            success: false,
            message: '修改密码失败'
        });
    }
}

/**
 * 上传头像
 * POST /api/user/avatar
 */
async function uploadAvatar(req, res) {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请上传头像文件'
            });
        }

        // 处理图片（调整大小、压缩）
        await processAvatar(req.file.path, 200);

        // 获取旧头像
        const user = await User.findById(req.userId);
        const oldAvatarUrl = user.avatar_url;

        // 删除旧头像（如果不是默认头像）
        if (oldAvatarUrl && !oldAvatarUrl.includes('default-avatar')) {
            deleteAvatar(oldAvatarUrl);
        }

        // 生成新头像URL
        const avatarUrl = getAvatarUrl(req.file.filename);

        // 更新数据库
        await User.update(req.userId, { avatar_url: avatarUrl });

        // 记录日志
        await logUserAction(
            req.userId,
            'AVATAR_UPLOADED',
            '上传新头像',
            'success',
            ipAddress,
            userAgent
        );

        return res.json({
            success: true,
            message: '头像上传成功',
            data: { avatar_url: avatarUrl }
        });

    } catch (error) {
        console.error('上传头像错误:', error);

        // 删除已上传的文件
        if (req.file) {
            deleteAvatar(getAvatarUrl(req.file.filename));
        }

        return res.status(500).json({
            success: false,
            message: '头像上传失败'
        });
    }
}

/**
 * 删除头像（恢复默认）
 * DELETE /api/user/avatar
 */
async function deleteAvatarHandler(req, res) {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        // 获取当前头像
        const user = await User.findById(req.userId);
        const currentAvatarUrl = user.avatar_url;

        // 删除头像文件
        deleteAvatar(currentAvatarUrl);

        // 恢复默认头像
        const defaultAvatarUrl = '/assets/avatars/default-avatar.svg';
        await User.update(req.userId, { avatar_url: defaultAvatarUrl });

        // 记录日志
        await logUserAction(
            req.userId,
            'AVATAR_DELETED',
            '删除头像，恢复默认',
            'success',
            ipAddress,
            userAgent
        );

        return res.json({
            success: true,
            message: '头像已删除，恢复为默认头像',
            data: { avatar_url: defaultAvatarUrl }
        });

    } catch (error) {
        console.error('删除头像错误:', error);
        return res.status(500).json({
            success: false,
            message: '删除头像失败'
        });
    }
}

/**
 * 获取登录历史
 * GET /api/user/login-history
 */
async function getLoginHistory(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // 获取登录历史
        const logs = await db.query(
            `SELECT action, description, status, ip_address, user_agent, created_at
             FROM ${db.tables.userLogs}
             WHERE user_id = ? AND action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT')
             ORDER BY created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            [req.userId]
        );

        // 获取总数
        const countResult = await db.query(
            `SELECT COUNT(*) as total
             FROM ${db.tables.userLogs}
             WHERE user_id = ? AND action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT')`,
            [req.userId]
        );

        return res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page,
                    limit,
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });

    } catch (error) {
        console.error('获取登录历史错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取登录历史失败'
        });
    }
}

/**
 * 获取活动会话
 * GET /api/user/sessions
 */
async function getActiveSessions(req, res) {
    try {
        const sessions = await Session.getActiveSessionsByUserId(req.userId);

        return res.json({
            success: true,
            data: { sessions }
        });

    } catch (error) {
        console.error('获取活动会话错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取活动会话失败'
        });
    }
}

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar: deleteAvatarHandler,
    getLoginHistory,
    getActiveSessions
};

