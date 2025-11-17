// 认证控制器
const User = require('../models/User');
const Session = require('../models/Session');
const { verifyPassword, checkPasswordStrength } = require('../utils/hash');
const jwtUtil = require('../utils/jwt');
const jwtConfig = require('../config/jwt');
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
 * 登录
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        // 查找用户（支持用户名或邮箱登录）
        let user = await User.findByUsername(username);
        if (!user) {
            user = await User.findByEmail(username);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 检查账户是否被锁定
        if (await User.isLocked(user.id)) {
            await logUserAction(
                user.id,
                'LOGIN_FAILED',
                '账户已锁定，尝试登录',
                'failed',
                ipAddress,
                userAgent
            );

            return res.status(423).json({
                success: false,
                message: '账户已被锁定，请30分钟后再试'
            });
        }

        // 检查账户是否激活
        if (!user.is_active) {
            await logUserAction(
                user.id,
                'LOGIN_FAILED',
                '账户已禁用，尝试登录',
                'failed',
                ipAddress,
                userAgent
            );

            return res.status(403).json({
                success: false,
                message: '账户已被禁用'
            });
        }

        // 验证密码
        const isPasswordValid = await verifyPassword(password, user.password_hash);

        if (!isPasswordValid) {
            // 增加登录失败次数
            await User.incrementLoginAttempts(user.id);

            await logUserAction(
                user.id,
                'LOGIN_FAILED',
                '密码错误',
                'failed',
                ipAddress,
                userAgent
            );

            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 重置登录失败次数
        await User.resetLoginAttempts(user.id);

        // 更新最后登录时间
        await User.updateLastLogin(user.id);

        // 生成令牌
        const tokenResponse = jwtUtil.createTokenResponse(user);

        // 计算过期时间
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24小时后过期

        // 创建会话
        await Session.create({
            user_id: user.id,
            token: tokenResponse.token,
            refresh_token: tokenResponse.refreshToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt
        });

        // 记录登录日志
        await logUserAction(
            user.id,
            'LOGIN_SUCCESS',
            '用户登录成功',
            'success',
            ipAddress,
            userAgent
        );

        // 设置 Cookie
        res.cookie('token', tokenResponse.token, jwtConfig.cookieOptions);
        res.cookie('refreshToken', tokenResponse.refreshToken, jwtConfig.refreshCookieOptions);

        return res.json({
            success: true,
            message: '登录成功',
            data: tokenResponse
        });

    } catch (error) {
        console.error('登录错误:', error);
        return res.status(500).json({
            success: false,
            message: '登录失败，请稍后再试'
        });
    }
}

/**
 * 注册
 * POST /api/auth/register
 */
async function register(req, res) {
    try {
        const { username, email, password } = req.body;
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

        // 检查密码强度
        const passwordCheck = checkPasswordStrength(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({
                success: false,
                message: passwordCheck.message
            });
        }

        // 创建用户（默认禁用状态）
        const userId = await User.create({
            username,
            email,
            password,
            role: 'user',
            is_active: 0  // 新注册用户默认禁用
        });

        // 记录注册日志
        await logUserAction(
            userId,
            'REGISTER_SUCCESS',
            '用户注册成功，等待管理员审核',
            'success',
            ipAddress,
            userAgent
        );

        // 不自动登录，直接返回成功消息
        return res.status(201).json({
            success: true,
            message: '恭喜注册成功，请联系管理员开通权限',
            data: {
                username,
                email,
                needActivation: true
            }
        });

    } catch (error) {
        console.error('注册错误:', error);
        return res.status(500).json({
            success: false,
            message: '注册失败，请稍后再试'
        });
    }
}

/**
 * 登出
 * POST /api/auth/logout
 */
async function logout(req, res) {
    try {
        const token = jwtUtil.extractToken(req);
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';

        if (token) {
            // 删除会话
            await Session.delete(token);
        }

        // 记录登出日志
        if (req.user) {
            await logUserAction(
                req.user.id,
                'LOGOUT',
                '用户登出',
                'success',
                ipAddress,
                userAgent
            );
        }

        // 清除 Cookie
        res.clearCookie('token');
        res.clearCookie('refreshToken');

        return res.json({
            success: true,
            message: '登出成功'
        });

    } catch (error) {
        console.error('登出错误:', error);
        return res.status(500).json({
            success: false,
            message: '登出失败'
        });
    }
}

/**
 * 检查登录状态
 * GET /api/auth/check
 */
async function check(req, res) {
    try {
        // req.user 已经由 authenticate 中间件设置
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未登录'
            });
        }

        return res.json({
            success: true,
            message: '已登录',
            data: {
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                    avatar_url: req.user.avatar_url,
                    full_name: req.user.full_name
                }
            }
        });

    } catch (error) {
        console.error('检查登录状态错误:', error);
        return res.status(500).json({
            success: false,
            message: '检查登录状态失败'
        });
    }
}

/**
 * 刷新令牌
 * POST /api/auth/refresh
 */
async function refreshToken(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: '未提供刷新令牌'
            });
        }

        // 验证刷新令牌
        const decoded = jwtUtil.verifyToken(refreshToken);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: '刷新令牌无效或已过期'
            });
        }

        // 检查会话是否存在
        const session = await Session.findByRefreshToken(refreshToken);

        if (!session) {
            return res.status(401).json({
                success: false,
                message: '会话不存在或已过期'
            });
        }

        // 获取用户信息
        const user = await User.findById(decoded.userId);

        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }

        // 生成新令牌
        const newTokenResponse = jwtUtil.createTokenResponse(user);

        // 计算新过期时间
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + 24);

        // 更新会话
        await Session.updateToken(
            session.id,
            newTokenResponse.token,
            newTokenResponse.refreshToken,
            newExpiresAt
        );

        // 设置新 Cookie
        res.cookie('token', newTokenResponse.token, jwtConfig.cookieOptions);
        res.cookie('refreshToken', newTokenResponse.refreshToken, jwtConfig.refreshCookieOptions);

        return res.json({
            success: true,
            message: '令牌刷新成功',
            data: newTokenResponse
        });

    } catch (error) {
        console.error('刷新令牌错误:', error);
        return res.status(500).json({
            success: false,
            message: '刷新令牌失败'
        });
    }
}

module.exports = {
    login,
    register,
    logout,
    check,
    refreshToken
};

