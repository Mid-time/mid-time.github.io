// ================================
// 模块化设计：数据管理器
// ================================
class EchoDataManager {
    constructor() {
        this.dataSources = {
            items: [
                { type: 'local', url: './EchoItemCalculator/Item.csv', priority: 3 },
                { type: 'localStorage', key: 'echo_items_cache', priority: 2 },
                { type: 'builtin', data: this.getBuiltinItems(), priority: 1 }
            ]
        };
        
        this.sourceInfo = {
            items: { source: '未知', count: 0, version: null }
        };
        
        this.versionInfo = {
            items: null
        };
    }
    
    // 获取数据来源信息
    getSourceInfo() {
        return this.sourceInfo;
    }
    
    // 获取版本信息
    getVersionInfo() {
        return this.versionInfo;
    }
    
    // 加载物品数据
    async loadItems() {
        for (const source of this.dataSources.items.sort((a, b) => b.priority - a.priority)) {
            try {
                const data = await this.loadFromSource(source, 'items');
                if (data && data.length > 0) {
                    this.sourceInfo.items = { 
                        source: source.type, 
                        count: data.length,
                        version: this.versionInfo.items
                    };
                    return data;
                }
            } catch (error) {
                console.warn(`从 ${source.type} 加载物品数据失败:`, error.message);
            }
        }
        this.sourceInfo.items = { source: 'error', count: 0, version: null };
        throw new Error('所有物品数据源均加载失败');
    }
    
    // 从指定源加载数据
    async loadFromSource(source, dataType) {
        switch (source.type) {
            case 'local':
                return await this.loadRemoteData(source.url, dataType);
            case 'localStorage':
                return this.loadLocalStorageData(source.key, dataType);
            case 'builtin':
                return this.processBuiltinData(source.data, dataType);
            default:
                throw new Error(`未知数据源类型: ${source.type}`);
        }
    }
    
    // 加载远程数据
    async loadRemoteData(url, dataType) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const csvText = await response.text();
            const data = this.parseCSVData(csvText, dataType);
            
            // 缓存到localStorage
            this.cacheData(url, data, dataType);
            
            return data;
        } catch (error) {
            console.warn(`加载远程数据失败: ${url}`, error);
            return null;
        }
    }
    
    // 加载本地存储数据
    loadLocalStorageData(key, dataType) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const parsed = JSON.parse(cached);
            return this.processCachedData(parsed, dataType);
        } catch (error) {
            console.warn(`解析缓存数据失败:`, error);
            return null;
        }
    }
    
    // 处理内置数据
    processBuiltinData(data, dataType) {
        switch (dataType) {
            case 'items':
                return this.parseCSVData(data, 'items');
            default:
                throw new Error(`未知数据类型: ${dataType}`);
        }
    }
    
    // 缓存数据
    cacheData(key, data, dataType) {
        try {
            const cacheKey = this.getCacheKey(key, dataType);
            localStorage.setItem(cacheKey, JSON.stringify({
                data: data,
                timestamp: Date.now(),
                dataType: dataType,
                version: this.versionInfo[dataType]
            }));
        } catch (error) {
            console.warn('缓存数据失败:', error);
        }
    }
    
    // 获取缓存键
    getCacheKey(url, dataType) {
        return `echo_${dataType}_cache`;
    }
    
    // 处理缓存数据
    processCachedData(cached, dataType) {
        // 检查缓存是否过期 (24小时) 或版本不匹配
        const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000;
        const versionMismatch = cached.version !== this.versionInfo[dataType];
        
        if (isExpired || versionMismatch) {
            return null;
        }
        
        return cached.data;
    }
    
    // 解析CSV数据 - 支持日期校验码
    parseCSVData(csvText, dataType) {
        if (!csvText || csvText.trim() === '') {
            throw new Error('CSV内容为空');
        }
        
        const lines = csvText.trim().split('\n');
        
        // 检测第一行是否为日期校验码（8位数字）
        let startLine = 0;
        const firstLine = lines[0].trim();
        
        if (/^\d{8}$/.test(firstLine)) {
            console.log(`检测到日期校验码: ${firstLine}`);
            this.versionInfo[dataType] = firstLine;
            startLine = 1; // 跳过第一行
        }
        
        // 如果跳过了日期行，确保还有足够的行
        if (startLine >= lines.length) {
            throw new Error('CSV文件内容不足');
        }
        
        const headers = lines[startLine].split(',').map(header => header.trim());
        
        // 根据检测结果调整数据起始行
        const dataStartLine = startLine + 1;
        
        switch (dataType) {
            case 'items':
                return this.parseItemsCSV(lines, headers, dataStartLine);
            default:
                throw new Error(`未知数据类型: ${dataType}`);
        }
    }
    
    // 解析物品CSV - 支持自定义起始行
    parseItemsCSV(lines, headers, startLine = 1) {
        const items = [];
        
        for (let i = startLine; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = this.parseCSVLine(lines[i]);
            const item = {};
            
            headers.forEach((header, index) => {
                let value = values[index] || '';
                
                // 处理不同的数据类型
                if (header === 'tags' || header === 'need') {
                    value = value.split(';').map(tag => tag.trim()).filter(tag => tag !== '');
                } else if (header === 'cost' || header === 'weight') {
                    value = parseFloat(value) || 0;
                } else if (header === 'rarity' || header === 'material' || header === 'skill' || 
                           header === 'maintype' || header === 'subtype') {
                    value = value.trim();
                } else if (header === 'id') {
                    // 确保ID是字符串
                    value = value.toString().trim();
                } else {
                    value = value.trim();
                }
                
                item[header] = value;
            });
            
            // 确保有id字段
            if (!item.id) {
                item.id = `item_${i}`;
            }
            
            items.push(item);
        }
        
        return items;
    }
    
    // 解析CSV行，处理引号内的逗号
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result.map(field => field.trim());
    }
    
    // 强制刷新数据
    async forceRefresh() {
        // 清除所有缓存
        Object.values(this.dataSources).forEach(sources => {
            sources.forEach(source => {
                if (source.type === 'localStorage') {
                    localStorage.removeItem(source.key);
                }
            });
        });
        
        // 重新加载数据
        window.location.reload();
    }
    
    // 使用备用数据
    useFallbackData() {
        // 清除所有缓存
        Object.values(this.dataSources).forEach(sources => {
            sources.forEach(source => {
                if (source.type === 'localStorage') {
                    localStorage.removeItem(source.key);
                }
            });
        });
        
        // 设置只使用内置数据
        this.dataSources.items = this.dataSources.items.filter(s => s.type === 'builtin');
        
        // 重新加载数据
        window.location.reload();
    }
    
    // 内置物品数据
    getBuiltinItems() {
        return `20240520
id,maintype,subtype,name,cost,rarity,weight,need,tags,skill,description
0101001,兵器,格斗,铁盾,10000,普通,10,单手,"武器;盾牌;金属","力量5","打击2-4伤害，20%概率施加混乱I 1-3，招架3-8伤害"
0102001,兵器,剑,铁剑,9000,普通,20,双手,"武器;剑;金属","力量5","造成流血2-6伤害，15%概率施加流血I 1-3"
0201001,装备,身体,皮革大衣,4500,普通,5,身体,"护甲;皮革","无","提供物理护甲0.3和魔法护甲0.3"
0301001,炼制,药水,治疗药水,500,普通,1,无,"消耗品;治疗","无","饮用后恢复6点生命值，但会抑制HP恢复"
0105001,枪械,弓弩,木弓,6000,普通,6,"双手;箭矢","武器;远程;木质","敏捷4","箭矢伤害2-6，蓄力时伤害4-6，命中率+5%"`;
    }
}