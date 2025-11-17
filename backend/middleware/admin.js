// 管理员权限中间件

/**
 * 管理员权限验证中间件
 * 注意：此中间件必须在 authenticate 中间件之后使用
 */
function requireAdmin(req, res, next) {
    // 检查是否已通过认证
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '需要登录'
        });
    }

    // 检查是否是管理员
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }

    next();
}

/**
 * 检查是否是用户本人或管理员
 * @param {string} userIdField - 请求参数中用户ID的字段名（默认为'id'）
 */
function requireOwnerOrAdmin(userIdField = 'id') {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '需要登录'
            });
        }

        const targetUserId = parseInt(req.params[userIdField]);

        // 管理员或用户本人可以访问
        if (req.user.role === 'admin' || req.user.id === targetUserId) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: '没有权限访问此资源'
            });
        }
    };
}

module.exports = {
    requireAdmin,
    requireOwnerOrAdmin
};

