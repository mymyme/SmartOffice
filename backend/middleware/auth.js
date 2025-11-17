// 认证中间件
const jwtUtil = require('../utils/jwt');
const db = require('../config/database');

/**
 * 认证中间件 - 验证用户是否已登录
 */
async function authenticate(req, res, next) {
    try {
        // 提取 token
        const token = jwtUtil.extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        // 验证 token
        const decoded = jwtUtil.verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: '认证令牌无效或已过期'
            });
        }

        // 检查用户是否存在且激活
        const user = await db.query(
            `SELECT id, username, email, role, avatar_url, full_name, is_active
             FROM ${db.tables.users}
             WHERE id = ?`,
            [decoded.userId]
        );

        if (!user || user.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        if (!user[0].is_active) {
            return res.status(403).json({
                success: false,
                message: '用户账户已被禁用'
            });
        }

        // 将用户信息附加到请求对象
        req.user = user[0];
        req.userId = user[0].id;

        next();
    } catch (error) {
        console.error('认证中间件错误:', error);
        return res.status(500).json({
            success: false,
            message: '认证失败'
        });
    }
}

/**
 * 可选认证中间件 - 如果有token则验证，没有则继续
 */
async function optionalAuthenticate(req, res, next) {
    try {
        const token = jwtUtil.extractToken(req);

        if (token) {
            const decoded = jwtUtil.verifyToken(token);

            if (decoded) {
                const user = await db.query(
                    `SELECT id, username, email, role, avatar_url, full_name, is_active
                     FROM ${db.tables.users}
                     WHERE id = ?`,
                    [decoded.userId]
                );

                if (user && user.length > 0 && user[0].is_active) {
                    req.user = user[0];
                    req.userId = user[0].id;
                }
            }
        }

        next();
    } catch (error) {
        console.error('可选认证中间件错误:', error);
        next();
    }
}

module.exports = {
    authenticate,
    optionalAuthenticate
};

