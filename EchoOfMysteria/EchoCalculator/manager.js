// ================================
// 统一数据管理器
// ================================
class UnifiedManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentData = [];
        this.filteredData = [];
        
        // 分页相关
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        // 排序相关
        this.sortBy = 'name-asc';
        
        // 当前模式
        this.currentMode = 'items';
    }
    
    // 设置当前模式
    setMode(mode) {
        this.currentMode = mode;
        this.currentPage = 1;
    }
    
    // 加载当前模式的数据
    async loadCurrentData() {
        try {
            if (this.currentMode === 'items') {
                this.currentData = await this.dataManager.loadItems();
            } else {
                this.currentData = await this.dataManager.loadSpecialties();
            }
            return true;
        } catch (error) {
            console.error(`加载${this.currentMode}数据失败:`, error);
            return false;
        }
    }
    
    // 获取类型映射（仅物品模式）
    getTypeMapping() {
        if (this.currentMode !== 'items') return { mainTypes: [], subTypesByMainType: new Map() };
        
        const mainTypes = new Set();
        const subTypesByMainType = new Map();
        
        this.currentData.forEach(item => {
            if (item.maintype) {
                mainTypes.add(item.maintype);
                
                if (!subTypesByMainType.has(item.maintype)) {
                    subTypesByMainType.set(item.maintype, new Set());
                }
                
                if (item.subtype) {
                    subTypesByMainType.get(item.maintype).add(item.subtype);
                }
            }
        });
        
        return {
            mainTypes: Array.from(mainTypes).sort(),
            subTypesByMainType: subTypesByMainType
        };
    }
    
    // 获取特质类型映射
    getSpecialtyTypeMapping() {
        if (this.currentMode !== 'specialties') return { types: [] };
        
        const types = new Set();
        
        this.currentData.forEach(specialty => {
            if (specialty.type) {
                types.add(specialty.type);
            }
        });
        
        return {
            types: Array.from(types).sort()
        };
    }
    
    // 初始化主类型筛选器（仅物品模式）
    initializeMainTypeFilter() {
        if (this.currentMode !== 'items') return;
        
        const mainTypeSelector = document.getElementById('main-type-filter');
        mainTypeSelector.innerHTML = '<option value="">所有主类型</option>';
        
        const typeMapping = this.getTypeMapping();
        
        // 添加所有主类型选项
        typeMapping.mainTypes.forEach(mainType => {
            const option = document.createElement('option');
            option.value = mainType;
            option.textContent = mainType;
            mainTypeSelector.appendChild(option);
        });
    }
    
    // 初始化特质类型筛选器
    initializeSpecialtyTypeFilter() {
        if (this.currentMode !== 'specialties') return;
        
        const typeSelector = document.getElementById('main-type-filter');
        typeSelector.innerHTML = '<option value="">所有类型</option>';
        
        const typeMapping = this.getSpecialtyTypeMapping();
        
        // 添加所有类型选项
        typeMapping.types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelector.appendChild(option);
        });
    }
    
    // 更新子类型筛选器（仅物品模式）
    updateSubTypeFilter(mainType) {
        if (this.currentMode !== 'items') return;
        
        const subTypeSelector = document.getElementById('sub-type-filter');
        
        // 清空现有选项
        subTypeSelector.innerHTML = '<option value="">所有子类型</option>';
        
        if (mainType) {
            const typeMapping = this.getTypeMapping();
            const subTypes = typeMapping.subTypesByMainType.get(mainType);
            
            if (subTypes) {
                // 添加子类型选项
                Array.from(subTypes).sort().forEach(subType => {
                    const option = document.createElement('option');
                    option.value = subType;
                    option.textContent = subType;
                    subTypeSelector.appendChild(option);
                });
            }
            subTypeSelector.style.display = 'block';
        } else {
            subTypeSelector.style.display = 'none';
        }
    }
    
    // 获取所有标签
    getAllTags() {
        const allTags = new Set();
        this.currentData.forEach(item => {
            const tags = item.tags || item.tag || [];
            if (Array.isArray(tags)) {
                tags.forEach(tag => {
                    if (tag && tag !== '') allTags.add(tag);
                });
            }
        });
        return allTags;
    }
    
    // 获取所有需求
    getAllNeed() {
        const allNeed = new Set();
        this.currentData.forEach(item => {
            if (item.need && Array.isArray(item.need)) {
                item.need.forEach(need => {
                    if (need && need !== '') allNeed.add(need);
                });
            }
        });
        return allNeed;
    }
    
    // 获取所有稀有度
    getAllRarity() {
        const allRarity = new Set();
        this.currentData.forEach(item => {
            if (item.rarity && item.rarity !== '') {
                allRarity.add(item.rarity);
            }
        });
        return allRarity;
    }
    
    // 获取所有技能需求（仅物品模式）
    getAllSkill() {
        if (this.currentMode !== 'items') return new Set();
        
        const allSkill = new Set();
        this.currentData.forEach(item => {
            if (item.skill && item.skill !== '' && item.skill !== '无') {
                allSkill.add(item.skill);
            }
        });
        return allSkill;
    }
    
    // 设置排序方式
    setSortBy(sortBy) {
        this.sortBy = sortBy;
    }
    
    // 应用筛选
    applyFilter(selectedTags, selectedRarity, selectedSkill, selectedNeed, 
               nameFilter, minCost, maxCost, minWeight, maxWeight, minLevel, maxLevel, 
               mainTypeFilter, subTypeFilter) {
        // 筛选数据
        this.filteredData = this.currentData.filter(item => {
            // 类型筛选
            if (this.currentMode === 'items') {
                // 物品模式：主类型和子类型筛选
                if (mainTypeFilter && item.maintype !== mainTypeFilter) {
                    return false;
                }
                if (subTypeFilter && item.subtype !== subTypeFilter) {
                    return false;
                }
            } else {
                // 特质模式：类型筛选
                if (mainTypeFilter && item.type !== mainTypeFilter) {
                    return false;
                }
            }
            
            // 等级筛选（仅特质模式）
            if (this.currentMode === 'specialties') {
                if (minLevel !== null && item.level < minLevel) return false;
                if (maxLevel !== null && item.level > maxLevel) return false;
            }
            
            // 名称/描述筛选
            if (nameFilter) {
                const nameMatch = item.name && item.name.toLowerCase().includes(nameFilter);
                const descMatch = item.description && item.description.toLowerCase().includes(nameFilter);
                
                if (!nameMatch && !descMatch) {
                    return false;
                }
            }
            
            // 价格筛选
            let itemCost = item.cost || 0;
            if (minCost !== null && itemCost < minCost) return false;
            if (maxCost !== null && itemCost > maxCost) return false;
            
            // 重量筛选（仅物品模式）
            if (this.currentMode === 'items') {
                if (minWeight !== null && item.weight < minWeight) return false;
                if (maxWeight !== null && item.weight > maxWeight) return false;
            }
            
            // 标签筛选（AND规则）
            const tags = item.tags || item.tag || [];
            if (selectedTags.size > 0) {
                const hasAllTags = Array.from(selectedTags).every(tag => 
                    tags.includes(tag)
                );
                if (!hasAllTags) return false;
            }
            
            // 稀有度筛选
            if (selectedRarity.size > 0 && !selectedRarity.has(item.rarity)) {
                return false;
            }
            
            // 技能需求筛选（仅物品模式）
            if (this.currentMode === 'items' && selectedSkill.size > 0 && !selectedSkill.has(item.skill)) {
                return false;
            }
            
            // 需求筛选（AND规则）
            if (selectedNeed.size > 0) {
                const hasAllNeed = Array.from(selectedNeed).every(need => 
                    item.need && item.need.includes(need)
                );
                if (!hasAllNeed) return false;
            }
            
            return true;
        });
        
        // 应用排序
        this.applySorting();
        
        // 重置到第一页
        this.currentPage = 1;
        
        // 渲染筛选结果
        this.renderFilterResults();
    }
    
    // 获取筛选后的数据（用于标签可用性检查）
    getFilteredData(selectedTags, selectedRarity, selectedSkill, selectedNeed, mainTypeFilter, subTypeFilter, minLevel, maxLevel) {
        return this.currentData.filter(item => {
            // 类型筛选
            if (this.currentMode === 'items') {
                if (mainTypeFilter && item.maintype !== mainTypeFilter) {
                    return false;
                }
                if (subTypeFilter && item.subtype !== subTypeFilter) {
                    return false;
                }
            } else {
                if (mainTypeFilter && item.type !== mainTypeFilter) {
                    return false;
                }
            }
            
            // 等级筛选（仅特质模式）
            if (this.currentMode === 'specialties') {
                if (minLevel !== null && item.level < minLevel) return false;
                if (maxLevel !== null && item.level > maxLevel) return false;
            }
            
            // 标签筛选（AND规则）
            const tags = item.tags || item.tag || [];
            if (selectedTags.size > 0) {
                const hasAllTags = Array.from(selectedTags).every(tag => 
                    tags.includes(tag)
                );
                if (!hasAllTags) return false;
            }
            
            // 稀有度筛选
            if (selectedRarity.size > 0 && !selectedRarity.has(item.rarity)) {
                return false;
            }
            
            // 技能需求筛选（仅物品模式）
            if (this.currentMode === 'items' && selectedSkill.size > 0 && !selectedSkill.has(item.skill)) {
                return false;
            }
            
            // 需求筛选（AND规则）
            if (selectedNeed.size > 0) {
                const hasAllNeed = Array.from(selectedNeed).every(need => 
                    item.need && item.need.includes(need)
                );
                if (!hasAllNeed) return false;
            }
            
            return true;
        });
    }
    
    // 应用排序
    applySorting() {
        // 确保所有数据都有必要的属性
        this.filteredData = this.filteredData.map(item => {
            if (!item.name) item.name = '未知';
            if (this.currentMode === 'items') {
                if (!item.cost) item.cost = 0;
                if (!item.weight) item.weight = 0;
            } else {
                if (!item.cost) item.cost = 0;
                if (!item.level) item.level = 1;
            }
            return item;
        });
        
        switch(this.sortBy) {
            case 'name-asc':
                this.filteredData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name-desc':
                this.filteredData.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'cost-asc':
                this.filteredData.sort((a, b) => (a.cost || 0) - (b.cost || 0));
                break;
            case 'cost-desc':
                this.filteredData.sort((a, b) => (b.cost || 0) - (a.cost || 0));
                break;
            case 'weight-asc':
                if (this.currentMode === 'items') {
                    this.filteredData.sort((a, b) => (a.weight || 0) - (b.weight || 0));
                }
                break;
            case 'weight-desc':
                if (this.currentMode === 'items') {
                    this.filteredData.sort((a, b) => (b.weight || 0) - (a.weight || 0));
                }
                break;
        }
    }
    
    // 渲染筛选结果
    renderFilterResults() {
        const itemList = document.getElementById('item-list');
        const pagination = document.getElementById('pagination');
        
        // 清空列表
        itemList.innerHTML = '';
        
        if (this.filteredData.length === 0) {
            itemList.innerHTML = '<div class="empty-state">没有找到匹配的' + (this.currentMode === 'items' ? '物品' : '特质') + '</div>';
            pagination.style.display = 'none';
            return;
        }
        
        // 计算分页
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredData.length);
        const pageItems = this.filteredData.slice(startIndex, endIndex);
        
        // 渲染当前页的数据
        pageItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            if (this.currentMode === 'items') {
                this.renderItemCard(itemCard, item);
            } else {
                this.renderSpecialtyCard(itemCard, item);
            }
            
            itemList.appendChild(itemCard);
        });
        
        // 更新分页信息
        document.getElementById('page-info').textContent = 
            `第 ${this.currentPage} 页，共 ${totalPages} 页 (${this.filteredData.length} 个${this.currentMode === 'items' ? '物品' : '特质'})`;
        
        // 显示分页控件
        pagination.style.display = 'flex';
        
        // 更新分页按钮状态
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === totalPages;
        
        // 添加事件监听器
        document.querySelectorAll('.add-to-calculator').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                this.addToCalculator(itemId);
            });
        });
    }
    
    // 渲染物品卡片
    renderItemCard(container, item) {
        container.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-name">${this.escapeHtml(item.name)}</div>
                    <div>
                        <span class="item-id">ID: ${item.id}</span>
                        ${item.rarity ? `<span class="tag">${item.rarity}</span>` : ''}
                        ${item.skill && item.skill !== '无' ? `<span class="tag">${item.skill}</span>` : ''}
                    </div>
                </div>
                <button class="btn-success add-to-calculator" data-id="${item.id}">添加到计算器</button>
            </div>
            <div class="item-tags">
                ${item.tags ? item.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                ${item.need ? item.need.map(need => `<span class="tag">${this.escapeHtml(need)}</span>`).join('') : ''}
            </div>
            <div class="item-description">${this.escapeHtml(item.description)}</div>
            <div class="item-footer">
                <div>价格: ${this.formatCurrency(item.cost)}</div>
                <div>重量: ${item.weight}</div>
                <div>类型: ${item.maintype} - ${item.subtype}</div>
            </div>
        `;
    }
    
    // 渲染特质卡片
    renderSpecialtyCard(container, specialty) {
        container.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-name">${this.escapeHtml(specialty.name)}</div>
                    <div>
                        <span class="item-id">ID: ${specialty.id}</span>
                        <span class="tag">${specialty.rarity}</span>
                        <span class="tag">等级 ${specialty.level}</span>
                        ${specialty.need ? specialty.need.map(need => `<span class="tag">${this.escapeHtml(need)}</span>`).join('') : ''}
                    </div>
                </div>
                <button class="btn-success add-to-calculator" data-id="${specialty.id}">添加到计算器</button>
            </div>
            <div class="item-tags">
                ${specialty.tag ? specialty.tag.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                ${specialty.type ? `<span class="tag">${this.escapeHtml(specialty.type)}</span>` : ''}
            </div>
            <div class="item-description">${this.escapeHtml(specialty.description)}</div>
            <div class="item-footer">
                <div>价值: ${specialty.cost}</div>
                <div>类型: ${specialty.type}</div>
            </div>
        `;
    }
    
    // 添加到计算器
    addToCalculator(itemId) {
        const item = this.currentData.find(i => i.id == itemId);
        if (!item) {
            console.warn(`未找到数据: ${itemId}`);
            return;
        }
        
        if (window.unifiedCalculatorModule) {
            window.unifiedCalculatorModule.addItem(item, this.currentMode);
        }
    }
    
    // 上一页
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderFilterResults();
        }
    }
    
    // 下一页
    nextPage() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderFilterResults();
        }
    }
    
    // 货币格式化（仅物品模式使用）
    formatCurrency(copper) {
        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const copperRemainder = copper % 100;
        
        let result = [];
        if (gold > 0) result.push(`${gold}金币`);
        if (silver > 0) result.push(`${silver}银币`);
        if (copperRemainder > 0 || result.length === 0) result.push(`${copperRemainder}铜币`);
        
        return result.join(' ');
    }
    
    // 转换货币单位
    convertCurrency(value, unit) {
        switch(unit) {
            case 'gold': return value * 10000;
            case 'silver': return value * 100;
            case 'copper': 
            default: return value;
        }
    }
    
    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 显示状态消息
    showStatus(message, type) {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = 'status-message';
        
        if (type === 'success') {
            statusElement.classList.add('status-success');
        } else if (type === 'error') {
            statusElement.classList.add('status-error');
        } else if (type === 'warning') {
            statusElement.classList.add('status-warning');
        }
        
        // 3秒后自动清除成功消息
        if (type === 'success') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'status-message';
            }, 3000);
        }
    }
}