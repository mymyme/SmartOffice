// 文件上传工具
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const crypto = require('crypto');

require('dotenv').config();

const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

// 确保上传目录存在
if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

/**
 * 生成唯一文件名
 * @param {string} originalName - 原始文件名
 * @returns {string} 新文件名
 */
function generateFileName(originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const randomString = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `avatar_${timestamp}_${randomString}${ext}`;
}

/**
 * 文件过滤器
 */
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (ALLOWED_TYPES.includes(mimeType) && ALLOWED_EXTENSIONS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('只支持 JPG, PNG 和 GIF 格式的图片'));
    }
};

/**
 * Multer 存储配置
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, AVATAR_DIR);
    },
    filename: (req, file, cb) => {
        const fileName = generateFileName(file.originalname);
        cb(null, fileName);
    }
});

/**
 * 创建 Multer 实例
 */
const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
});

/**
 * 处理头像图片（调整大小、压缩）
 * @param {string} filePath - 文件路径
 * @param {number} size - 目标尺寸（正方形）
 * @returns {Promise<string>} 处理后的文件路径
 */
async function processAvatar(filePath, size = 200) {
    try {
        const processedPath = filePath.replace(
            path.extname(filePath),
            '_processed' + path.extname(filePath)
        );

        await sharp(filePath)
            .resize(size, size, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 85 })
            .toFile(processedPath);

        // 删除原始文件
        fs.unlinkSync(filePath);

        // 重命名处理后的文件
        fs.renameSync(processedPath, filePath);

        return filePath;
    } catch (error) {
        console.error('图片处理失败:', error);
        throw new Error('图片处理失败');
    }
}

/**
 * 删除头像文件
 * @param {string} avatarUrl - 头像URL
 * @returns {boolean} 是否成功删除
 */
function deleteAvatar(avatarUrl) {
    try {
        // 跳过默认头像
        if (avatarUrl.includes('default-avatar')) {
            return false;
        }

        const fileName = path.basename(avatarUrl);
        const filePath = path.join(AVATAR_DIR, fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`删除头像文件: ${fileName}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error('删除头像失败:', error);
        return false;
    }
}

/**
 * 获取头像URL
 * @param {string} fileName - 文件名
 * @returns {string} 头像URL
 */
function getAvatarUrl(fileName) {
    return `/uploads/avatars/${fileName}`;
}

module.exports = {
    upload,
    processAvatar,
    deleteAvatar,
    getAvatarUrl,
    AVATAR_DIR,
    MAX_FILE_SIZE
};

