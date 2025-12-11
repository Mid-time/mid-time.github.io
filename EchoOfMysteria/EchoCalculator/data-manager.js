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
                source: this.dataSources.items.url, 
                count: data.length
            };
            
            return data;
        } catch (error) {
            console.error(`加载物品数据失败:`, error);
            this.sourceInfo.items = { source: '错误: ' + error.message, count: 0 };
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
                source: this.dataSources.specialties.url, 
                count: data.length
            };
            
            console.log(`特质数据源信息: ${this.sourceInfo.specialties.source}, 数量: ${this.sourceInfo.specialties.count}`);
            
            return data;
        } catch (error) {
            console.error(`加载特质数据失败:`, error);
            this.sourceInfo.specialties = { source: '错误: ' + error.message, count: 0 };
            throw new Error(`特质数据加载失败: ${error.message}`);
        }
    }
    
    // 解析物品CSV
    parseItemsCSV(csvText) {
        if (!csvText || csvText.trim() === '') {
            throw new Error('物品CSV内容为空');
        }
        
        const lines = csvText.trim().split('\n');
        console.log(`CSV总行数: ${lines.length}`);
        
        // 检查第一行是否是表头
        const firstLine = lines[0].toLowerCase();
        if (firstLine.includes('id') && firstLine.includes('name') && firstLine.includes('description')) {
            // 第一行是表头，正常处理
            const headers = lines[0].split(',').map(header => header.trim());
            console.log('表头:', headers);
            
            const items = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const item = this.parseCSVLineToObject(lines[i], headers, i);
                if (item) {
                    items.push(item);
                }
            }
            
            console.log(`成功解析 ${items.length} 个物品`);
            return items;
        } else {
            // 第一行可能是数据，没有表头
            console.warn('CSV文件可能没有表头，使用默认表头');
            const defaultHeaders = ['id', 'name', 'description', 'tags', 'rarity', 'skill', 'need', 'cost', 'weight', 'maintype', 'subtype', 'material'];
            const items = [];
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const item = this.parseCSVLineToObject(lines[i], defaultHeaders, i);
                if (item) {
                    items.push(item);
                }
            }
            
            console.log(`成功解析 ${items.length} 个物品`);
            return items;
        }
    }
    
    // 解析特质CSV
    parseSpecialtiesCSV(csvText) {
        if (!csvText || csvText.trim() === '') {
            throw new Error('特质CSV内容为空');
        }
        
        const lines = csvText.trim().split('\n');
        console.log(`特质CSV总行数: ${lines.length}`);
        
        // 检查第一行是否是表头
        const firstLine = lines[0].toLowerCase();
        if (firstLine.includes('id') && firstLine.includes('name') && firstLine.includes('description')) {
            // 第一行是表头，正常处理
            const headers = lines[0].split(',').map(header => header.trim());
            console.log('特质表头:', headers);
            
            const specialties = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const specialty = this.parseCSVLineToObject(lines[i], headers, i, 'specialty');
                if (specialty) {
                    specialties.push(specialty);
                }
            }
            
            console.log(`成功解析 ${specialties.length} 个特质`);
            return specialties;
        } else {
            // 第一行可能是数据，没有表头
            console.warn('特质CSV文件可能没有表头，使用默认表头');
            const defaultHeaders = ['id', 'maintype', 'subtype', 'name', 'level', 'cost', 'rarity', 'tag', 'need', 'description'];
            const specialties = [];
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const specialty = this.parseCSVLineToObject(lines[i], defaultHeaders, i, 'specialty');
                if (specialty) {
                    specialties.push(specialty);
                }
            }
            
            console.log(`成功解析 ${specialties.length} 个特质`);
            return specialties;
        }
    }
    
    // 解析CSV行到对象
    parseCSVLineToObject(line, headers, lineNumber, dataType = 'item') {
        const values = this.parseCSVLine(line);
        const item = { dataType };
        
        headers.forEach((header, index) => {
            if (index >= values.length) return;
            
            let value = values[index] || '';
            value = value.trim();
            
            // 处理不同的数据类型
            if ((header === 'tags' || header === 'tag' || header === 'need') && value) {
                item[header] = value.split(';').map(tag => tag.trim()).filter(tag => tag !== '');
            } else if (header === 'weight') {
                // 重量字段特殊处理
                const numValue = parseFloat(value);
                item[header] = isNaN(numValue) ? 0 : numValue;
            } else if (header === 'cost') {
                // 成本字段特殊处理 - 可能是数字或数组
                if (value.startsWith('{') && value.endsWith('}')) {
                    // 处理数组格式 {4/9/15}
                    const costStr = value.slice(1, -1);
                    item[header] = costStr.split('/').map(num => parseFloat(num.trim()) || 0);
                } else {
                    // 处理单个数字
                    const numValue = parseFloat(value);
                    item[header] = isNaN(numValue) ? 0 : numValue;
                }
            } else if (header === 'level') {
                // 等级字段特殊处理
                const numValue = parseInt(value);
                item[header] = isNaN(numValue) ? 1 : numValue;
            } else if (header === 'id') {
                item[header] = value.toString().trim() || `${dataType}_${lineNumber}`;
            } else if (header === 'description') {
                // 处理描述字段
                // 替换分号为换行符
                item[header] = value.replace(/;/g, '<br>');
            } else {
                item[header] = value;
            }
        });
        
        // 处理特质的description数组格式
        if (dataType === 'specialty' && item.description) {
            if (typeof item.description === 'string' && item.description.includes('{')) {
                // 处理多个{}格式
                const regex = /\{([^}]+)\}/g;
                let match;
                const matches = [];
                
                // 找到所有{}及其位置
                while ((match = regex.exec(item.description)) !== null) {
                    matches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        content: match[1],
                        fullMatch: match[0]
                    });
                }
                
                if (matches.length > 0) {
                    // 按等级分割每个{}中的内容
                    const levelArrays = matches.map(match => match.content.split('/'));
                    const levelCount = levelArrays[0].length;
                    
                    // 为每个等级创建描述
                    const levelDescriptions = [];
                    for (let i = 0; i < levelCount; i++) {
                        let levelDesc = item.description;
                        
                        // 为每个{}替换对应等级的值
                        for (let j = 0; j < matches.length; j++) {
                            const match = matches[j];
                            const levelValue = levelArrays[j][i] || levelArrays[j][0] || '';
                            const replacement = `<strong>${levelValue}</strong>`;
                            levelDesc = levelDesc.replace(match.fullMatch, replacement);
                        }
                        
                        levelDescriptions.push(levelDesc);
                    }
                    
                    item.description = levelDescriptions;
                } else {
                    // 如果没有{}，转换为单元素数组
                    item.description = [item.description];
                }
            } else if (!Array.isArray(item.description)) {
                // 确保description是数组
                item.description = [item.description];
            }
        }
        
        // 确保有id字段
        if (!item.id) {
            item.id = `${dataType}_${lineNumber}`;
        }
        
        return item;
    }
    
    // 解析CSV行，处理引号内的逗号
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '"';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
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