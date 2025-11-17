// 密码加密工具
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * 加密密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 加密后的密码哈希
 */
async function hashPassword(password) {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return hash;
    } catch (error) {
        console.error('密码加密失败:', error);
        throw new Error('密码加密失败');
    }
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 密码哈希
 * @returns {Promise<boolean>} 验证结果
 */
async function verifyPassword(password, hash) {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    } catch (error) {
        console.error('密码验证失败:', error);
        return false;
    }
}

/**
 * 检查密码强度
 * @param {string} password - 密码
 * @returns {Object} { valid: boolean, message: string, strength: number }
 */
function checkPasswordStrength(password) {
    const result = {
        valid: false,
        message: '',
        strength: 0 // 0-4: 非常弱、弱、中等、强、非常强
    };

    // 基本长度检查
    if (!password || password.length < 8) {
        result.message = '密码至少需要8个字符';
        return result;
    }

    if (password.length > 128) {
        result.message = '密码不能超过128个字符';
        return result;
    }

    // 检查各种字符类型
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // 计算强度
    let strength = 0;
    if (hasLowerCase) strength++;
    if (hasUpperCase) strength++;
    if (hasNumber) strength++;
    if (hasSpecialChar) strength++;
    if (password.length >= 12) strength++;

    result.strength = Math.min(strength, 4);

    // 基本要求：至少包含大写、小写和数字
    if (!hasLowerCase || !hasUpperCase || !hasNumber) {
        result.message = '密码必须包含大写字母、小写字母和数字';
        return result;
    }

    // 检查常见弱密码
    const weakPasswords = [
        'password', '12345678', 'qwerty', 'abc123',
        'password123', 'admin123', 'test1234'
    ];

    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        result.message = '密码过于简单，请使用更复杂的密码';
        return result;
    }

    result.valid = true;
    result.message = '密码强度合格';
    return result;
}

module.exports = {
    hashPassword,
    verifyPassword,
    checkPasswordStrength
};

