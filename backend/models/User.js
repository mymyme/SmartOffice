// 用户模型
const db = require('../config/database');
const { hashPassword } = require('../utils/hash');

class User {
    /**
     * 根据ID查找用户
     */
    static async findById(id) {
        const users = await db.query(
            `SELECT id, username, email, avatar_url, role, full_name, phone, bio,
                    is_active, last_login_at, created_at, updated_at
             FROM ${db.tables.users}
             WHERE id = ?`,
            [id]
        );
        return users[0] || null;
    }

    /**
     * 根据用户名查找用户
     */
    static async findByUsername(username) {
        const users = await db.query(
            `SELECT * FROM ${db.tables.users} WHERE username = ?`,
            [username]
        );
        return users[0] || null;
    }

    /**
     * 根据邮箱查找用户
     */
    static async findByEmail(email) {
        const users = await db.query(
            `SELECT * FROM ${db.tables.users} WHERE email = ?`,
            [email]
        );
        return users[0] || null;
    }

    /**
     * 创建新用户
     */
    static async create(userData) {
        const { username, email, password, role = 'user', full_name, is_active } = userData;
        const password_hash = await hashPassword(password);

        // 如果没有明确指定 is_active，默认为 0（禁用）
        const activeStatus = is_active !== undefined ? is_active : 0;

        const [result] = await db.pool.execute(
            `INSERT INTO ${db.tables.users}
             (username, email, password_hash, role, full_name, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [username, email, password_hash, role, full_name || null, activeStatus]
        );

        return result.insertId;
    }

    /**
     * 更新用户信息
     */
    static async update(id, updateData) {
        const allowedFields = ['email', 'full_name', 'phone', 'bio', 'avatar_url', 'role', 'is_active'];
        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            return false;
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await db.query(
            `UPDATE ${db.tables.users} SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return true;
    }

    /**
     * 更新密码
     */
    static async updatePassword(id, newPassword) {
        const password_hash = await hashPassword(newPassword);

        await db.query(
            `UPDATE ${db.tables.users}
             SET password_hash = ?, updated_at = NOW()
             WHERE id = ?`,
            [password_hash, id]
        );

        return true;
    }

    /**
     * 更新最后登录时间
     */
    static async updateLastLogin(id) {
        await db.query(
            `UPDATE ${db.tables.users} SET last_login_at = NOW() WHERE id = ?`,
            [id]
        );
    }

    /**
     * 增加登录失败次数
     */
    static async incrementLoginAttempts(id) {
        await db.query(
            `UPDATE ${db.tables.users}
             SET login_attempts = login_attempts + 1,
                 locked_until = IF(login_attempts >= 4, DATE_ADD(NOW(), INTERVAL 30 MINUTE), locked_until)
             WHERE id = ?`,
            [id]
        );
    }

    /**
     * 重置登录失败次数
     */
    static async resetLoginAttempts(id) {
        await db.query(
            `UPDATE ${db.tables.users}
             SET login_attempts = 0, locked_until = NULL
             WHERE id = ?`,
            [id]
        );
    }

    /**
     * 检查账户是否被锁定
     */
    static async isLocked(id) {
        const users = await db.query(
            `SELECT locked_until FROM ${db.tables.users} WHERE id = ?`,
            [id]
        );

        if (!users[0] || !users[0].locked_until) {
            return false;
        }

        const lockedUntil = new Date(users[0].locked_until);
        const now = new Date();

        if (now < lockedUntil) {
            return true;
        }

        // 锁定时间已过，重置登录尝试次数
        await this.resetLoginAttempts(id);
        return false;
    }

    /**
     * 删除用户
     */
    static async delete(id) {
        await db.query(
            `DELETE FROM ${db.tables.users} WHERE id = ?`,
            [id]
        );
        return true;
    }

    /**
     * 软删除（禁用账户）
     */
    static async softDelete(id) {
        await db.query(
            `UPDATE ${db.tables.users} SET is_active = FALSE, updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return true;
    }

    /**
     * 获取用户列表（分页）
     */
    static async list(options = {}) {
        const {
            page = 1,
            limit = 20,
            search = '',
            role = null,
            isActive = null,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];

        // 搜索条件
        if (search) {
            conditions.push('(username LIKE ? OR email LIKE ? OR full_name LIKE ?)');
            const searchPattern = `%${search}%`;
            values.push(searchPattern, searchPattern, searchPattern);
        }

        // 角色筛选
        if (role) {
            conditions.push('role = ?');
            values.push(role);
        }

        // 状态筛选
        if (isActive !== null) {
            conditions.push('is_active = ?');
            values.push(isActive);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 查询总数
        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM ${db.tables.users} ${whereClause}`,
            values
        );

        const total = countResult[0].total;

        // 查询数据
        const allowedSortFields = ['id', 'username', 'email', 'role', 'created_at', 'last_login_at'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // LIMIT 和 OFFSET 不能使用参数绑定，需要直接拼接（已确保是整数）
        const limitValue = parseInt(limit);
        const offsetValue = parseInt(offset);
        const users = await db.query(
            `SELECT id, username, email, avatar_url, role, full_name, phone, bio,
                    is_active, last_login_at, created_at, updated_at
             FROM ${db.tables.users}
             ${whereClause}
             ORDER BY ${validSortBy} ${validSortOrder}
             LIMIT ${limitValue} OFFSET ${offsetValue}`,
            values
        );

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * 统计用户数
     */
    static async count(conditions = {}) {
        const { role = null, isActive = null } = conditions;
        const whereClauses = [];
        const values = [];

        if (role) {
            whereClauses.push('role = ?');
            values.push(role);
        }

        if (isActive !== null) {
            whereClauses.push('is_active = ?');
            values.push(isActive);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const result = await db.query(
            `SELECT COUNT(*) as count FROM ${db.tables.users} ${whereClause}`,
            values
        );

        return result[0].count;
    }
}

module.exports = User;

