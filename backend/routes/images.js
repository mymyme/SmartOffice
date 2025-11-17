// 图片管理路由
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate: authMiddleware } = require('../middleware/auth');

// 配置multer存储
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            // 按用户ID和月份创建目录
            const userId = req.user.id;
            const date = new Date();
            const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
            const uploadDir = path.join(__dirname, '../../uploads/images', `user_${userId}`, yearMonth);

            // 确保目录存在
            await fs.mkdir(uploadDir, { recursive: true });

            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const ext = path.extname(file.originalname);
        const hash = crypto.randomBytes(16).toString('hex');
        cb(null, `${hash}${ext}`);
    }
});

// 文件过滤器
const fileFilter = function (req, file, cb) {
    // 只允许图片类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('只支持图片文件格式: JPG, PNG, GIF, WebP, SVG'), false);
    }
};

// 配置multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/**
 * @route   POST /api/images/upload
 * @desc    上传图片
 * @access  Private (需要登录)
 */
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片文件'
            });
        }

        const userId = req.user.id;
        const file = req.file;

        // 获取图片尺寸
        let width = null;
        let height = null;
        try {
            const metadata = await sharp(file.path).metadata();
            width = metadata.width;
            height = metadata.height;
        } catch (err) {
            console.error('获取图片尺寸失败:', err);
        }

        // 生成缩略图
        const thumbnailDir = path.join(path.dirname(file.path), '..', '..', 'thumbnails', `user_${userId}`, path.basename(path.dirname(file.path)));
        await fs.mkdir(thumbnailDir, { recursive: true });

        const thumbnailFilename = `thumb_${file.filename}`;
        const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

        try {
            await sharp(file.path)
                .resize(300, 300, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .toFile(thumbnailPath);
        } catch (err) {
            console.error('生成缩略图失败:', err);
        }

        // 生成访问URL
        const relativePath = path.relative(path.join(__dirname, '../../uploads'), file.path);
        const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;

        const thumbnailRelativePath = path.relative(path.join(__dirname, '../../uploads'), thumbnailPath);
        const thumbnailUrl = `/uploads/${thumbnailRelativePath.replace(/\\/g, '/')}`;

        // 保存到数据库
        const result = await db.query(
            `INSERT INTO images
            (user_id, filename, original_name, file_size, mime_type, width, height, storage_path, url, thumbnail_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                file.filename,
                file.originalname,
                file.size,
                file.mimetype,
                width,
                height,
                file.path,
                url,
                thumbnailUrl
            ]
        );

        res.json({
            success: true,
            message: '图片上传成功',
            data: {
                id: result.insertId,
                filename: file.filename,
                original_name: file.originalname,
                file_size: file.size,
                mime_type: file.mimetype,
                width,
                height,
                url,
                thumbnail_url: thumbnailUrl,
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('上传图片错误:', error);

        // 删除已上传的文件
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (err) {
                console.error('删除文件失败:', err);
            }
        }

        res.status(500).json({
            success: false,
            message: '上传失败: ' + error.message
        });
    }
});

/**
 * @route   GET /api/images/list
 * @desc    获取当前用户的图片列表
 * @access  Private (需要登录)
 */
router.get('/list', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 50, search = '' } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // 构建查询条件
        let whereClause = 'WHERE user_id = ?';
        let queryParams = [userId];

        if (search) {
            whereClause += ' AND (original_name LIKE ? OR filename LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // 查询总数
        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM images ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // 查询图片列表
        // 注意: MySQL的prepared statement不支持LIMIT/OFFSET使用占位符
        // 必须确保limit和offset是安全的整数
        const safeLimit = parseInt(limit) || 50;
        const safeOffset = parseInt(offset) || 0;
        
        const images = await db.query(
            `SELECT id, filename, original_name, file_size, mime_type, width, height,
                    url, thumbnail_url, usage_count, created_at, updated_at
             FROM images
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT ${safeLimit} OFFSET ${safeOffset}`,
            queryParams
        );

        res.json({
            success: true,
            data: {
                images,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('获取图片列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取图片列表失败: ' + error.message
        });
    }
});

/**
 * @route   GET /api/images/:id
 * @desc    获取单个图片信息
 * @access  Private (需要登录且是图片所有者)
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const imageId = req.params.id;
        const userId = req.user.id;

        const images = await db.query(
            'SELECT * FROM images WHERE id = ? AND user_id = ?',
            [imageId, userId]
        );

        if (images.length === 0) {
            return res.status(404).json({
                success: false,
                message: '图片不存在或无权访问'
            });
        }

        res.json({
            success: true,
            data: images[0]
        });
    } catch (error) {
        console.error('获取图片信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取图片信息失败: ' + error.message
        });
    }
});

/**
 * @route   DELETE /api/images/:id
 * @desc    删除图片
 * @access  Private (需要登录且是图片所有者)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const imageId = req.params.id;
        const userId = req.user.id;

        // 查询图片信息
        const images = await db.query(
            'SELECT * FROM images WHERE id = ? AND user_id = ?',
            [imageId, userId]
        );

        if (images.length === 0) {
            return res.status(404).json({
                success: false,
                message: '图片不存在或无权删除'
            });
        }

        const image = images[0];

        // 删除文件
        try {
            if (image.storage_path) {
                await fs.unlink(image.storage_path);
            }

            // 删除缩略图
            if (image.thumbnail_url) {
                const thumbnailPath = path.join(__dirname, '../../uploads', image.thumbnail_url.replace('/uploads/', ''));
                await fs.unlink(thumbnailPath).catch(err => console.error('删除缩略图失败:', err));
            }
        } catch (err) {
            console.error('删除文件失败:', err);
        }

        // 从数据库删除记录
        await db.query('DELETE FROM images WHERE id = ?', [imageId]);

        res.json({
            success: true,
            message: '图片已删除'
        });
    } catch (error) {
        console.error('删除图片错误:', error);
        res.status(500).json({
            success: false,
            message: '删除图片失败: ' + error.message
        });
    }
});

module.exports = router;

