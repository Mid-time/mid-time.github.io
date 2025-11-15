// ================================
// 模块化设计：物品管理器
// ================================
class ItemManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.items = [];
        this.filteredItems = [];
        
        // 分页相关
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        // 排序相关
        this.sortBy = 'name-asc';
    }
    
    // 加载所有数据
    async loadAllData() {
        try {
            const items = await this.dataManager.loadItems().catch(e => {
                console.error('加载物品数据失败:', e);
                return [];
            });
            
            this.items = items || [];
            
            // 初始化主类型筛选器
            this.initializeMainTypeFilter();
            
            return true;
        } catch (error) {
            console.error('加载所有数据失败:', error);
            return false;
        }
    }
    
    // 获取类型映射
    getTypeMapping() {
        const mainTypes = new Set();
        const subTypesByMainType = new Map();
        
        this.items.forEach(item => {
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
    }
    
    // 更新子类型筛选器
    updateSubTypeFilter(mainType) {
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
        this.items.forEach(item => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    if (tag && tag !== '') allTags.add(tag);
                });
            }
        });
        return allTags;
    }
    
    // 获取所有稀有度
    getAllRarity() {
        const allRarity = new Set();
        this.items.forEach(item => {
            if (item.rarity && item.rarity !== '') {
                allRarity.add(item.rarity);
            }
        });
        return allRarity;
    }
    
    // 获取所有技能需求
    getAllSkill() {
        const allSkill = new Set();
        this.items.forEach(item => {
            if (item.skill && item.skill !== '' && item.skill !== '无') {
                allSkill.add(item.skill);
            }
        });
        return allSkill;
    }
    
    // 获取所有需求
    getAllNeed() {
        const allNeed = new Set();
        this.items.forEach(item => {
            if (item.need && Array.isArray(item.need)) {
                item.need.forEach(need => {
                    if (need && need !== '') allNeed.add(need);
                });
            }
        });
        return allNeed;
    }
    
    // 设置排序方式
    setSortBy(sortBy) {
        this.sortBy = sortBy;
    }
    
    // 应用筛选
    applyFilter(selectedTags, selectedRarity, selectedSkill, selectedNeed, filterRule, 
               nameFilter, minCost, maxCost, minWeight, maxWeight, mainTypeFilter, subTypeFilter) {
        // 筛选物品
        this.filteredItems = this.items.filter(item => {
            // 主类型筛选
            if (mainTypeFilter && item.maintype !== mainTypeFilter) {
                return false;
            }
            
            // 子类型筛选
            if (subTypeFilter && item.subtype !== subTypeFilter) {
                return false;
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
            if (minCost !== null && item.cost < minCost) return false;
            if (maxCost !== null && item.cost > maxCost) return false;
            
            // 重量筛选
            if (minWeight !== null && item.weight < minWeight) return false;
            if (maxWeight !== null && item.weight > maxWeight) return false;
            
            // 标签筛选（支持AND/OR）
            if (selectedTags.size > 0) {
                if (filterRule === 'OR') {
                    // OR逻辑：包含任一选中标签
                    const hasSelectedTag = Array.from(selectedTags).some(tag => 
                        item.tags && item.tags.includes(tag)
                    );
                    if (!hasSelectedTag) return false;
                } else {
                    // AND逻辑：包含所有选中标签
                    const hasAllTags = Array.from(selectedTags).every(tag => 
                        item.tags && item.tags.includes(tag)
                    );
                    if (!hasAllTags) return false;
                }
            }
            
            // 稀有度筛选
            if (selectedRarity.size > 0 && !selectedRarity.has(item.rarity)) {
                return false;
            }
            
            // 技能需求筛选
            if (selectedSkill.size > 0 && !selectedSkill.has(item.skill)) {
                return false;
            }
            
            // 需求筛选
            if (selectedNeed.size > 0) {
                if (filterRule === 'OR') {
                    // OR逻辑：包含任一选中需求
                    const hasSelectedNeed = Array.from(selectedNeed).some(need => 
                        item.need && item.need.includes(need)
                    );
                    if (!hasSelectedNeed) return false;
                } else {
                    // AND逻辑：包含所有选中需求
                    const hasAllNeed = Array.from(selectedNeed).every(need => 
                        item.need && item.need.includes(need)
                    );
                    if (!hasAllNeed) return false;
                }
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
    
    // 获取筛选后的物品（用于标签可用性检查）
    getFilteredItems(selectedTags, selectedRarity, selectedSkill, selectedNeed, filterRule, mainTypeFilter, subTypeFilter) {
        return this.items.filter(item => {
            // 主类型筛选
            if (mainTypeFilter && item.maintype !== mainTypeFilter) {
                return false;
            }
            
            // 子类型筛选
            if (subTypeFilter && item.subtype !== subTypeFilter) {
                return false;
            }
            
            // 标签筛选（支持AND/OR）
            if (selectedTags.size > 0) {
                if (filterRule === 'OR') {
                    // OR逻辑：包含任一选中标签
                    const hasSelectedTag = Array.from(selectedTags).some(tag => 
                        item.tags && item.tags.includes(tag)
                    );
                    if (!hasSelectedTag) return false;
                } else {
                    // AND逻辑：包含所有选中标签
                    const hasAllTags = Array.from(selectedTags).every(tag => 
                        item.tags && item.tags.includes(tag)
                    );
                    if (!hasAllTags) return false;
                }
            }
            
            // 稀有度筛选
            if (selectedRarity.size > 0 && !selectedRarity.has(item.rarity)) {
                return false;
            }
            
            // 技能需求筛选
            if (selectedSkill.size > 0 && !selectedSkill.has(item.skill)) {
                return false;
            }
            
            // 需求筛选
            if (selectedNeed.size > 0) {
                if (filterRule === 'OR') {
                    // OR逻辑：包含任一选中需求
                    const hasSelectedNeed = Array.from(selectedNeed).some(need => 
                        item.need && item.need.includes(need)
                    );
                    if (!hasSelectedNeed) return false;
                } else {
                    // AND逻辑：包含所有选中需求
                    const hasAllNeed = Array.from(selectedNeed).every(need => 
                        item.need && item.need.includes(need)
                    );
                    if (!hasAllNeed) return false;
                }
            }
            
            return true;
        });
    }
    
    // 应用排序
    applySorting() {
        // 确保所有物品都有必要的属性
        this.filteredItems = this.filteredItems.map(item => {
            if (!item.name) item.name = '未知物品';
            if (!item.cost) item.cost = 0;
            if (!item.weight) item.weight = 0;
            return item;
        });
        
        switch(this.sortBy) {
            case 'name-asc':
                this.filteredItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name-desc':
                this.filteredItems.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'cost-asc':
                this.filteredItems.sort((a, b) => (a.cost || 0) - (b.cost || 0));
                break;
            case 'cost-desc':
                this.filteredItems.sort((a, b) => (b.cost || 0) - (a.cost || 0));
                break;
            case 'weight-asc':
                this.filteredItems.sort((a, b) => (a.weight || 0) - (b.weight || 0));
                break;
            case 'weight-desc':
                this.filteredItems.sort((a, b) => (b.weight || 0) - (a.weight || 0));
                break;
        }
    }
    
    // 渲染筛选结果
    renderFilterResults() {
        const itemList = document.getElementById('item-list');
        const pagination = document.getElementById('pagination');
        
        // 清空列表
        itemList.innerHTML = '';
        
        if (this.filteredItems.length === 0) {
            itemList.innerHTML = '<div class="empty-state">没有找到匹配的物品</div>';
            pagination.style.display = 'none';
            return;
        }
        
        // 计算分页
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredItems.length);
        const pageItems = this.filteredItems.slice(startIndex, endIndex);
        
        // 渲染当前页的物品
        pageItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            // 处理描述中的分号，替换为换行符
            const description = item.description ? this.escapeHtml(item.description).replace(/;/g, '\n') : '';
            
            itemCard.innerHTML = `
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
                <div class="item-description">${description}</div>
                <div class="item-footer">
                    <div>价格: ${this.formatCurrency(item.cost)}</div>
                    <div>重量: ${item.weight}</div>
                    <div>类型: ${item.maintype} - ${item.subtype}</div>
                </div>
            `;
            
            itemList.appendChild(itemCard);
        });
        
        // 更新分页信息
        document.getElementById('page-info').textContent = 
            `第 ${this.currentPage} 页，共 ${totalPages} 页 (${this.filteredItems.length} 个物品)`;
        
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
    
    // 添加到计算器
    addToCalculator(itemId) {
        // 这个功能需要与计算器模块交互
        if (window.calculatorModule) {
            window.calculatorModule.addItem(itemId);
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
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderFilterResults();
        }
    }
    
    // 货币格式化 - 新版：显示为"金币 银币 铜币"
    formatCurrency(copper) {
        // 根据规则书：1金币 = 100银币 = 10000铜币
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