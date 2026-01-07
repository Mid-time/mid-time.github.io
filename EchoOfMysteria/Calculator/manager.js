// ================================
// 统一管理器 - 负责数据管理和UI交互
// ================================
class UnifiedManager {
    constructor(dataManager, mode = 'items') {
        this.dataManager = dataManager;
        this.currentData = [];
        this.filteredData = [];
        
        // 分页相关
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        // 排序相关
        this.sortBy = 'id-asc';
        
        // 当前模式
        this.currentMode = mode;
        
        // 特质等级选择器状态
        this.specialtyLevels = new Map();
        
        // 详情弹窗管理
        this.detailModal = null;
        
        // 获取计算器模块引用
        this.calculatorModule = null;
        
        // 筛选相关属性
        this.selectedTags = new Set();
        this.selectedRarity = new Set();
        this.selectedSkill = new Set();
        this.selectedNeed = new Set();
        this.nameFilter = '';
        this.minCost = null;
        this.maxCost = null;
        this.minWeight = null;
        this.maxWeight = null;
        this.minLevel = null;
        this.maxLevel = null;
        this.mainTypeFilter = '';
        this.subTypeFilter = '';
    }
    
    // 加载数据（供外部调用的公共方法）
    async loadData() {
        return await this.loadCurrentData();
    }
    
    // 设置计算器模块引用
    setCalculatorModule(calculatorModule) {
        this.calculatorModule = calculatorModule;
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
                    this.specialtyLevels.set(specialty.id, 1);
                });
            }
            
            // 初始时设置筛选数据为当前数据
            this.filteredData = [...this.currentData];
            this.applySorting();
            
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
            const mainType = item.maintype || '';
            const subType = item.subtype || '';
            
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
        if (!mainTypeSelector) return;
        
        mainTypeSelector.innerHTML = '<option value="">所有主类型</option>';
        
        const typeMapping = this.getTypeMapping();
        
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
        if (!subTypeSelector) return;
        
        subTypeSelector.innerHTML = '<option value="">所有子类型</option>';
        
        if (mainType) {
            const typeMapping = this.getTypeMapping();
            const subTypes = typeMapping.subTypesByMainType.get(mainType);
            
            if (subTypes && subTypes.size > 0) {
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
    applyFilter(filters = {}) {
        // 如果传入过滤器对象，更新当前筛选状态
        if (filters.selectedTags) this.selectedTags = filters.selectedTags;
        if (filters.selectedRarity) this.selectedRarity = filters.selectedRarity;
        if (filters.selectedSkill) this.selectedSkill = filters.selectedSkill;
        if (filters.selectedNeed) this.selectedNeed = filters.selectedNeed;
        if (filters.nameFilter !== undefined) this.nameFilter = filters.nameFilter;
        if (filters.minCost !== undefined) this.minCost = filters.minCost;
        if (filters.maxCost !== undefined) this.maxCost = filters.maxCost;
        if (filters.minWeight !== undefined) this.minWeight = filters.minWeight;
        if (filters.maxWeight !== undefined) this.maxWeight = filters.maxWeight;
        if (filters.minLevel !== undefined) this.minLevel = filters.minLevel;
        if (filters.maxLevel !== undefined) this.maxLevel = filters.maxLevel;
        if (filters.mainTypeFilter !== undefined) this.mainTypeFilter = filters.mainTypeFilter;
        if (filters.subTypeFilter !== undefined) this.subTypeFilter = filters.subTypeFilter;
        
        // 筛选数据
        this.filteredData = this.currentData.filter(item => {
            // 类型筛选
            const mainType = item.maintype || '';
            const subType = item.subtype || '';
            
            if (this.mainTypeFilter && mainType !== this.mainTypeFilter) {
                return false;
            }
            if (this.subTypeFilter && subType !== this.subTypeFilter) {
                return false;
            }
            
            // 等级筛选（仅特质模式）
            if (this.currentMode === 'specialties') {
                if (this.minLevel !== null && item.level < this.minLevel) return false;
                if (this.maxLevel !== null && item.level > this.maxLevel) return false;
            }
            
            // 名称/描述筛选
            if (this.nameFilter) {
                const searchTerm = this.nameFilter.toLowerCase();
                const nameMatch = item.name && item.name.toLowerCase().includes(searchTerm);
                let descMatch = false;
                
                if (item.description) {
                    if (Array.isArray(item.description)) {
                        descMatch = item.description.some(desc => 
                            desc && desc.toLowerCase().includes(searchTerm)
                        );
                    } else {
                        descMatch = item.description.toLowerCase().includes(searchTerm);
                    }
                }
                
                // 检查flavortext
                let flavorMatch = false;
                if (item.flavortext && item.flavortext.toLowerCase().includes(searchTerm)) {
                    flavorMatch = true;
                }
                
                // 检查ID
                const idMatch = item.id.toString().includes(searchTerm);
                
                if (!nameMatch && !descMatch && !flavorMatch && !idMatch) {
                    return false;
                }
            }
            
            // 价格筛选
            let itemCost = item.cost || 0;
            if (Array.isArray(itemCost)) {
                itemCost = itemCost[itemCost.length - 1] || 0;
            }
            
            if (this.minCost !== null && itemCost < this.minCost) return false;
            if (this.maxCost !== null && itemCost > this.maxCost) return false;
            
            // 重量筛选（仅物品模式）
            if (this.currentMode === 'items') {
                if (this.minWeight !== null && item.weight < this.minWeight) return false;
                if (this.maxWeight !== null && item.weight > this.maxWeight) return false;
            }
            
            // 标签筛选（AND规则）
            const tags = item.tags || item.tag || [];
            if (this.selectedTags.size > 0) {
                const hasAllTags = Array.from(this.selectedTags).every(tag => 
                    tags.includes(tag)
                );
                if (!hasAllTags) return false;
            }
            
            // 稀有度筛选
            if (this.selectedRarity.size > 0 && !this.selectedRarity.has(item.rarity)) {
                return false;
            }
            
            // 技能需求筛选（仅物品模式）
            if (this.currentMode === 'items' && this.selectedSkill.size > 0 && !this.selectedSkill.has(item.skill)) {
                return false;
            }
            
            // 需求筛选（AND规则）
            if (this.selectedNeed.size > 0) {
                const hasAllNeed = Array.from(this.selectedNeed).every(need => 
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
    }
    
    // 清除所有筛选
    clearFilters() {
        this.selectedTags.clear();
        this.selectedRarity.clear();
        this.selectedSkill.clear();
        this.selectedNeed.clear();
        this.nameFilter = '';
        this.minCost = null;
        this.maxCost = null;
        this.minWeight = null;
        this.maxWeight = null;
        this.minLevel = null;
        this.maxLevel = null;
        this.mainTypeFilter = '';
        this.subTypeFilter = '';
        this.sortBy = 'id-asc';
        
        // 重置筛选数据
        this.filteredData = [...this.currentData];
        this.applySorting();
        this.currentPage = 1;
    }
    
    // 获取筛选后的数据用于标签可用性检查
    getFilteredDataForTags() {
        if (!this.currentData || this.currentData.length === 0) {
            return [];
        }
        
        return this.currentData.filter(item => {
            // 类型筛选
            const mainType = item.maintype || '';
            const subType = item.subtype || '';
            
            if (this.mainTypeFilter && mainType !== this.mainTypeFilter) {
                return false;
            }
            if (this.subTypeFilter && subType !== this.subTypeFilter) {
                return false;
            }
            
            // 等级筛选（仅特质模式）
            if (this.currentMode === 'specialties') {
                if (this.minLevel !== null && item.level < this.minLevel) return false;
                if (this.maxLevel !== null && item.level > this.maxLevel) return false;
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
            case 'id-asc':
                this.filteredData.sort((a, b) => (a.id || 0) - (b.id || 0));
                break;
            case 'id-desc':
                this.filteredData.sort((a, b) => (b.id || 0) - (a.id || 0));
                break;
            case 'name-asc':
                this.filteredData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name-desc':
                this.filteredData.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'cost-asc':
                this.filteredData.sort((a, b) => {
                    const costA = this.getCostValue(a);
                    const costB = this.getCostValue(b);
                    return costA - costB;
                });
                break;
            case 'cost-desc':
                this.filteredData.sort((a, b) => {
                    const costA = this.getCostValue(a);
                    const costB = this.getCostValue(b);
                    return costB - costA;
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
    
    // 获取成本值
    getCostValue(item) {
        if (Array.isArray(item.cost)) {
            return item.cost[item.cost.length - 1] || 0;
        }
        return item.cost || 0;
    }
    
    // 渲染筛选结果
    renderFilterResults(listId = 'item-list', countId = 'results-count') {
        const itemList = document.getElementById(listId);
        const pagination = document.getElementById(listId.includes('specialty') ? 'specialty-pagination' : 'pagination');
        const resultsCount = document.getElementById(countId);
        
        if (!itemList) return;
        
        // 清空列表
        itemList.innerHTML = '';
        
        if (this.filteredData.length === 0) {
            itemList.innerHTML = '<div class="empty-state">没有找到匹配的' + (this.currentMode === 'items' ? '物品' : '特质') + '</div>';
            if (pagination) pagination.style.display = 'none';
            if (resultsCount) resultsCount.textContent = '0 个项目';
            return;
        }
        
        // 计算分页
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredData.length);
        const pageItems = this.filteredData.slice(startIndex, endIndex);
        
        // 渲染当前页的数据
        pageItems.forEach(item => {
            const compactItem = document.createElement('div');
            compactItem.className = 'compact-item';
            compactItem.dataset.id = item.id;
            
            this.renderCompactItem(compactItem, item);
            
            // 添加点击事件显示详情
            compactItem.addEventListener('click', (e) => {
                // 防止点击按钮或数量调整器时触发详情
                if (!e.target.closest('.compact-add-btn') && 
                    !e.target.closest('.quantity-adjuster') &&
                    !e.target.closest('button') &&
                    !e.target.closest('input')) {
                    this.showItemDetail(item);
                }
            });
            
            itemList.appendChild(compactItem);
        });
        
        // 更新结果计数
        if (resultsCount) {
            resultsCount.textContent = `${this.filteredData.length} 个项目`;
        }
        
        // 更新分页信息
        const pageInfo = document.getElementById(listId.includes('specialty') ? 'specialty-page-info' : 'page-info');
        if (pageInfo) {
            pageInfo.textContent = `第 ${this.currentPage} 页，共 ${totalPages} 页`;
        }
        
        // 显示分页控件
        if (pagination) {
            pagination.style.display = 'flex';
            
            // 更新分页按钮状态
            const prevPage = document.getElementById(listId.includes('specialty') ? 'specialty-prev-page' : 'prev-page');
            const nextPage = document.getElementById(listId.includes('specialty') ? 'specialty-next-page' : 'next-page');
            if (prevPage) prevPage.disabled = this.currentPage === 1;
            if (nextPage) nextPage.disabled = this.currentPage === totalPages;
        }
    }
    
    // 渲染紧凑列表项
    renderCompactItem(container, item) {
        let costText = '';
        if (this.currentMode === 'items') {
            costText = this.formatCurrency(item.cost || 0);
        } else {
            // 特质成本显示为 "cost1/cost2/cost3"
            if (Array.isArray(item.cost)) {
                costText = `成本: ${item.cost.join('/')}`;
            } else {
                costText = `成本: ${item.cost || 0}`;
            }
        }
        
        // 获取标签显示
        const tags = item.tags || item.tag || [];
        const displayTags = tags.slice(0, 3); // 只显示前3个标签
        
        // 检查是否在计算器中
        const isInCalculator = this.calculatorModule ? this.calculatorModule.isInCalculator(item.id, this.currentMode) : false;
        const calculatorQuantity = isInCalculator ? this.calculatorModule.getCalculatorQuantity(item.id, this.currentMode) : 0;
        
        let actionButtons = '';
        
        if (isInCalculator && calculatorQuantity > 0) {
            // 如果已在计算器中且数量大于0，显示数量调整器
            actionButtons = `
                <div class="quantity-adjuster">
                    <button class="btn-danger decrease-btn" data-id="${item.id}" data-mode="${this.currentMode}">-</button>
                    <input type="number" class="quantity-input" value="${calculatorQuantity}" min="0" data-id="${item.id}" data-mode="${this.currentMode}">
                    <button class="btn-success increase-btn" data-id="${item.id}" data-mode="${this.currentMode}">+</button>
                </div>
            `;
        } else {
            // 如果不在计算器中，显示添加按钮
            actionButtons = `<button class="btn-success compact-add-btn" data-id="${item.id}" data-mode="${this.currentMode}">添加</button>`;
        }
        
        container.innerHTML = `
            <div class="compact-item-header">
                <div class="compact-item-name">${this.escapeHtml(item.name)}</div>
                <div class="compact-item-tags">
                    ${displayTags.map(tag => `<span class="compact-tag">${this.escapeHtml(tag)}</span>`).join('')}
                    ${tags.length > 3 ? `<span class="compact-tag">+${tags.length - 3}</span>` : ''}
                </div>
            </div>
            <div class="compact-item-details">
                <div class="compact-item-cost">${costText}</div>
                ${actionButtons}
            </div>
        `;
        
        // 添加按钮事件
        if (isInCalculator && calculatorQuantity > 0) {
            // 数量调整器事件
            const decreaseBtn = container.querySelector('.decrease-btn');
            const increaseBtn = container.querySelector('.increase-btn');
            const quantityInput = container.querySelector('.quantity-input');
            
            const updateQuantityHandler = (itemId, mode, newQuantity) => {
                if (this.calculatorModule) {
                    if (newQuantity === 0) {
                        this.calculatorModule.removeFromCalculator(itemId, mode);
                    } else {
                        this.calculatorModule.updateQuantity(itemId, mode, newQuantity);
                    }
                    
                    // 重新渲染该项以更新按钮状态
                    setTimeout(() => {
                        this.renderCompactItem(container, item);
                    }, 100);
                }
            };
            
            decreaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = e.target.dataset.id;
                const mode = e.target.dataset.mode;
                const currentQuantity = parseInt(quantityInput.value);
                if (currentQuantity > 0) {
                    const newQuantity = currentQuantity - 1;
                    updateQuantityHandler(itemId, mode, newQuantity);
                }
            });
            
            increaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = e.target.dataset.id;
                const mode = e.target.dataset.mode;
                const currentQuantity = parseInt(quantityInput.value);
                const newQuantity = currentQuantity + 1;
                updateQuantityHandler(itemId, mode, newQuantity);
            });
            
            quantityInput.addEventListener('change', (e) => {
                e.stopPropagation();
                const itemId = e.target.dataset.id;
                const mode = e.target.dataset.mode;
                const newQuantity = parseInt(e.target.value) || 0;
                updateQuantityHandler(itemId, mode, newQuantity);
            });
            
            quantityInput.addEventListener('blur', (e) => {
                e.stopPropagation();
                const itemId = e.target.dataset.id;
                const mode = e.target.dataset.mode;
                const newQuantity = parseInt(e.target.value) || 0;
                updateQuantityHandler(itemId, mode, newQuantity);
            });
        } else {
            // 添加按钮事件
            const addBtn = container.querySelector('.compact-add-btn');
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = e.target.dataset.id;
                const mode = e.target.dataset.mode;
                this.addToCalculator(itemId, mode);
                
                // 重新渲染该项以显示数量调整器
                setTimeout(() => {
                    this.renderCompactItem(container, item);
                }, 100);
            });
        }
    }
    
    // 显示物品详情
    showItemDetail(item) {
        const modal = document.getElementById('detail-modal');
        const title = document.getElementById('detail-title');
        const body = document.querySelector('.detail-modal-body');
        
        if (!modal || !title || !body) return;
        
        // 填充详情内容
        title.textContent = item.name;
        
        let detailHtml = '';
        
        if (this.currentMode === 'items') {
            detailHtml = this.renderItemDetail(item);
        } else {
            detailHtml = this.renderSpecialtyDetail(item);
        }
        
        body.innerHTML = detailHtml;
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 添加关闭事件
        const closeBtn = modal.querySelector('.close-detail-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        
        // 点击弹窗外关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // 添加添加到计算器的事件
        const addBtn = body.querySelector('.detail-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addToCalculator(item.id, this.currentMode);
                this.updateDetailActionButtons(item.id, body);
            });
        }
        
        // 更新数量输入事件
        const quantityInput = body.querySelector('.detail-quantity-input');
        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                const newQuantity = parseInt(e.target.value) || 0;
                if (this.calculatorModule) {
                    if (newQuantity === 0) {
                        this.calculatorModule.removeFromCalculator(item.id, this.currentMode);
                    } else {
                        this.calculatorModule.updateQuantity(item.id, this.currentMode, newQuantity);
                    }
                    this.updateDetailActionButtons(item.id, body);
                    
                    // 更新筛选结果中的显示
                    this.updateCompactItemInList(item.id);
                }
            });
        }
        
        // 更新等级选择事件（特质）- 修复描述更新问题
        const levelSelect = body.querySelector('.detail-level-select');
        if (levelSelect) {
            levelSelect.addEventListener('change', (e) => {
                const newLevel = parseInt(e.target.value) || 1;
                this.updateSpecialtyLevel(item.id, newLevel);
                
                // 更新成本显示
                const costDisplay = body.querySelector('.detail-cost');
                if (costDisplay) {
                    const levelIndex = newLevel - 1;
                    let currentCost = item.cost || 0;
                    if (Array.isArray(item.cost) && levelIndex < item.cost.length) {
                        currentCost = item.cost[levelIndex];
                    }
                    costDisplay.textContent = `成本: ${currentCost}`;
                }
                
                // 更新描述显示 - 确保重新获取完整描述
                const descDisplay = body.querySelector('.detail-description');
                if (descDisplay) {
                    let currentDesc = '';
                    if (Array.isArray(item.description)) {
                        const levelIndex = newLevel - 1;
                        currentDesc = item.description[levelIndex] || item.description[0] || '';
                    } else {
                        currentDesc = item.description || '';
                    }
                    descDisplay.innerHTML = this.formatDescription(this.escapeHtml(currentDesc));
                }
                
                // 如果已经在计算器中，更新计算器中的等级
                if (this.calculatorModule && this.calculatorModule.isInCalculator(item.id, this.currentMode)) {
                    this.calculatorModule.updateLevel(item.id, newLevel);
                }
            });
        }
    }
    
    // 更新筛选结果列表中的单个项目
    updateCompactItemInList(itemId) {
        const item = this.currentData.find(i => i.id == itemId);
        if (!item) return;
        
        const container = document.querySelector(`.compact-item[data-id="${itemId}"]`);
        if (container) {
            this.renderCompactItem(container, item);
        }
    }
    
    // 渲染物品详情
    renderItemDetail(item) {
        const inCalculator = this.calculatorModule ? this.calculatorModule.calculatorItems.find(i => i.id == item.id && i.mode === this.currentMode) : null;
        const quantity = inCalculator ? inCalculator.quantity : 0;
        
        // 格式化需求
        const needText = item.need && item.need.length > 0 ? item.need.join(', ') : '无';
        
        return `
            <div class="detail-text-container">
                <div class="detail-text-item"><strong>类型:</strong> ${item.maintype || ''}${item.subtype ? ' - ' + item.subtype : ''}</div>
                <div class="detail-text-item"><strong>稀有度:</strong> ${item.rarity || '无'}</div>
                <div class="detail-text-item"><strong>需求:</strong> ${needText}</div>
            </div>
            
            <div class="detail-tags">
                ${(item.tags || []).map(tag => `<span class="detail-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
            
            <div class="detail-section">
                <h4>描述</h4>
                <div class="detail-content">
                    <div class="detail-description">${this.formatDescription(this.escapeHtml(item.description || '无描述'))}</div>
                    ${item.flavortext ? `<div class="flavortext">${this.escapeHtml(item.flavortext)}</div>` : ''}
                </div>
            </div>
            
            <div class="detail-attributes">
                <div class="detail-attribute">
                    <strong>价格:</strong> ${this.formatCurrency(item.cost || 0)}
                </div>
                <div class="detail-attribute">
                    <strong>重量:</strong> ${item.weight || 0} 荷
                </div>
                ${item.skill && item.skill !== '无' ? `
                <div class="detail-attribute">
                    <strong>技能需求:</strong> ${item.skill}
                </div>
                ` : ''}
            </div>
            
            <div class="detail-actions">
                ${inCalculator ? `
                    <div class="detail-quantity">
                        <label>数量:</label>
                        <input type="number" class="detail-quantity-input" value="${quantity}" min="0" data-id="${item.id}">
                    </div>
                ` : `
                    <button class="btn-success detail-add-btn" data-id="${item.id}">添加到计算器</button>
                `}
            </div>
        `;
    }
    
    // 渲染特质详情
    renderSpecialtyDetail(item) {
        const inCalculator = this.calculatorModule ? this.calculatorModule.calculatorItems.find(i => i.id == item.id && i.mode === this.currentMode) : null;
        const currentLevel = this.specialtyLevels.get(item.id) || 1;
        const levelIndex = currentLevel - 1;
        
        // 获取当前等级的成本
        let currentCost = item.cost || 0;
        if (Array.isArray(item.cost) && levelIndex < item.cost.length) {
            currentCost = item.cost[levelIndex];
        }
        
        // 获取当前等级的描述
        let currentDescription = '';
        if (Array.isArray(item.description)) {
            currentDescription = item.description[levelIndex] || item.description[0] || '';
        } else {
            currentDescription = item.description || '';
        }
        
        // 格式化需求
        const needText = item.need && item.need.length > 0 ? item.need.join(', ') : '无';
        
        // 构建等级选择器选项
        const levelOptions = [];
        for (let i = 1; i <= item.level; i++) {
            levelOptions.push(`<option value="${i}" ${i === currentLevel ? 'selected' : ''}>${i}</option>`);
        }
        
        return `
            <div class="detail-text-container">
                <div class="detail-text-item"><strong>类型:</strong> ${item.maintype || ''}${item.subtype ? ' - ' + item.subtype : ''}</div>
                <div class="detail-text-item"><strong>稀有度:</strong> ${item.rarity || '无'}</div>
                <div class="detail-text-item"><strong>需求:</strong> ${needText}</div>
                <div class="detail-text-item"><strong>最大等级:</strong> ${item.level || 1}</div>
            </div>
            
            <div class="detail-tags">
                ${(item.tag || []).map(tag => `<span class="detail-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
            
            <div class="detail-section">
                <h4>等级选择</h4>
                <div class="detail-content">
                    <div class="detail-level-selector">
                        <label>选择等级:</label>
                        <select class="detail-level-select" data-id="${item.id}">
                            ${levelOptions.join('')}
                        </select>
                        <span>/${item.level}</span>
                    </div>
                    <div class="detail-attribute" style="margin-top: 15px;">
                        <strong>当前等级成本:</strong> ${currentCost}
                    </div>
                    <div class="detail-attribute">
                        <strong>全部等级成本:</strong> ${Array.isArray(item.cost) ? item.cost.join('/') : item.cost}
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>描述</h4>
                <div class="detail-content">
                    <div class="detail-description">${this.formatDescription(this.escapeHtml(currentDescription))}</div>
                    ${item.flavortext ? `<div class="flavortext">${this.escapeHtml(item.flavortext)}</div>` : ''}
                </div>
            </div>
            
            <div class="detail-actions">
                ${inCalculator ? `
                    <button class="btn-danger detail-remove-btn" data-id="${item.id}">移出计算器</button>
                ` : `
                    <button class="btn-success detail-add-btn" data-id="${item.id}">添加到计算器</button>
                `}
            </div>
        `;
    }
    
    // 更新详情弹窗中的操作按钮
    updateDetailActionButtons(itemId, body) {
        const inCalculator = this.calculatorModule ? this.calculatorModule.calculatorItems.find(i => i.id == itemId && i.mode === this.currentMode) : null;
        const actionsContainer = body.querySelector('.detail-actions');
        
        if (!actionsContainer) return;
        
        if (inCalculator) {
            if (this.currentMode === 'items') {
                actionsContainer.innerHTML = `
                    <div class="detail-quantity">
                        <label>数量:</label>
                        <input type="number" class="detail-quantity-input" value="${inCalculator.quantity}" min="0" data-id="${itemId}">
                    </div>
                `;
                
                // 重新绑定事件
                const quantityInput = actionsContainer.querySelector('.detail-quantity-input');
                quantityInput.addEventListener('change', (e) => {
                    const newQuantity = parseInt(e.target.value) || 0;
                    if (newQuantity === 0) {
                        this.calculatorModule.removeFromCalculator(itemId, this.currentMode);
                    } else {
                        this.calculatorModule.updateQuantity(itemId, this.currentMode, newQuantity);
                    }
                    this.updateDetailActionButtons(itemId, body);
                    
                    // 更新筛选结果中的显示
                    this.updateCompactItemInList(itemId);
                });
            } else {
                actionsContainer.innerHTML = `<button class="btn-danger detail-remove-btn" data-id="${itemId}">移出计算器</button>`;
                
                const removeBtn = actionsContainer.querySelector('.detail-remove-btn');
                removeBtn.addEventListener('click', () => {
                    this.calculatorModule.removeFromCalculator(itemId, this.currentMode);
                    this.updateDetailActionButtons(itemId, body);
                    
                    // 更新筛选结果中的显示
                    this.updateCompactItemInList(itemId);
                });
            }
        } else {
            actionsContainer.innerHTML = `<button class="btn-success detail-add-btn" data-id="${itemId}">添加到计算器</button>`;
            
            const addBtn = actionsContainer.querySelector('.detail-add-btn');
            addBtn.addEventListener('click', () => {
                this.addToCalculator(itemId, this.currentMode);
                this.updateDetailActionButtons(itemId, body);
                
                // 更新筛选结果中的显示
                this.updateCompactItemInList(itemId);
            });
        }
    }
    
    // 更新特质等级
    updateSpecialtyLevel(itemId, newLevel) {
        this.specialtyLevels.set(itemId, newLevel);
    }
    
    // 添加到计算器
    addToCalculator(itemId, mode) {
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
        
        if (this.calculatorModule) {
            this.calculatorModule.addItem(item, mode || this.currentMode, selectedLevel);
            this.showStatus(`已添加 ${item.name} 到计算器`, 'success');
        }
    }
    
    // 更新每页显示数量
    updateItemsPerPage(newValue) {
        const value = parseInt(newValue);
        if (value >= 5 && value <= 100) {
            this.itemsPerPage = value;
            this.currentPage = 1;
            this.renderFilterResults(
                this.currentMode === 'items' ? 'item-list' : 'specialty-list',
                this.currentMode === 'items' ? 'results-count' : 'specialty-results-count'
            );
        }
    }
    
    // 上一页
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderFilterResults(
                this.currentMode === 'items' ? 'item-list' : 'specialty-list',
                this.currentMode === 'items' ? 'results-count' : 'specialty-results-count'
            );
        }
    }
    
    // 下一页
    nextPage() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderFilterResults(
                this.currentMode === 'items' ? 'item-list' : 'specialty-list',
                this.currentMode === 'items' ? 'results-count' : 'specialty-results-count'
            );
        }
    }
    
    // 货币格式化
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
    
    // HTML转义函数
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 格式化描述（分号换行，加粗{}内容）
    formatDescription(text) {
        if (!text) return '';
        
        // 用<br>替换分号
        let formatted = text.replace(/;/g, '<br>');
        
        // 加粗{}中的内容
        formatted = formatted.replace(/\{([^}]+)\}/g, '<strong>$1</strong>');
        
        return formatted;
    }
    
    // 显示状态消息
    showStatus(message, type) {
        const statusElement = document.getElementById('data-status');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = 'data-status';
        
        if (type === 'success') {
            statusElement.classList.add('success');
        } else if (type === 'error') {
            statusElement.classList.add('error');
        } else if (type === 'warning') {
            statusElement.classList.add('warning');
        } else if (type === 'loading') {
            statusElement.classList.add('loading');
        }
        
        // 3秒后自动清除成功消息
        if (type === 'success' || type === 'error' || type === 'warning') {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.textContent = '';
                    statusElement.className = 'data-status';
                }
            }, 3000);
        }
    }
}