// 管理员控制器
const User = require('../models/User');
const Session = require('../models/Session');
const { hashPassword } = require('../utils/hash');
const db = require('../config/database');

/**
 * 记录管理员操作日志
 */
async function logAdminAction(userId, action, description, status, ipAddress, userAgent) {
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
 * 获取用户列表
 * GET /api/admin/users
 */
async function getUsers(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            role = null,
            isActive = null,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        // 处理 isActive 参数：只有当值为 'true' 或 'false' 时才应用过滤
        // 空字符串视为不过滤
        let isActiveFilter = null;
        if (isActive === 'true') {
            isActiveFilter = true;
        } else if (isActive === 'false') {
            isActiveFilter = false;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            role,
            isActive: isActiveFilter,
            sortBy,
            sortOrder
        };

        const result = await User.list(options);

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('获取用户列表错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
}

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
async function getUserDetail(req, res) {
    try {
        const userId = parseInt(req.params.id);

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 移除敏感信息
        delete user.password_hash;

        // 获取用户统计信息
        const snippetCount = await db.query(
            `SELECT COUNT(*) as count FROM ${db.tables.codeSnippets} WHERE user_id = ?`,
            [userId]
        );

        const conversationCount = await db.query(
            `SELECT COUNT(DISTINCT session_id) as count FROM ${db.tables.aiConversations} WHERE user_id = ?`,
            [userId]
        );

        const loginCount = await db.query(
            `SELECT COUNT(*) as count FROM ${db.tables.userLogs}
             WHERE user_id = ? AND action = 'LOGIN_SUCCESS'`,
            [userId]
        );

        user.statistics = {
            codeSnippets: snippetCount[0].count,
            aiConversations: conversationCount[0].count,
            loginCount: loginCount[0].count
        };

        return res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('获取用户详情错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取用户详情失败'
        });
    }
}

/**
 * 创建新用户
 * POST /api/admin/users
 */
async function createUser(req, res) {
    try {
        const { username, email, password, role = 'user', full_name } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        // 检查用户名是否已存在
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: '用户名已被使用'
            });
        }

        // 检查邮箱是否已存在
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: '邮箱已被注册'
            });
        }

        // 创建用户
        const userId = await User.create({
            username,
            email,
            password,
            role,
            full_name
        });

        // 记录管理员操作日志
        await logAdminAction(
            req.userId,
            'ADMIN_CREATE_USER',
            `创建新用户: ${username} (ID: ${userId})`,
            'success',
            ipAddress,
            userAgent
        );

        // 记录新用户日志
        await logAdminAction(
            userId,
            'ACCOUNT_CREATED',
            `账户由管理员创建 (管理员ID: ${req.userId})`,
            'success',
            ipAddress,
            userAgent
        );

        // 获取新创建的用户信息
        const newUser = await User.findById(userId);
        delete newUser.password_hash;

        return res.status(201).json({
            success: true,
            message: '用户创建成功',
            data: { user: newUser }
        });

    } catch (error) {
        console.error('创建用户错误:', error);
        return res.status(500).json({
            success: false,
            message: '创建用户失败'
        });
    }
}

/**
 * 更新用户信息
 * PUT /api/admin/users/:id
 */
async function updateUser(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { email, role, is_active, full_name, phone, bio } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const updateData = {};

        // 不允许修改admin账号的关键信息
        if (user.username === 'admin') {
            if (role !== undefined && role !== user.role) {
                return res.status(403).json({
                    success: false,
                    message: '不能修改系统管理员账号(admin)的角色'
                });
            }
            if (is_active !== undefined && is_active !== user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: '不能禁用系统管理员账号(admin)'
                });
            }
        }

        // 检查邮箱是否已被其他用户使用
        if (email && email !== user.email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    success: false,
                    message: '邮箱已被使用'
                });
            }
            updateData.email = email;
        }

        if (role !== undefined) updateData.role = role;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone !== undefined) updateData.phone = phone;
        if (bio !== undefined) updateData.bio = bio;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有提供要更新的数据'
            });
        }

        await User.update(userId, updateData);

        // 记录管理员操作日志
        await logAdminAction(
            req.userId,
            'ADMIN_UPDATE_USER',
            `更新用户信息: ${user.username} (ID: ${userId}), 字段: ${Object.keys(updateData).join(', ')}`,
            'success',
            ipAddress,
            userAgent
        );

        // 记录用户日志
        await logAdminAction(
            userId,
            'PROFILE_UPDATED',
            `管理员更新了用户信息 (管理员ID: ${req.userId})`,
            'success',
            ipAddress,
            userAgent
        );

        // 获取更新后的用户信息
        const updatedUser = await User.findById(userId);
        delete updatedUser.password_hash;

        return res.json({
            success: true,
            message: '用户信息更新成功',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('更新用户信息错误:', error);
        return res.status(500).json({
            success: false,
            message: '更新用户信息失败'
        });
    }
}

/**
 * 删除用户
 * DELETE /api/admin/users/:id
 */
async function deleteUser(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { permanent = false } = req.query;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 不允许删除自己
        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                message: '不能删除自己的账户'
            });
        }

        // 不允许删除admin账号
        if (user.username === 'admin') {
            return res.status(403).json({
                success: false,
                message: '不能删除系统管理员账号(admin)'
            });
        }

        if (permanent === 'true') {
            // 硬删除（永久删除）
            await User.delete(userId);

            await logAdminAction(
                req.userId,
                'ADMIN_DELETE_USER',
                `永久删除用户: ${user.username} (ID: ${userId})`,
                'success',
                ipAddress,
                userAgent
            );

            return res.json({
                success: true,
                message: '用户已永久删除'
            });
        } else {
            // 软删除（禁用账户）
            await User.softDelete(userId);

            // 删除所有会话
            await Session.deleteAllByUserId(userId);

            await logAdminAction(
                req.userId,
                'ADMIN_DISABLE_USER',
                `禁用用户: ${user.username} (ID: ${userId})`,
                'success',
                ipAddress,
                userAgent
            );

            await logAdminAction(
                userId,
                'ACCOUNT_DISABLED',
                `账户被管理员禁用 (管理员ID: ${req.userId})`,
                'success',
                ipAddress,
                userAgent
            );

            return res.json({
                success: true,
                message: '用户账户已禁用'
            });
        }

    } catch (error) {
        console.error('删除用户错误:', error);
        return res.status(500).json({
            success: false,
            message: '删除用户失败'
        });
    }
}

/**
 * 重置用户密码
 * POST /api/admin/users/:id/reset-password
 */
async function resetPassword(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { newPassword } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: '请提供新密码'
            });
        }

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 不允许重置admin账号的密码
        if (user.username === 'admin') {
            return res.status(403).json({
                success: false,
                message: '不能重置系统管理员账号(admin)的密码'
            });
        }

        // 更新密码
        await User.updatePassword(userId, newPassword);

        // 删除该用户的所有会话（强制重新登录）
        await Session.deleteAllByUserId(userId);

        // 记录管理员操作日志
        await logAdminAction(
            req.userId,
            'ADMIN_RESET_PASSWORD',
            `重置用户密码: ${user.username} (ID: ${userId})`,
            'success',
            ipAddress,
            userAgent
        );

        // 记录用户日志
        await logAdminAction(
            userId,
            'PASSWORD_RESET',
            `密码被管理员重置 (管理员ID: ${req.userId})`,
            'success',
            ipAddress,
            userAgent
        );

        return res.json({
            success: true,
            message: '密码重置成功'
        });

    } catch (error) {
        console.error('重置密码错误:', error);
        return res.status(500).json({
            success: false,
            message: '重置密码失败'
        });
    }
}

/**
 * 更改用户角色
 * PUT /api/admin/users/:id/role
 */
async function changeRole(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: '角色必须是 user 或 admin'
            });
        }

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 不允许修改自己的角色
        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                message: '不能修改自己的角色'
            });
        }

        await User.update(userId, { role });

        // 记录管理员操作日志
        await logAdminAction(
            req.userId,
            'ADMIN_CHANGE_ROLE',
            `更改用户角色: ${user.username} (ID: ${userId}), ${user.role} -> ${role}`,
            'success',
            ipAddress,
            userAgent
        );

        // 记录用户日志
        await logAdminAction(
            userId,
            'ROLE_CHANGED',
            `角色被管理员更改为: ${role} (管理员ID: ${req.userId})`,
            'success',
            ipAddress,
            userAgent
        );

        return res.json({
            success: true,
            message: '用户角色更新成功'
        });

    } catch (error) {
        console.error('更改用户角色错误:', error);
        return res.status(500).json({
            success: false,
            message: '更改用户角色失败'
        });
    }
}

/**
 * 更改用户状态（启用/禁用）
 * PUT /api/admin/users/:id/status
 */
async function changeStatus(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { is_active } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_active 必须是布尔值'
            });
        }

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 不允许禁用自己
        if (userId === req.userId && !is_active) {
            return res.status(400).json({
                success: false,
                message: '不能禁用自己的账户'
            });
        }

        await User.update(userId, { is_active });

        // 如果禁用用户，删除其所有会话
        if (!is_active) {
            await Session.deleteAllByUserId(userId);
        }

        // 记录管理员操作日志
        await logAdminAction(
            req.userId,
            is_active ? 'ADMIN_ENABLE_USER' : 'ADMIN_DISABLE_USER',
            `${is_active ? '启用' : '禁用'}用户: ${user.username} (ID: ${userId})`,
            'success',
            ipAddress,
            userAgent
        );

        // 记录用户日志
        await logAdminAction(
            userId,
            is_active ? 'ACCOUNT_ENABLED' : 'ACCOUNT_DISABLED',
            `账户被管理员${is_active ? '启用' : '禁用'} (管理员ID: ${req.userId})`,
            'success',
            ipAddress,
            userAgent
        );

        return res.json({
            success: true,
            message: `用户已${is_active ? '启用' : '禁用'}`
        });

    } catch (error) {
        console.error('更改用户状态错误:', error);
        return res.status(500).json({
            success: false,
            message: '更改用户状态失败'
        });
    }
}

/**
 * 获取系统统计数据
 * GET /api/admin/stats
 */
async function getStats(req, res) {
    try {
        // 用户统计
        const totalUsers = await User.count();
        const activeUsers = await User.count({ isActive: true });
        const adminUsers = await User.count({ role: 'admin' });

        // 在线用户统计（最近5分钟内活跃）
        const onlineUsers = await Session.getOnlineUsersCount();

        // 代码片段统计
        const snippetsResult = await db.query(
            `SELECT COUNT(*) as total,
                    COUNT(CASE WHEN is_public = true THEN 1 END) as public_count
             FROM ${db.tables.codeSnippets}`
        );

        // AI对话统计
        const conversationsResult = await db.query(
            `SELECT COUNT(DISTINCT session_id) as total FROM ${db.tables.aiConversations}`
        );

        // 最近登录统计（24小时内）
        const recentLoginsResult = await db.query(
            `SELECT COUNT(*) as count FROM ${db.tables.userLogs}
             WHERE action = 'LOGIN_SUCCESS' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
        );

        // 最近注册用户（7天内）
        const recentRegistrationsResult = await db.query(
            `SELECT COUNT(*) as count FROM ${db.tables.users}
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // 系统活跃度（最近7天的操作数）
        const activityResult = await db.query(
            `SELECT COUNT(*) as count FROM ${db.tables.userLogs}
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        return res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers,
                    admins: adminUsers,
                    online: onlineUsers
                },
                codeSnippets: {
                    total: snippetsResult[0].total,
                    public: snippetsResult[0].public_count,
                    private: snippetsResult[0].total - snippetsResult[0].public_count
                },
                aiConversations: {
                    total: conversationsResult[0].total
                },
                activity: {
                    recentLogins24h: recentLoginsResult[0].count,
                    recentRegistrations7d: recentRegistrationsResult[0].count,
                    totalActions7d: activityResult[0].count
                }
            }
        });

    } catch (error) {
        console.error('获取统计数据错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
}

/**
 * 获取用户操作日志
 * GET /api/admin/users/:id/logs
 */
async function getUserLogs(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 获取日志
        const logs = await db.query(
            `SELECT action, description, status, ip_address, user_agent, created_at
             FROM ${db.tables.userLogs}
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            [userId]
        );

        // 获取总数
        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM ${db.tables.userLogs} WHERE user_id = ?`,
            [userId]
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
        console.error('获取用户日志错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取用户日志失败'
        });
    }
}

module.exports = {
    getUsers,
    getUserDetail,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    changeRole,
    changeStatus,
    getStats,
    getUserLogs
};

