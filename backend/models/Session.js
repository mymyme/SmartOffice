// 会话模型
const db = require('../config/database');

class Session {
    /**
     * 创建新会话
     */
    static async create(sessionData) {
        const { user_id, token, refresh_token, ip_address, user_agent, expires_at } = sessionData;

        const result = await db.query(
            `INSERT INTO ${db.tables.sessions}
             (user_id, token, refresh_token, ip_address, user_agent, expires_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [user_id, token, refresh_token, ip_address, user_agent, expires_at]
        );

        return result.insertId;
    }

    /**
     * 根据token查找会话
     */
    static async findByToken(token) {
        const sessions = await db.query(
            `SELECT * FROM ${db.tables.sessions} WHERE token = ? AND expires_at > NOW()`,
            [token]
        );
        return sessions[0] || null;
    }

    /**
     * 根据refresh token查找会话
     */
    static async findByRefreshToken(refreshToken) {
        const sessions = await db.query(
            `SELECT * FROM ${db.tables.sessions} WHERE refresh_token = ? AND expires_at > NOW()`,
            [refreshToken]
        );
        return sessions[0] || null;
    }

    /**
     * 更新会话token
     */
    static async updateToken(id, newToken, newRefreshToken, newExpiresAt) {
        await db.query(
            `UPDATE ${db.tables.sessions}
             SET token = ?, refresh_token = ?, expires_at = ?
             WHERE id = ?`,
            [newToken, newRefreshToken, newExpiresAt, id]
        );
        return true;
    }

    /**
     * 删除会话（登出）
     */
    static async delete(token) {
        await db.query(
            `DELETE FROM ${db.tables.sessions} WHERE token = ?`,
            [token]
        );
        return true;
    }

    /**
     * 删除用户的所有会话
     */
    static async deleteAllByUserId(userId) {
        await db.query(
            `DELETE FROM ${db.tables.sessions} WHERE user_id = ?`,
            [userId]
        );
        return true;
    }

    /**
     * 清理过期会话
     */
    static async cleanExpired() {
        const result = await db.query(
            `DELETE FROM ${db.tables.sessions} WHERE expires_at < NOW()`
        );
        return result.affectedRows;
    }

    /**
     * 获取用户的活动会话列表
     */
    static async getActiveSessionsByUserId(userId) {
        const sessions = await db.query(
            `SELECT id, ip_address, user_agent, created_at, expires_at
             FROM ${db.tables.sessions}
             WHERE user_id = ? AND expires_at > NOW()
             ORDER BY created_at DESC`,
            [userId]
        );
        return sessions;
    }

    /**
     * 获取在线用户数（最近5分钟内活跃）
     * 定义：会话未过期且最近5分钟内有更新活动
     */
    static async getOnlineUsersCount() {
        const result = await db.query(
            `SELECT COUNT(DISTINCT user_id) as count
             FROM ${db.tables.sessions}
             WHERE expires_at > NOW()
               AND updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
            []
        );
        return result[0]?.count || 0;
    }

    /**
     * 获取在线用户详情列表（最近5分钟内活跃）
     * 返回在线用户的基本信息
     */
    static async getOnlineUsers() {
        const users = await db.query(
            `SELECT DISTINCT
                u.id,
                u.username,
                u.avatar_url,
                s.updated_at as last_activity
             FROM ${db.tables.sessions} s
             JOIN ${db.tables.users} u ON s.user_id = u.id
             WHERE s.expires_at > NOW()
               AND s.updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
             ORDER BY s.updated_at DESC`,
            []
        );
        return users;
    }
}

module.exports = Session;

