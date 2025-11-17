// JWT 工具类
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * 生成访问令牌
 * @param {Object} payload - 载荷数据
 * @returns {string} JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn
    });
}

/**
 * 生成刷新令牌
 * @param {Object} payload - 载荷数据
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.refreshExpiresIn
    });
}

/**
 * 验证令牌
 * @param {string} token - JWT token
 * @returns {Object|null} 解码后的载荷或null
 */
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('Token已过期');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('Token无效');
        }
        return null;
    }
}

/**
 * 解码令牌（不验证）
 * @param {string} token - JWT token
 * @returns {Object|null} 解码后的载荷或null
 */
function decodeToken(token) {
    try {
        const decoded = jwt.decode(token);
        return decoded;
    } catch (error) {
        console.error('Token解码失败:', error);
        return null;
    }
}

/**
 * 从请求中提取令牌
 * @param {Object} req - Express请求对象
 * @returns {string|null} Token或null
 */
function extractToken(req) {
    // 优先从Cookie中获取
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    // 从Authorization header中获取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    return null;
}

/**
 * 创建令牌响应对象
 * @param {Object} user - 用户信息
 * @returns {Object} 包含token和用户信息的对象
 */
function createTokenResponse(user) {
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken({ userId: user.id });

    return {
        token,
        refreshToken,
        expiresIn: jwtConfig.expiresIn,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            full_name: user.full_name
        }
    };
}

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    decodeToken,
    extractToken,
    createTokenResponse
};

