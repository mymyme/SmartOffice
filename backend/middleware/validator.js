// 输入验证中间件
const { body, param, query, validationResult } = require('express-validator');

/**
 * 处理验证错误
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '输入验证失败',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
}

/**
 * 登录验证规则
 */
const validateLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('用户名不能为空')
        .isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间'),
    body('password')
        .notEmpty().withMessage('密码不能为空')
        .isLength({ min: 8 }).withMessage('密码至少需要8个字符'),
    handleValidationErrors
];

/**
 * 注册验证规则
 */
const validateRegister = [
    body('username')
        .trim()
        .notEmpty().withMessage('用户名不能为空')
        .isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
    body('email')
        .trim()
        .notEmpty().withMessage('邮箱不能为空')
        .isEmail().withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('密码不能为空')
        .isLength({ min: 8, max: 128 }).withMessage('密码长度必须在8-128个字符之间')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('密码必须包含大写字母、小写字母和数字'),
    body('confirmPassword')
        .notEmpty().withMessage('确认密码不能为空')
        .custom((value, { req }) => value === req.body.password).withMessage('两次输入的密码不一致'),
    handleValidationErrors
];

/**
 * 修改密码验证规则
 */
const validateChangePassword = [
    body('oldPassword')
        .notEmpty().withMessage('请输入当前密码'),
    body('newPassword')
        .notEmpty().withMessage('新密码不能为空')
        .isLength({ min: 8, max: 128 }).withMessage('密码长度必须在8-128个字符之间')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('密码必须包含大写字母、小写字母和数字')
        .custom((value, { req }) => value !== req.body.oldPassword).withMessage('新密码不能与当前密码相同'),
    body('confirmPassword')
        .notEmpty().withMessage('确认密码不能为空')
        .custom((value, { req }) => value === req.body.newPassword).withMessage('两次输入的密码不一致'),
    handleValidationErrors
];

/**
 * 更新用户信息验证规则
 */
const validateUpdateProfile = [
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    body('full_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('姓名长度不能超过100个字符'),
    body('phone')
        .optional()
        .trim()
        .matches(/^1[3-9]\d{9}$/).withMessage('请输入有效的手机号码'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('个人简介不能超过500个字符'),
    handleValidationErrors
];

/**
 * 管理员创建用户验证规则
 */
const validateAdminCreateUser = [
    body('username')
        .trim()
        .notEmpty().withMessage('用户名不能为空')
        .isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
    body('email')
        .trim()
        .notEmpty().withMessage('邮箱不能为空')
        .isEmail().withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('密码不能为空')
        .isLength({ min: 8, max: 128 }).withMessage('密码长度必须在8-128个字符之间'),
    body('role')
        .optional()
        .isIn(['user', 'admin']).withMessage('角色只能是user或admin'),
    body('full_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('姓名长度不能超过100个字符'),
    handleValidationErrors
];

/**
 * 管理员更新用户验证规则
 */
const validateAdminUpdateUser = [
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    body('role')
        .optional()
        .isIn(['user', 'admin']).withMessage('角色只能是user或admin'),
    body('is_active')
        .optional()
        .isBoolean().withMessage('is_active必须是布尔值'),
    body('full_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('姓名长度不能超过100个字符'),
    handleValidationErrors
];

/**
 * 用户ID参数验证
 */
const validateUserId = [
    param('id')
        .isInt({ min: 1 }).withMessage('用户ID必须是正整数'),
    handleValidationErrors
];

/**
 * 分页参数验证
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validateChangePassword,
    validateUpdateProfile,
    validateAdminCreateUser,
    validateAdminUpdateUser,
    validateUserId,
    validatePagination
};

