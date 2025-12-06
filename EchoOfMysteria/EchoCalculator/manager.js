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
        
        // 特质等级选择器状态
        this.specialtyLevels = new Map(); // 存储特质ID对应的当前选择等级
    }
    
    // 设置当前模式
    setMode(mode) {
        console.log(`设置模式: ${mode}, 之前模式: ${this.currentMode}`);
        this.currentMode = mode;
        this.currentPage = 1;
        // 清空当前数据，强制重新加载
        this.currentData = [];
        this.filteredData = [];
        this.specialtyLevels.clear();
    }
    
    // 加载当前模式的数据
    async loadCurrentData() {
        try {
            console.log(`开始加载${this.currentMode}数据...`);
            if (this.currentMode === 'items') {
                this.currentData = await this.dataManager.loadItems();
                console.log(`物品数据加载完成，共${this.currentData.length}条`);
            } else {
                this.currentData = await this.dataManager.loadSpecialties();
                console.log(`特质数据加载完成，共${this.currentData.length}条`);
                
                // 为所有特质初始化等级选择器状态
                this.currentData.forEach(specialty => {
                    this.specialtyLevels.set(specialty.id, 1); // 默认选择等级1
                });
            }
            return true;
        } catch (error) {
            console.error(`加载${this.currentMode}数据失败:`, error);
            return false;
        }
    }
    
    // 获取类型映射
    getTypeMapping() {
        const mainTypes = new Set();
        const subTypesByMainType = new Map();
        
        this.currentData.forEach(item => {
            const mainType = this.currentMode === 'items' ? item.maintype : item.maintype;
            const subType = this.currentMode === 'items' ? item.subtype : item.subtype;
            
            if (mainType && mainType !== '') {
                mainTypes.add(mainType);
                
                if (!subTypesByMainType.has(mainType)) {
                    subTypesByMainType.set(mainType, new Set());
                }
                
                if (subType && subType !== '') {
                    subTypesByMainType.get(mainType).add(subType);
                }
            }
        });
        
        return {
            mainTypes: Array.from(mainTypes).sort(),
            subTypesByMainType: subTypesByMainType
        };
    }
    
    // 初始化主类型筛选器
    initializeMainTypeFilter() {
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
        
        // 添加事件监听器
        mainTypeSelector.addEventListener('change', (e) => {
            this.updateSubTypeFilter(e.target.value);
            // 触发筛选更新
            if (window.unifiedApp && window.unifiedApp.filterManager) {
                window.unifiedApp.filterManager.applyFilterDebounced();
            }
        });
    }
    
    // 更新子类型筛选器
    updateSubTypeFilter(mainType) {
        const subTypeSelector = document.getElementById('sub-type-filter');
        
        // 清空现有选项
        subTypeSelector.innerHTML = '<option value="">所有子类型</option>';
        
        if (mainType) {
            const typeMapping = this.getTypeMapping();
            const subTypes = typeMapping.subTypesByMainType.get(mainType);
            
            if (subTypes && subTypes.size > 0) {
                // 添加子类型选项
                Array.from(subTypes).sort().forEach(subType => {
                    const option = document.createElement('option');
                    option.value = subType;
                    option.textContent = subType;
                    subTypeSelector.appendChild(option);
                });
                subTypeSelector.style.display = 'block';
            } else {
                subTypeSelector.style.display = 'none';
            }
        } else {
            subTypeSelector.style.display = 'none';
        }
        
        // 添加事件监听器
        subTypeSelector.addEventListener('change', () => {
            if (window.unifiedApp && window.unifiedApp.filterManager) {
                window.unifiedApp.filterManager.applyFilterDebounced();
            }
        });
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
            const mainType = this.currentMode === 'items' ? item.maintype : item.maintype;
            const subType = this.currentMode === 'items' ? item.subtype : item.subtype;
            
            if (mainTypeFilter && mainType !== mainTypeFilter) {
                return false;
            }
            if (subTypeFilter && subType !== subTypeFilter) {
                return false;
            }
            
            // 等级筛选（仅特质模式）
            if (this.currentMode === 'specialties') {
                if (minLevel !== null && item.level < minLevel) return false;
                if (maxLevel !== null && item.level > maxLevel) return false;
            }
            
            // 名称/描述筛选
            if (nameFilter) {
                const nameMatch = item.name && item.name.toLowerCase().includes(nameFilter);
                let descMatch = false;
                
                if (item.description) {
                    if (Array.isArray(item.description)) {
                        descMatch = item.description.some(desc => 
                            desc && desc.toLowerCase().includes(nameFilter)
                        );
                    } else {
                        descMatch = item.description.toLowerCase().includes(nameFilter);
                    }
                }
                
                if (!nameMatch && !descMatch) {
                    return false;
                }
            }
            
            // 价格筛选
            let itemCost = item.cost || 0;
            if (Array.isArray(itemCost)) {
                // 特质模式：使用最大等级的成本进行筛选
                itemCost = itemCost[itemCost.length - 1] || 0;
            }
            
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
            const mainType = this.currentMode === 'items' ? item.maintype : item.maintype;
            const subType = this.currentMode === 'items' ? item.subtype : item.subtype;
            
            if (mainTypeFilter && mainType !== mainTypeFilter) {
                return false;
            }
            if (subTypeFilter && subType !== subTypeFilter) {
                return false;
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
                this.filteredData.sort((a, b) => {
                    const costA = Array.isArray(a.cost) ? a.cost[a.cost.length - 1] : a.cost;
                    const costB = Array.isArray(b.cost) ? b.cost[b.cost.length - 1] : b.cost;
                    return (costA || 0) - (costB || 0);
                });
                break;
            case 'cost-desc':
                this.filteredData.sort((a, b) => {
                    const costA = Array.isArray(a.cost) ? a.cost[a.cost.length - 1] : a.cost;
                    const costB = Array.isArray(b.cost) ? b.cost[b.cost.length - 1] : b.cost;
                    return (costB || 0) - (costA || 0);
                });
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
            case 'level-asc':
                if (this.currentMode === 'specialties') {
                    this.filteredData.sort((a, b) => (a.level || 0) - (b.level || 0));
                }
                break;
            case 'level-desc':
                if (this.currentMode === 'specialties') {
                    this.filteredData.sort((a, b) => (b.level || 0) - (a.level || 0));
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
        
        // 为特质等级选择器添加事件监听器
        if (this.currentMode === 'specialties') {
            document.querySelectorAll('.specialty-level-select').forEach(select => {
                select.addEventListener('change', (e) => {
                    const itemId = e.target.dataset.id;
                    const newLevel = parseInt(e.target.value);
                    this.updateSpecialtyLevel(itemId, newLevel);
                    
                    // 更新当前卡片显示
                    const card = e.target.closest('.item-card');
                    if (card) {
                        const item = this.currentData.find(i => i.id == itemId);
                        if (item) {
                            this.updateSpecialtyCardDisplay(card, item, newLevel);
                        }
                    }
                });
            });
        }
    }
    
    // 更新特质卡片显示
    updateSpecialtyCardDisplay(card, specialty, level) {
        const levelIndex = level - 1;
        
        // 获取当前等级的成本
        let currentCost = specialty.cost || 0;
        if (Array.isArray(specialty.cost) && levelIndex < specialty.cost.length) {
            currentCost = specialty.cost[levelIndex];
        }
        
        // 获取当前等级的描述
        let currentDescription = specialty.description || '';
        if (Array.isArray(specialty.description) && levelIndex < specialty.description.length) {
            currentDescription = specialty.description[levelIndex];
        }
        
        // 更新成本和描述
        const costElement = card.querySelector('.item-footer div:first-child');
        const descElement = card.querySelector('.item-description');
        
        if (costElement) {
            costElement.textContent = `成本: ${currentCost}`;
        }
        if (descElement) {
            descElement.textContent = currentDescription;
        }
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
                <div>类型: ${item.maintype}${item.subtype ? ' - ' + item.subtype : ''}</div>
            </div>
        `;
    }
    
    // 渲染特质卡片
    renderSpecialtyCard(container, specialty) {
        const currentLevel = this.specialtyLevels.get(specialty.id) || 1;
        const levelIndex = currentLevel - 1;
        
        // 获取当前等级的成本
        let currentCost = specialty.cost || 0;
        if (Array.isArray(specialty.cost) && levelIndex < specialty.cost.length) {
            currentCost = specialty.cost[levelIndex];
        }
        
        // 获取当前等级的描述
        let currentDescription = specialty.description || '';
        if (Array.isArray(specialty.description) && levelIndex < specialty.description.length) {
            currentDescription = specialty.description[levelIndex];
        }
        
        // 构建等级选择器选项
        const levelOptions = [];
        for (let i = 1; i <= specialty.level; i++) {
            levelOptions.push(`<option value="${i}" ${i === currentLevel ? 'selected' : ''}>${i}</option>`);
        }
        
        container.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-name">${this.escapeHtml(specialty.name)}</div>
                    <div>
                        <span class="item-id">ID: ${specialty.id}</span>
                        <span class="tag">${specialty.rarity}</span>
                        <span class="tag">最大等级 ${specialty.level}</span>
                        ${specialty.need ? specialty.need.map(need => `<span class="tag">${this.escapeHtml(need)}</span>`).join('') : ''}
                    </div>
                </div>
                <button class="btn-success add-to-calculator" data-id="${specialty.id}">添加到计算器</button>
            </div>
            <div class="item-tags">
                ${specialty.tag ? specialty.tag.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                ${specialty.maintype ? `<span class="tag">${this.escapeHtml(specialty.maintype)}</span>` : ''}
                ${specialty.subtype ? `<span class="tag">${this.escapeHtml(specialty.subtype)}</span>` : ''}
            </div>
            <div class="item-level-selector">
                <label>选择等级:</label>
                <select class="specialty-level-select" data-id="${specialty.id}">
                    ${levelOptions.join('')}
                </select>
            </div>
            <div class="item-description">${this.escapeHtml(currentDescription)}</div>
            <div class="item-footer">
                <div>成本: ${currentCost}</div>
                <div>类型: ${specialty.maintype}${specialty.subtype ? ' - ' + specialty.subtype : ''}</div>
            </div>
        `;
    }
    
    // 更新特质等级
    updateSpecialtyLevel(itemId, newLevel) {
        this.specialtyLevels.set(itemId, newLevel);
    }
    
    // 添加到计算器
    addToCalculator(itemId) {
        const item = this.currentData.find(i => i.id == itemId);
        if (!item) {
            console.warn(`未找到数据: ${itemId}`);
            return;
        }
        
        // 对于特质，获取当前选择的等级
        let selectedLevel = 1;
        if (this.currentMode === 'specialties') {
            selectedLevel = this.specialtyLevels.get(itemId) || 1;
        }
        
        if (window.unifiedCalculatorModule) {
            window.unifiedCalculatorModule.addItem(item, this.currentMode, selectedLevel);
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