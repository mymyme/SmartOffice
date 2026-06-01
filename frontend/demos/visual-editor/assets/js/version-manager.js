/**
 * 代码块版本管理器 - 数据库存储版本
 * 方案C：纯数据库存储
 */
class CodeBlockVersionManager {
    constructor(apiBaseURL, getToken) {
        this.versions = {}; // 内存缓存：{ blockId: { versions: [], currentVersion: number } }
        this.currentConversationId = ''; // 当前会话ID
        this.maxVersionsPerBlock = 50; // 每个代码块最多保留的版本数
        this.apiBaseURL = apiBaseURL; // API基础URL
        this.getToken = getToken; // 获取token的函数
        this.isLoading = false; // 是否正在加载
        this.loadPromise = null; // 加载Promise，避免重复加载
    }

    /**
     * 设置当前会话ID并从数据库加载对应的版本数据
     * @param {string} conversationId - 会话ID
     */
    async switchConversation(conversationId) {
        if (this.currentConversationId === conversationId) {
            return;
        }

        // 切换到新会话
        this.currentConversationId = conversationId;
        this.versions = {};
        this.loadPromise = null;

        // 从数据库加载新会话的版本数据
        await this.load();
    }

    /**
     * 从数据库加载版本数据
     */
    async load() {
        if (!this.currentConversationId) {
            console.warn('[版本管理] 无会话ID，跳过加载');
            return;
        }

        // 如果正在加载，返回现有的Promise
        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = this._loadFromAPI();

        try {
            await this.loadPromise;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 从API加载版本数据（内部方法）
     */
    async _loadFromAPI() {
        try {
            const token = this.getToken();
            if (!token) {
                console.warn('[版本管理] 未登录，跳过加载');
                return;
            }

            const response = await fetch(
                `${this.apiBaseURL}/code-versions/session/${this.currentConversationId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('[版本管理] 会话无版本数据');
                    this.versions = {};
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.code === 200 && result.data) {
                this.versions = result.data.blocks || {};
                console.log('[版本管理] 已从数据库加载版本数据:', Object.keys(this.versions).length, '个代码块');
            } else {
                console.warn('[版本管理] 加载响应异常:', result.message);
                this.versions = {};
            }
        } catch (error) {
            console.error('[版本管理] 从数据库加载版本数据失败:', error);
            this.versions = {};
        }
    }

    /**
     * 保存版本数据到数据库（单个版本）
     * @param {string} blockId - 代码块ID
     * @param {number} version - 版本号
     * @param {string} content - 代码内容
     * @param {boolean} isOriginal - 是否为原始版本
     */
    async _saveVersionToAPI(blockId, version, content, isOriginal) {
        try {
            const token = this.getToken();
            if (!token) {
                console.warn('[版本管理] 未登录，无法保存到数据库');
                return false;
            }

            const response = await fetch(
                `${this.apiBaseURL}/code-versions/save`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        session_id: this.currentConversationId,
                        block_id: blockId,
                        version: version,
                        content: content,
                        is_original: isOriginal
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.code === 200) {
                console.log(`[版本管理] 已保存版本到数据库: ${blockId} v${version}`);
                return true;
            } else {
                console.error('[版本管理] 保存版本失败:', result.message);
                return false;
            }
        } catch (error) {
            console.error('[版本管理] 保存版本到数据库失败:', error);
            return false;
        }
    }

    /**
     * 更新当前激活版本到数据库
     * @param {string} blockId - 代码块ID
     * @param {number} currentVersion - 当前版本号
     */
    async _updateCurrentVersionToAPI(blockId, currentVersion) {
        try {
            const token = this.getToken();
            if (!token) {
                return false;
            }

            const response = await fetch(
                `${this.apiBaseURL}/code-versions/current`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        session_id: this.currentConversationId,
                        block_id: blockId,
                        current_version: currentVersion
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return result.code === 200;
        } catch (error) {
            console.error('[版本管理] 更新当前版本失败:', error);
            return false;
        }
    }

    /**
     * 从数据库删除版本
     * @param {string} blockId - 代码块ID
     * @param {number} version - 版本号
     */
    async _deleteVersionFromAPI(blockId, version) {
        try {
            const token = this.getToken();
            if (!token) {
                return false;
            }

            const response = await fetch(
                `${this.apiBaseURL}/code-versions/delete`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        session_id: this.currentConversationId,
                        block_id: blockId,
                        version: version
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.code === 200) {
                console.log(`[版本管理] 已从数据库删除版本: ${blockId} v${version}`);
                return true;
            } else {
                console.error('[版本管理] 删除版本失败:', result.message);
                return false;
            }
        } catch (error) {
            console.error('[版本管理] 从数据库删除版本失败:', error);
            return false;
        }
    }

    /**
     * 创建新版本
     * @param {string} blockId - 代码块ID
     * @param {string} content - 代码内容
     * @param {boolean} isOriginal - 是否为原始版本（AI生成）
     * @returns {Promise<number|null>} 新版本号
     */
    async createVersion(blockId, content, isOriginal = false) {
        if (!blockId) {
            console.error('[版本管理] 创建版本失败：blockId为空');
            return null;
        }

        if (!content) {
            console.error('[版本管理] 创建版本失败：content为空');
            return null;
        }

        // 初始化代码块数据
        if (!this.versions[blockId]) {
            this.versions[blockId] = {
                versions: [],
                currentVersion: 0
            };
        }

        const blockData = this.versions[blockId];

        // 如果不是原始版本，检查内容是否有变化
        if (!isOriginal && blockData.currentVersion > 0) {
            const currentContent = this.getVersionContent(blockId, blockData.currentVersion);
            // 去除空白字符后比较
            if (currentContent && this.normalizeContent(currentContent) === this.normalizeContent(content)) {
                console.log('[版本管理] 内容无变化，跳过创建新版本');
                return blockData.currentVersion;
            }
        }

        // 计算新版本号
        const newVersionNumber = blockData.versions.length + 1;

        // 创建版本对象
        const version = {
            version: newVersionNumber,
            content: content,
            timestamp: Date.now(),
            isOriginal: isOriginal
        };

        // 保存到数据库
        const saved = await this._saveVersionToAPI(blockId, newVersionNumber, content, isOriginal);

        if (!saved) {
            console.error('[版本管理] 保存到数据库失败');
            return null;
        }

        // 更新内存缓存
        blockData.versions.push(version);
        blockData.currentVersion = newVersionNumber;

        // 更新当前版本到数据库
        await this._updateCurrentVersionToAPI(blockId, newVersionNumber);

        console.log(`[版本管理] 已创建版本 v${newVersionNumber} (代码块: ${blockId}, 原始: ${isOriginal})`);

        // 检查版本数限制
        if (blockData.versions.length > this.maxVersionsPerBlock) {
            console.warn(`[版本管理] 代码块 ${blockId} 版本数超过限制，需手动清理`);
        }

        return newVersionNumber;
    }

    /**
     * 获取代码块的所有版本
     * @param {string} blockId - 代码块ID
     * @returns {Array} 版本数组
     */
    getVersions(blockId) {
        const blockData = this.versions[blockId];
        return blockData ? blockData.versions : [];
    }

    /**
     * 获取指定版本的内容
     * @param {string} blockId - 代码块ID
     * @param {number} version - 版本号
     * @returns {string|null} 版本内容
     */
    getVersionContent(blockId, version) {
        const versions = this.getVersions(blockId);
        const versionObj = versions.find(v => v.version === version);
        return versionObj ? versionObj.content : null;
    }

    /**
     * 切换到指定版本
     * @param {string} blockId - 代码块ID
     * @param {number} version - 版本号
     * @returns {Promise<boolean>} 是否成功
     */
    async switchVersion(blockId, version) {
        const blockData = this.versions[blockId];
        if (!blockData) {
            console.error('[版本管理] 代码块不存在:', blockId);
            return false;
        }

        const versionObj = blockData.versions.find(v => v.version === version);
        if (!versionObj) {
            console.error('[版本管理] 版本不存在:', version);
            return false;
        }

        blockData.currentVersion = version;

        // 更新到数据库
        await this._updateCurrentVersionToAPI(blockId, version);

        console.log(`[版本管理] 已切换到版本 v${version}`);
        return true;
    }

    /**
     * 删除指定版本
     * @param {string} blockId - 代码块ID
     * @param {number} version - 版本号
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteVersion(blockId, version) {
        const blockData = this.versions[blockId];
        if (!blockData) {
            console.error('[版本管理] 代码块不存在:', blockId);
            return false;
        }

        const versionIndex = blockData.versions.findIndex(v => v.version === version);
        if (versionIndex === -1) {
            console.error('[版本管理] 版本不存在:', version);
            return false;
        }

        const versionObj = blockData.versions[versionIndex];

        // 不允许删除原始版本
        if (versionObj.isOriginal) {
            console.error('[版本管理] 不允许删除原始版本');
            alert('不能删除原始版本（v1）');
            return false;
        }

        // 从数据库删除
        const deleted = await this._deleteVersionFromAPI(blockId, version);

        if (!deleted) {
            console.error('[版本管理] 从数据库删除失败');
            return false;
        }

        // 从内存缓存删除
        blockData.versions.splice(versionIndex, 1);
        console.log(`[版本管理] 已删除版本 v${version}`);

        // 如果删除的是当前版本，切换到最新版本
        if (blockData.currentVersion === version) {
            blockData.currentVersion = blockData.versions.length > 0
                ? blockData.versions[blockData.versions.length - 1].version
                : 0;
            await this._updateCurrentVersionToAPI(blockId, blockData.currentVersion);
            console.log(`[版本管理] 已自动切换到版本 v${blockData.currentVersion}`);
        }

        return true;
    }

    /**
     * 获取当前激活的版本号
     * @param {string} blockId - 代码块ID
     * @returns {number} 当前版本号
     */
    getCurrentVersion(blockId) {
        const blockData = this.versions[blockId];
        return blockData ? blockData.currentVersion : 0;
    }

    /**
     * 检查代码块是否存在版本
     * @param {string} blockId - 代码块ID
     * @returns {boolean} 是否存在
     */
    hasVersions(blockId) {
        const versions = this.getVersions(blockId);
        return versions.length > 0;
    }

    /**
     * 标准化内容（用于比较）
     * 移除可视化编辑器的临时选中状态、空白字符等
     * @param {string} content - 内容
     * @returns {string} 标准化后的内容
     */
    normalizeContent(content) {
        if (!content) return '';

        let normalized = content;

        // 1. 移除可视化编辑器的临时class
        normalized = normalized.replace(/\s*preview-element-hover\s*/g, ' ');
        normalized = normalized.replace(/\s*preview-selection-highlight\s*/g, ' ');
        normalized = normalized.replace(/\s*editing-element\s*/g, ' ');
        normalized = normalized.replace(/\s*selected-element\s*/g, ' ');

        // 2. 移除可能的内联样式（如临时高亮）
        normalized = normalized.replace(/\s*style="[^"]*outline[^"]*"/gi, '');
        normalized = normalized.replace(/\s*style="[^"]*background[^"]*"/gi, '');

        // 3. 移除临时属性
        normalized = normalized.replace(/\s*contenteditable="[^"]*"/gi, '');
        normalized = normalized.replace(/\s*data-selected="[^"]*"/gi, '');
        normalized = normalized.replace(/\s*data-editing="[^"]*"/gi, '');

        // 4. 移除element-tag-tooltip元素
        normalized = normalized.replace(/<div[^>]*class="[^"]*element-tag-tooltip[^"]*"[^>]*>.*?<\/div>/gi, '');

        // 5. 清理空的class属性
        normalized = normalized.replace(/\s*class="\s*"\s*/g, ' ');
        normalized = normalized.replace(/\s*class=''\s*/g, ' ');

        // 6. 清理class中的多余空格
        normalized = normalized.replace(/class="([^"]*)"/g, (match, classes) => {
            const cleanClasses = classes.split(/\s+/).filter(c => c && c.trim()).join(' ');
            return cleanClasses ? `class="${cleanClasses}"` : '';
        });

        // 7. 统一HTML属性的空白（移除属性周围的多余空格）
        normalized = normalized.replace(/\s+=/g, '=');
        normalized = normalized.replace(/=\s+/g, '=');

        // 8. 规范化所有空白字符（空格、换行、制表符等）为单个空格
        normalized = normalized.replace(/[\s\n\r\t]+/g, ' ');

        // 9. 移除HTML标签之间的空白
        normalized = normalized.replace(/>\s+</g, '><');

        // 10. 移除标签前后的空白
        normalized = normalized.replace(/\s+>/g, '>');
        normalized = normalized.replace(/<\s+/g, '<');

        // 11. 最终trim
        normalized = normalized.trim();

        return normalized;
    }

    /**
     * 获取版本统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        const totalBlocks = Object.keys(this.versions).length;
        let totalVersions = 0;
        let totalSize = 0;

        Object.values(this.versions).forEach(blockData => {
            totalVersions += blockData.versions.length;
            blockData.versions.forEach(v => {
                totalSize += new Blob([v.content]).size;
            });
        });

        return {
            totalBlocks,
            totalVersions,
            totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    }

    /**
     * 获取最新操作的代码块ID和版本信息
     * @returns {Object|null} { blockId, version, content, currentVersion } 或 null
     */
    getLatestCodeBlock() {
        console.log('[getLatestCodeBlock] 开始查找最新代码块');
        console.log('[getLatestCodeBlock] this.versions:', this.versions);

        const blockIds = Object.keys(this.versions);
        console.log('[getLatestCodeBlock] 代码块ID列表:', blockIds);

        if (blockIds.length === 0) {
            console.log('[getLatestCodeBlock] 没有代码块，返回null');
            return null;
        }

        // 找到最新的代码块（根据版本的最新时间戳）
        let latestBlockId = null;
        let latestTimestamp = 0;
        let latestVersion = 0;

        blockIds.forEach(blockId => {
            const blockData = this.versions[blockId];
            console.log(`[getLatestCodeBlock] 检查代码块 ${blockId}:`, blockData);

            if (blockData && blockData.versions && blockData.versions.length > 0) {
                // 找到该代码块的最新版本
                const versions = blockData.versions;
                const newestVersion = versions[versions.length - 1];
                console.log(`[getLatestCodeBlock] ${blockId} 最新版本:`, newestVersion);

                if (newestVersion.timestamp > latestTimestamp) {
                    latestTimestamp = newestVersion.timestamp;
                    latestBlockId = blockId;
                    latestVersion = newestVersion.version;
                    console.log(`[getLatestCodeBlock] 更新最新: blockId=${blockId}, version=${latestVersion}, timestamp=${latestTimestamp}`);
                }
            }
        });

        if (!latestBlockId) {
            console.log('[getLatestCodeBlock] 未找到有效的代码块，返回null');
            return null;
        }

        const content = this.getVersionContent(latestBlockId, latestVersion);
        const currentVersion = this.getCurrentVersion(latestBlockId);

        console.log('[getLatestCodeBlock] 找到最新代码块:', {
            blockId: latestBlockId,
            version: latestVersion,
            currentVersion: currentVersion,
            contentLength: content ? content.length : 0
        });

        return {
            blockId: latestBlockId,
            version: latestVersion,
            currentVersion: currentVersion,
            content: content,
            timestamp: latestTimestamp
        };
    }

    /**
     * 清空所有版本数据（仅清除内存缓存，不删除数据库）
     */
    clear() {
        this.versions = {};
        console.log('[版本管理] 已清空内存缓存');
    }

    /**
     * 检查是否正在加载
     * @returns {boolean}
     */
    isLoadingData() {
        return this.isLoading;
    }
}

// 导出给全局使用
if (typeof window !== 'undefined') {
    window.CodeBlockVersionManager = CodeBlockVersionManager;
}
