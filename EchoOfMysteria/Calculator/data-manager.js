// ================================
// 统一数据管理器 - 负责数据加载和缓存
// 防止重复声明（若已声明则跳过）
// ================================
if (typeof UnifiedDataManager === 'undefined') {
    class UnifiedDataManager {
        constructor() {
            this.cachedItems = null;
            this.cachedSpecialties = null;
            this.cacheTimestamp = null;
            this.cacheDuration = 5 * 60 * 1000; // 5分钟缓存
            this.dataUrls = {
                items: 'Item.csv',
                specialties: 'Specialty.csv'
            };
        }

        getSourceInfo() {
            return {
                items: { count: this.cachedItems ? this.cachedItems.length : 0, timestamp: this.cacheTimestamp },
                specialties: { count: this.cachedSpecialties ? this.cachedSpecialties.length : 0, timestamp: this.cacheTimestamp }
            };
        }

        forceRefresh() {
            this.cachedItems = null;
            this.cachedSpecialties = null;
            return Promise.all([this.loadItems(), this.loadSpecialties()]);
        }

        async loadItems() {
            if (this.cachedItems && this.isCacheValid()) {
                console.log('使用缓存的物品数据');
                return this.cachedItems;
            }
            try {
                const response = await fetch(this.dataUrls.items);
                const csvText = await response.text();
                this.cachedItems = this.parseCSV(csvText, 'items');
                this.cacheTimestamp = Date.now();
                console.log(`物品数据加载完成，共${this.cachedItems.length}条`);
                return this.cachedItems;
            } catch (error) {
                console.error('加载物品数据失败:', error);
                return [];
            }
        }

        async loadSpecialties() {
            if (this.cachedSpecialties && this.isCacheValid()) {
                console.log('使用缓存的特质数据');
                return this.cachedSpecialties;
            }
            try {
                const response = await fetch(this.dataUrls.specialties);
                const csvText = await response.text();
                this.cachedSpecialties = this.parseCSV(csvText, 'specialties');
                this.cacheTimestamp = Date.now();
                console.log(`特质数据加载完成，共${this.cachedSpecialties.length}条`);
                return this.cachedSpecialties;
            } catch (error) {
                console.error('加载特质数据失败:', error);
                return [];
            }
        }

        // parseCSV: 支持双引号包裹、双引号转义（"" -> "），以及简单的花括号/分号数组处理
        parseCSV(csvText, type) {
            if (!csvText) return [];
            // 先统一处理换行为 \n
            const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const lines = normalized.trim().split('\n');
            if (lines.length === 0) return [];

            let headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
            const items = [];

            for (let i = 1; i < lines.length; i++) {
                let line = lines[i];
                if (!line) continue;
                const values = this.parseCSVLine(line);
                const item = {};
                headers.forEach((header, index) => {
                    let value = (values[index] !== undefined) ? values[index] : '';
                    value = value.trim();
                    if (header === 'id') {
                        item[header] = parseInt(value) || i;
                    } else if (header === 'cost') {
                        if (value.startsWith('{') && value.endsWith('}')) {
                            const inner = value.substring(1, value.length - 1);
                            if (inner.includes('/')) item[header] = inner.split('/').map(v => parseFloat(v.trim()) || 0);
                            else item[header] = parseFloat(inner) || 0;
                        } else {
                            item[header] = parseFloat(value) || 0;
                        }
                    } else if (header === 'weight') {
                        item[header] = parseFloat(value) || 0;
                    } else if (header === 'level') {
                        item[header] = parseInt(value) || 1;
                    } else if (header === 'tags' || header === 'tag' || header === 'need') {
                        if (value.startsWith('{') && value.endsWith('}')) {
                            const inner = value.substring(1, value.length - 1);
                            item[header] = inner.split('/').map(v => v.trim());
                        } else if (value.includes(';')) {
                            item[header] = value.split(';').map(v => v.trim()).filter(v => v !== '');
                        } else if (value) {
                            item[header] = [value];
                        } else {
                            item[header] = [];
                        }
                    } else if (header === 'description') {
                        if (value.startsWith('{') && value.endsWith('}')) {
                            const inner = value.substring(1, value.length - 1);
                            item[header] = inner.split('/').map(v => v.trim());
                        } else {
                            item[header] = value;
                        }
                    } else {
                        item[header] = value;
                    }
                });

                if (!item.id) item.id = i;
                if (!item.name) item.name = `未知${type === 'items' ? '物品' : '特质'}${i}`;
                if (type === 'specialties' && !item.level) item.level = 1;
                items.push(item);
            }

            return items;
        }

        // parseCSVLine: 处理双引号包裹字段、双引号转义
        parseCSVLine(line) {
            const values = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (ch === ',' && !inQuotes) {
                    values.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
            values.push(current);
            // 移除外层多余引号
            return values.map(v => {
                let t = v;
                if (t.startsWith('"') && t.endsWith('"')) {
                    t = t.substring(1, t.length - 1);
                }
                return t;
            });
        }

        isCacheValid() {
            if (!this.cacheTimestamp) return false;
            return (Date.now() - this.cacheTimestamp) < this.cacheDuration;
        }
    }

    // 导出到全局，方便其它模块引用
    window.UnifiedDataManager = UnifiedDataManager;
}
