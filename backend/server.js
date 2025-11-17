// Monaco Editor Backend API Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 导入配置和路由
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const imageRoutes = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 3006;

// ========================
// 中间件配置
// ========================

// CORS 配置 - 必须在所有其他中间件之前
const defaultOrigins = [
    'http://localhost:3005',
    'http://localhost:3006',
    'http://8.152.98.33:8300',  // FRP前端端口
    'http://8.152.98.33:8301'   // FRP后端端口
];

// 检查 origin 是否允许的函数
function isOriginAllowed(origin) {
    if (!origin) return true;

    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
        : defaultOrigins;

    if (allowedOrigins.indexOf(origin) !== -1) {
        return true;
    }

    if (origin.match(/^http:\/\/(8\.152\.98\.33|191\.0\.12\.75):\d+$/)) {
        return true;
    }

    return false;
}

// 手动处理 OPTIONS 预检请求（必须在所有其他中间件之前）
app.options('*', (req, res) => {
    const origin = req.headers.origin;

    if (isOriginAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
        res.setHeader('Access-Control-Max-Age', '86400');
    }

    res.status(200).end();
});

const corsOptions = {
    origin: function (origin, callback) {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            console.warn('❌ CORS拒绝:', origin);
            callback(new Error('不允许的 CORS 源'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    maxAge: 86400
};

app.use(cors(corsOptions));

// 安全头部 - 在 CORS 之后，避免干扰 CORS 头
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

// 请求日志
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie 解析
app.use(cookieParser());

// 静态文件服务 - 提供上传的文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 速率限制 - 跳过 OPTIONS 预检请求
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS' // 跳过预检请求
});

// 应用到所有API路由
app.use('/api/', limiter);

// 登录接口的特殊限制
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5次尝试
    message: {
        success: false,
        message: '登录尝试次数过多，请15分钟后再试'
    }
});

// ========================
// 路由配置
// ========================

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Monaco Editor Backend API is running',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// 静态文件服务 - 上传的图片
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imageRoutes);

// 根路径
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Monaco Editor Backend API',
        version: '2.0.0',
        endpoints: {
            health: '/health',
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                logout: 'POST /api/auth/logout',
                check: 'GET /api/auth/check',
                refresh: 'POST /api/auth/refresh'
            },
            user: {
                profile: 'GET /api/user/profile',
                updateProfile: 'PUT /api/user/profile',
                changePassword: 'POST /api/user/change-password',
                uploadAvatar: 'POST /api/user/avatar',
                deleteAvatar: 'DELETE /api/user/avatar'
            },
            admin: {
                users: 'GET /api/admin/users',
                userDetail: 'GET /api/admin/users/:id',
                createUser: 'POST /api/admin/users',
                updateUser: 'PUT /api/admin/users/:id',
                deleteUser: 'DELETE /api/admin/users/:id',
                stats: 'GET /api/admin/stats'
            }
        }
    });
});

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在',
        path: req.originalUrl
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);

    // Multer 文件上传错误
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: '文件大小超过限制（最大2MB）'
        });
    }

    // 其他错误
    res.status(err.status || 500).json({
        success: false,
        message: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========================
// 启动服务器
// ========================

async function startServer() {
    try {
        // 测试数据库连接
        console.log('🔍 正在测试数据库连接...');
        const dbConnected = await db.testConnection();

        if (!dbConnected) {
            console.error('❌ 无法连接到数据库，服务器启动失败');
            process.exit(1);
        }

        // 启动HTTP服务器 - 监听所有网络接口
        app.listen(PORT, '0.0.0.0', () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🚀 Monaco Editor Backend API 已启动！');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`   环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   端口: ${PORT}`);
            console.log(`   地址: http://localhost:${PORT}`);
            console.log(`   外部访问: http://0.0.0.0:${PORT}`);
            console.log(`   健康检查: http://localhost:${PORT}/health`);
            console.log(`   API文档: http://localhost:${PORT}/`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💡 提示：按 Ctrl+C 停止服务器');
            console.log('');
        });

    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭服务器...');

    // 关闭数据库连接
    await db.pool.end();
    console.log('✅ 数据库连接已关闭');

    console.log('✅ 服务器已关闭');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 正在关闭服务器...');
    await db.pool.end();
    console.log('✅ 服务器已关闭');
    process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
});

// 启动服务器
startServer();

module.exports = app;

