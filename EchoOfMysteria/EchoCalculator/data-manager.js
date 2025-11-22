// ================================
// 统一数据管理器
// ================================
class UnifiedDataManager {
    constructor() {
        this.dataSources = {
            items: { url: 'EchoCalculator/Item.csv' },
            specialties: { url: 'EchoCalculator/Specialty.csv' }
        };
        
        this.sourceInfo = {
            items: { source: '未知', count: 0 },
            specialties: { source: '未知', count: 0 }
        };
    }
    
    // 获取数据来源信息
    getSourceInfo() {
        return this.sourceInfo;
    }
    
    // 加载物品数据
    async loadItems() {
        try {
            console.log(`尝试从 ${this.dataSources.items.url} 加载物品数据...`);
            const response = await fetch(this.dataSources.items.url);
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const csvText = await response.text();
            console.log(`成功从 ${this.dataSources.items.url} 加载物品数据，长度: ${csvText.length}`);
            
            const data = this.parseItemsCSV(csvText);
            this.sourceInfo.items = { 
                source: '文件', 
                count: data.length
            };
            
            return data;
        } catch (error) {
            console.error(`加载物品数据失败:`, error);
            this.sourceInfo.items = { source: '错误', count: 0 };
            throw new Error(`物品数据加载失败: ${error.message}`);
        }
    }
    
    // 加载特质数据
    async loadSpecialties() {
        try {
            console.log(`尝试从 ${this.dataSources.specialties.url} 加载特质数据...`);
            const response = await fetch(this.dataSources.specialties.url);
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const csvText = await response.text();
            console.log(`成功从 ${this.dataSources.specialties.url} 加载特质数据，长度: ${csvText.length}`);
            
            const data = this.parseSpecialtiesCSV(csvText);
            this.sourceInfo.specialties = { 
                source: '文件', 
                count: data.length
            };
            
            return data;
        } catch (error) {
            console.error(`加载特质数据失败:`, error);
            this.sourceInfo.specialties = { source: '错误', count: 0 };
            throw new Error(`特质数据加载失败: ${error.message}`);
        }
    }
    
    // 解析物品CSV
    parseItemsCSV(csvText) {
        if (!csvText || csvText.trim() === '') {
            throw new Error('物品CSV内容为空');
        }
        
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const items = [];
        
        for (let i = 1; i < lines.length; i++) {
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
            
            // 添加数据类型标识
            item.dataType = 'item';
            
            items.push(item);
        }
        
        console.log(`成功解析 ${items.length} 个物品`);
        return items;
    }
    
    // 解析特质CSV
    parseSpecialtiesCSV(csvText) {
        if (!csvText || csvText.trim() === '') {
            throw new Error('特质CSV内容为空');
        }
        
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const specialties = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = this.parseCSVLine(lines[i]);
            const specialty = {};
            
            headers.forEach((header, index) => {
                let value = values[index] || '';
                
                // 处理不同的数据类型
                if (header === 'tag' || header === 'need') {
                    value = value.split(';').map(tag => tag.trim()).filter(tag => tag !== '');
                } else if (header === 'level' || header === 'cost') {
                    // 等级和成本都是数字
                    value = parseFloat(value) || 0;
                } else if (header === 'rarity' || header === 'type') {
                    value = value.trim();
                } else if (header === 'description') {
                    // 描述保持原样
                    value = value.trim();
                } else if (header === 'id') {
                    value = value.toString().trim();
                } else {
                    value = value.trim();
                }
                
                specialty[header] = value;
            });
            
            // 确保有id字段
            if (!specialty.id) {
                specialty.id = `specialty_${i}`;
            }
            
            // 添加数据类型标识
            specialty.dataType = 'specialty';
            
            specialties.push(specialty);
        }
        
        console.log(`成功解析 ${specialties.length} 个特质`);
        return specialties;
    }
    
    // 解析CSV行，处理引号内的逗号
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '"';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if ((char === '"' || char === "'" || char === '""') && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
            } else if ((char === ',' || char === '，') && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        
        // 清理字段：移除多余的引号和空格
        return result.map(field => {
            let cleaned = field.trim();
            // 移除字段开头和结尾的引号
            if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
                (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                cleaned = cleaned.slice(1, -1);
            }
            return cleaned.trim();
        });
    }
    
    // 强制刷新数据
    async forceRefresh() {
        window.location.reload();
    }
}