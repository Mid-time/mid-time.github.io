// ================================
// 统一数据管理器 - 负责数据加载和缓存
// ================================
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
    
    // 获取数据来源信息
    getSourceInfo() {
        return {
            items: {
                count: this.cachedItems ? this.cachedItems.length : 0,
                timestamp: this.cacheTimestamp
            },
            specialties: {
                count: this.cachedSpecialties ? this.cachedSpecialties.length : 0,
                timestamp: this.cacheTimestamp
            }
        };
    }
    
    // 强制刷新数据
    forceRefresh() {
        this.cachedItems = null;
        this.cachedSpecialties = null;
        return Promise.all([this.loadItems(), this.loadSpecialties()]);
    }
    
    // 加载物品数据
    async loadItems() {
        // 如果缓存有效且存在，直接返回缓存
        if (this.cachedItems && this.isCacheValid()) {
            console.log('使用缓存的物品数据');
            return this.cachedItems;
        }
        
        console.log('开始加载物品数据...');
        try {
            const response = await fetch(this.dataUrls.items);
            const csvText = await response.text();
            this.cachedItems = this.parseCSV(csvText, 'items');
            this.cacheTimestamp = Date.now();
            console.log(`物品数据加载完成，共${this.cachedItems.length}条`);
            return this.cachedItems;
        } catch (error) {
            console.error('加载物品数据失败:', error);
            // 返回空数组而不是抛出错误
            return [];
        }
    }
    
    // 加载特质数据
    async loadSpecialties() {
        // 如果缓存有效且存在，直接返回缓存
        if (this.cachedSpecialties && this.isCacheValid()) {
            console.log('使用缓存的特质数据');
            return this.cachedSpecialties;
        }
        
        console.log('开始加载特质数据...');
        try {
            const response = await fetch(this.dataUrls.specialties);
            const csvText = await response.text();
            this.cachedSpecialties = this.parseCSV(csvText, 'specialties');
            this.cacheTimestamp = Date.now();
            console.log(`特质数据加载完成，共${this.cachedSpecialties.length}条`);
            return this.cachedSpecialties;
        } catch (error) {
            console.error('加载特质数据失败:', error);
            // 返回空数组而不是抛出错误
            return [];
        }
    }
    
    // 通用CSV解析函数
    parseCSV(csvText, type) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return [];
        
        // 检测并移除UTF-8 BOM
        let headers = lines[0].replace(/^\uFEFF/, '').split(',');
        
        // 清洗表头，移除可能的空格
        headers = headers.map(header => header.trim());
        
        const items = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            const item = {};
            
            headers.forEach((header, index) => {
                let value = values[index] || '';
                value = value.trim();
                
                if (header === 'id') {
                    item[header] = parseInt(value) || i;
                } else if (header === 'cost' || header === 'weight') {
                    item[header] = parseFloat(value) || 0;
                } else if (header === 'level') {
                    item[header] = parseInt(value) || 1;
                } else if (header === 'tags' || header === 'tag' || header === 'need') {
                    // 处理数组字段
                    if (value.startsWith('{') && value.endsWith('}')) {
                        // 花括号格式
                        const inner = value.substring(1, value.length - 1);
                        item[header] = inner.split('/').map(v => v.trim());
                    } else if (value.includes(';')) {
                        // 分号分隔格式
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
            
            // 确保必要字段存在
            if (!item.id) item.id = i;
            if (!item.name) item.name = `未知${type === 'items' ? '物品' : '特质'}${i}`;
            if (type === 'specialties' && !item.level) item.level = 1;
            
            items.push(item);
        }
        
        return items;
    }
    
    // 解析CSV行（处理逗号在引号内的情况）
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }
    
    // 检查缓存是否有效
    isCacheValid() {
        if (!this.cacheTimestamp) return false;
        return Date.now() - this.cacheTimestamp < this.cacheDuration;
    }
}