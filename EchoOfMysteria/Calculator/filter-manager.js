// ================================
// 统一筛选管理器 - 支持物品和技艺独立筛选
// ================================
class UnifiedFilterManager {
    constructor(manager) {
        this.manager = manager;
        this.currentModalMode = null; // 当前弹窗模式: 'items' 或 'specialties'
        
        // 筛选弹窗元素
        this.filterModal = null;
        
        // 初始化事件监听器
        this.initializeEventListeners();
    }
    
    // 初始化事件监听器
    initializeEventListeners() {
        // 筛选按钮点击事件
        const filterToggle = document.getElementById('filter-toggle');
        const specialtyFilterToggle = document.getElementById('specialty-filter-toggle');
        
        if (filterToggle) {
            filterToggle.addEventListener('click', () => {
                this.showFilterModal('items');
            });
        }
        
        if (specialtyFilterToggle) {
            specialtyFilterToggle.addEventListener('click', () => {
                this.showFilterModal('specialties');
            });
        }
        
        // 关闭弹窗事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-filter-btn')) {
                this.hideFilterModal();
            }
            
            if (e.target === this.filterModal) {
                this.hideFilterModal();
            }
        });
        
        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.filterModal && this.filterModal.style.display === 'flex') {
                this.hideFilterModal();
            }
        });
        
        // 应用筛选按钮
        const applyFilterBtn = document.getElementById('apply-filter');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', () => {
                this.applyFilter();
                // 应用筛选后关闭弹窗
                this.hideFilterModal();
            });
        }
        
        // 清除筛选按钮
        const clearFilterBtn = document.getElementById('clear-filter');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                this.clearFilter();
            });
        }
    }
    
    // 显示筛选弹窗
    showFilterModal(mode) {
        this.currentModalMode = mode;
        this.filterModal = document.getElementById('filter-modal');
        
        if (!this.filterModal) return;
        
        // 更新弹窗标题
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.textContent = mode === 'items' ? '物品筛选条件' : '技艺筛选条件';
        }
        
        // 更新价格标签
        const priceFilterLabel = document.getElementById('price-filter-label');
        if (priceFilterLabel) {
            priceFilterLabel.textContent = mode === 'items' ? '价格范围' : '成本范围';
        }
        
        // 显示/隐藏相关筛选器
        this.updateFilterVisibility(mode);
        
        // 初始化筛选器内容
        this.initializeFilterContent(mode);
        
        // 显示弹窗
        this.filterModal.style.display = 'flex';
        
        // 防止滚动
        document.body.style.overflow = 'hidden';
    }
    
    // 隐藏筛选弹窗
    hideFilterModal() {
        if (this.filterModal) {
            this.filterModal.style.display = 'none';
            this.currentModalMode = null;
            document.body.style.overflow = 'auto';
        }
    }
    
    // 更新筛选器可见性
    updateFilterVisibility(mode) {
        // 等级筛选（仅技艺模式显示）
        const levelFilter = document.getElementById('level-filter');
        if (levelFilter) {
            levelFilter.style.display = mode === 'specialties' ? 'block' : 'none';
        }
        
        // 重量筛选（仅物品模式显示）
        const weightFilter = document.getElementById('weight-filter');
        if (weightFilter) {
            weightFilter.style.display = mode === 'items' ? 'block' : 'none';
        }
    }
    
    // 初始化筛选器内容
    initializeFilterContent(mode) {
        // 初始化主类型筛选器
        if (mode === 'items') {
            this.manager.initializeMainTypeFilter();
        } else {
            // 技艺管理器也需要初始化类型筛选器
            const specialtyManager = this.manager;
            specialtyManager.initializeMainTypeFilter();
        }
        
        // 初始化标签筛选器
        this.renderTagFilter(mode);
        
        // 初始化排序选项
        this.updateSortOptions(mode);
        
        // 设置当前筛选状态
        this.setCurrentFilterState(mode);
    }
    
    // 渲染标签筛选器
    renderTagFilter(mode) {
        const container = document.getElementById('tag-filter-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 获取当前筛选条件下的数据
        let currentData = [];
        if (mode === 'items') {
            currentData = this.manager.getFilteredDataForTags ? this.manager.getFilteredDataForTags() : this.manager.currentData || [];
        } else {
            currentData = this.manager.currentData || [];
        }
        
        if (currentData.length === 0) {
            container.innerHTML = '<div class="empty-state">无可用标签</div>';
            return;
        }
        
        // 创建标签分类
        const categories = [];
        
        if (mode === 'items') {
            categories.push(
                {
                    title: '标签筛选',
                    key: 'tags',
                    values: this.getAllAvailableTags(currentData, 'tags'),
                    selected: this.manager.selectedTags
                },
                {
                    title: '稀有度',
                    key: 'rarity',
                    values: this.getAllAvailableTags(currentData, 'rarity'),
                    selected: this.manager.selectedRarity
                },
                {
                    title: '技能需求',
                    key: 'skill',
                    values: this.getAllAvailableTags(currentData, 'skill'),
                    selected: this.manager.selectedSkill
                },
                {
                    title: '装备需求',
                    key: 'need',
                    values: this.getAllAvailableTags(currentData, 'need'),
                    selected: this.manager.selectedNeed
                }
            );
        } else {
            categories.push(
                {
                    title: '标签筛选',
                    key: 'tags',
                    values: this.getAllAvailableTags(currentData, 'tags'),
                    selected: this.manager.selectedTags
                },
                {
                    title: '稀有度',
                    key: 'rarity',
                    values: this.getAllAvailableTags(currentData, 'rarity'),
                    selected: this.manager.selectedRarity
                },
                {
                    title: '装备需求',
                    key: 'need',
                    values: this.getAllAvailableTags(currentData, 'need'),
                    selected: this.manager.selectedNeed
                }
            );
        }
        
        // 渲染每个分类
        categories.forEach(category => {
            if (category.values.size === 0) return;
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'filter-section';
            
            const titleElement = document.createElement('h4');
            titleElement.textContent = category.title;
            
            const contentElement = document.createElement('div');
            contentElement.className = 'tag-filter';
            
            // 添加标签选项
            Array.from(category.values).sort().forEach(value => {
                if (!value || value === '') return;
                
                const tagElement = document.createElement('div');
                tagElement.className = 'tag-option';
                if (category.selected.has(value)) {
                    tagElement.classList.add('selected');
                }
                tagElement.textContent = value;
                tagElement.dataset.category = category.key;
                tagElement.dataset.value = value;
                
                tagElement.addEventListener('click', () => {
                    this.toggleTag(category.key, value);
                    // 重新渲染当前分类
                    this.renderTagCategory(categoryElement, category, mode);
                });
                
                contentElement.appendChild(tagElement);
            });
            
            categoryElement.appendChild(titleElement);
            categoryElement.appendChild(contentElement);
            container.appendChild(categoryElement);
        });
        
        // 如果没有显示任何分类
        if (container.children.length === 0) {
            container.innerHTML = '<div class="empty-state">无可用标签</div>';
        }
    }
    
    // 渲染单个标签分类
    renderTagCategory(container, category, mode) {
        const contentElement = container.querySelector('.tag-filter');
        if (!contentElement) return;
        
        contentElement.innerHTML = '';
        
        Array.from(category.values).sort().forEach(value => {
            if (!value || value === '') return;
            
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-option';
            if (category.selected.has(value)) {
                tagElement.classList.add('selected');
            }
            tagElement.textContent = value;
            tagElement.dataset.category = category.key;
            tagElement.dataset.value = value;
            
            tagElement.addEventListener('click', () => {
                this.toggleTag(category.key, value);
                this.renderTagCategory(container, category, mode);
            });
            
            contentElement.appendChild(tagElement);
        });
    }
    
    // 获取当前筛选条件下可用的标签
    getAllAvailableTags(data, category) {
        const availableTags = new Set();
        
        data.forEach(item => {
            switch(category) {
                case 'tags':
                    const tags = item.tags || item.tag || [];
                    if (Array.isArray(tags)) {
                        tags.forEach(tag => {
                            if (tag && tag !== '') availableTags.add(tag);
                        });
                    }
                    break;
                case 'rarity':
                    if (item.rarity && item.rarity !== '') {
                        availableTags.add(item.rarity);
                    }
                    break;
                case 'skill':
                    if (item.skill && item.skill !== '' && item.skill !== '无') {
                        availableTags.add(item.skill);
                    }
                    break;
                case 'need':
                    if (item.need && Array.isArray(item.need)) {
                        item.need.forEach(need => {
                            if (need && need !== '') availableTags.add(need);
                        });
                    }
                    break;
            }
        });
        
        return availableTags;
    }
    
    // 切换标签选择状态
    toggleTag(category, value) {
        let targetSet;
        
        switch(category) {
            case 'tags': targetSet = this.manager.selectedTags; break;
            case 'rarity': targetSet = this.manager.selectedRarity; break;
            case 'skill': targetSet = this.manager.selectedSkill; break;
            case 'need': targetSet = this.manager.selectedNeed; break;
            default: return;
        }
        
        if (targetSet.has(value)) {
            targetSet.delete(value);
        } else {
            targetSet.add(value);
        }
    }
    
    // 更新排序选项
    updateSortOptions(mode) {
        const sortSelect = document.getElementById('sort-by');
        if (!sortSelect) return;
        
        const currentValue = this.manager.sortBy || 'id-asc';
        
        sortSelect.innerHTML = '';
        
        // 通用排序选项
        const commonOptions = [
            { value: 'id-asc', text: 'ID 从小到大' },
            { value: 'id-desc', text: 'ID 从大到小' },
            { value: 'name-asc', text: '名称 A-Z' },
            { value: 'name-desc', text: '名称 Z-A' },
            { value: 'cost-asc', text: (mode === 'items' ? '价格' : '成本') + ' 低到高' },
            { value: 'cost-desc', text: (mode === 'items' ? '价格' : '成本') + ' 高到低' }
        ];
        
        // 模式特定的排序选项
        const modeSpecificOptions = mode === 'items' ? [
            { value: 'weight-asc', text: '重量 轻到重' },
            { value: 'weight-desc', text: '重量 重到轻' }
        ] : [
            { value: 'level-asc', text: '等级 低到高' },
            { value: 'level-desc', text: '等级 高到低' }
        ];
        
        [...commonOptions, ...modeSpecificOptions].forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.value === currentValue) {
                optionElement.selected = true;
            }
            sortSelect.appendChild(optionElement);
        });
    }
    
    // 设置当前筛选状态到UI
    setCurrentFilterState(mode) {
        // 设置主类型筛选器
        const mainTypeFilter = document.getElementById('main-type-filter');
        if (mainTypeFilter) {
            mainTypeFilter.value = this.manager.mainTypeFilter || '';
            
            // 更新子类型筛选器
            if (this.manager.mainTypeFilter) {
                if (mode === 'items') {
                    this.manager.updateSubTypeFilter(this.manager.mainTypeFilter);
                } else {
                    // 技艺管理器也需要更新
                    const specialtyManager = this.manager;
                    specialtyManager.updateSubTypeFilter(this.manager.mainTypeFilter);
                }
            }
        }
        
        // 设置子类型筛选器
        const subTypeFilter = document.getElementById('sub-type-filter');
        if (subTypeFilter) {
            subTypeFilter.value = this.manager.subTypeFilter || '';
            subTypeFilter.style.display = this.manager.subTypeFilter ? 'block' : 'none';
        }
        
        // 设置名称筛选
        const nameFilter = mode === 'items' ? 
            document.getElementById('global-search') : 
            document.getElementById('specialty-search');
            
        if (nameFilter) {
            nameFilter.value = this.manager.nameFilter || '';
        }
        
        // 设置价格筛选
        const minCost = document.getElementById('min-cost');
        const maxCost = document.getElementById('max-cost');
        
        if (minCost) minCost.value = this.manager.minCost !== null && this.manager.minCost !== undefined ? this.manager.minCost : '';
        if (maxCost) maxCost.value = this.manager.maxCost !== null && this.manager.maxCost !== undefined ? this.manager.maxCost : '';
        
        // 设置重量筛选
        const minWeight = document.getElementById('min-weight');
        const maxWeight = document.getElementById('max-weight');
        
        if (minWeight) minWeight.value = this.manager.minWeight !== null && this.manager.minWeight !== undefined ? this.manager.minWeight : '';
        if (maxWeight) maxWeight.value = this.manager.maxWeight !== null && this.manager.maxWeight !== undefined ? this.manager.maxWeight : '';
        
        // 设置等级筛选
        const minLevel = document.getElementById('min-level');
        const maxLevel = document.getElementById('max-level');
        
        if (minLevel) minLevel.value = this.manager.minLevel !== null && this.manager.minLevel !== undefined ? this.manager.minLevel : '';
        if (maxLevel) maxLevel.value = this.manager.maxLevel !== null && this.manager.maxLevel !== undefined ? this.manager.maxLevel : '';
        
        // 设置排序
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.value = this.manager.sortBy || 'id-asc';
        }
    }
    
    // 应用筛选
    applyFilter() {
        if (!this.currentModalMode) return;
        
        // 收集筛选条件
        const filters = {};
        
        // 标签筛选
        filters.selectedTags = new Set(this.manager.selectedTags);
        filters.selectedRarity = new Set(this.manager.selectedRarity);
        filters.selectedSkill = new Set(this.manager.selectedSkill);
        filters.selectedNeed = new Set(this.manager.selectedNeed);
        
        // 类型筛选
        const mainTypeFilter = document.getElementById('main-type-filter');
        const subTypeFilter = document.getElementById('sub-type-filter');
        
        filters.mainTypeFilter = mainTypeFilter ? mainTypeFilter.value : '';
        filters.subTypeFilter = subTypeFilter ? subTypeFilter.value : '';
        
        // 名称筛选
        const nameFilter = this.currentModalMode === 'items' ? 
            document.getElementById('global-search') : 
            document.getElementById('specialty-search');
            
        filters.nameFilter = nameFilter ? nameFilter.value : '';
        
        // 价格筛选
        const minCostInput = document.getElementById('min-cost');
        const maxCostInput = document.getElementById('max-cost');
        
        filters.minCost = minCostInput && minCostInput.value !== '' ? parseFloat(minCostInput.value) : null;
        filters.maxCost = maxCostInput && maxCostInput.value !== '' ? parseFloat(maxCostInput.value) : null;
        
        // 重量筛选
        const minWeightInput = document.getElementById('min-weight');
        const maxWeightInput = document.getElementById('max-weight');
        
        filters.minWeight = minWeightInput && minWeightInput.value !== '' ? parseFloat(minWeightInput.value) : null;
        filters.maxWeight = maxWeightInput && maxWeightInput.value !== '' ? parseFloat(maxWeightInput.value) : null;
        
        // 等级筛选
        const minLevelInput = document.getElementById('min-level');
        const maxLevelInput = document.getElementById('max-level');
        
        filters.minLevel = minLevelInput && minLevelInput.value !== '' ? parseInt(minLevelInput.value) : null;
        filters.maxLevel = maxLevelInput && maxLevelInput.value !== '' ? parseInt(maxLevelInput.value) : null;
        
        // 排序
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            this.manager.setSortBy(sortBy.value);
        }
        
        // 应用筛选
        this.manager.applyFilter(filters);
        
        // 更新筛选泡泡
        this.updateFilterBubbles(this.currentModalMode);
        
        // 重新渲染结果
        this.manager.renderFilterResults(
            this.currentModalMode === 'items' ? 'item-list' : 'specialty-list',
            this.currentModalMode === 'items' ? 'results-count' : 'specialty-results-count'
        );
    }
    
    // 清除筛选
    clearFilter() {
        if (!this.currentModalMode) return;
        
        // 清除管理器的筛选状态
        this.manager.clearFilters();
        
        // 重置UI元素
        this.resetFilterUI();
        
        // 更新筛选泡泡
        this.updateFilterBubbles(this.currentModalMode);
        
        // 重新渲染结果
        this.manager.renderFilterResults(
            this.currentModalMode === 'items' ? 'item-list' : 'specialty-list',
            this.currentModalMode === 'items' ? 'results-count' : 'specialty-results-count'
        );
        
        // 重新渲染标签筛选器
        this.renderTagFilter(this.currentModalMode);
    }
    
    // 重置筛选UI
    resetFilterUI() {
        // 类型筛选器
        const mainTypeFilter = document.getElementById('main-type-filter');
        const subTypeFilter = document.getElementById('sub-type-filter');
        
        if (mainTypeFilter) mainTypeFilter.value = '';
        if (subTypeFilter) {
            subTypeFilter.value = '';
            subTypeFilter.style.display = 'none';
        }
        
        // 名称筛选
        const nameFilter = this.currentModalMode === 'items' ? 
            document.getElementById('global-search') : 
            document.getElementById('specialty-search');
            
        if (nameFilter) nameFilter.value = '';
        
        // 价格筛选
        const minCost = document.getElementById('min-cost');
        const maxCost = document.getElementById('max-cost');
        
        if (minCost) minCost.value = '';
        if (maxCost) maxCost.value = '';
        
        // 重量筛选
        const minWeight = document.getElementById('min-weight');
        const maxWeight = document.getElementById('max-weight');
        
        if (minWeight) minWeight.value = '';
        if (maxWeight) maxWeight.value = '';
        
        // 等级筛选
        const minLevel = document.getElementById('min-level');
        const maxLevel = document.getElementById('max-level');
        
        if (minLevel) minLevel.value = '';
        if (maxLevel) maxLevel.value = '';
        
        // 排序
        const sortBy = document.getElementById('sort-by');
        if (sortBy) sortBy.value = 'id-asc';
    }
    
    // 更新筛选泡泡
    updateFilterBubbles(mode) {
        const bubblesContainerId = mode === 'items' ? 'active-filter-bubbles' : 'specialty-filter-bubbles';
        const bubblesContainer = document.getElementById(bubblesContainerId);
        if (!bubblesContainer) return;
        
        bubblesContainer.innerHTML = '';
        
        // 只显示当前模式的筛选条件
        const manager = this.manager;
        let hasActiveFilters = false;
        
        // 类型筛选
        if (manager.mainTypeFilter) {
            const bubble = this.createFilterBubble(`主类型: ${manager.mainTypeFilter}`, 'main-type');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        if (manager.subTypeFilter) {
            const bubble = this.createFilterBubble(`子类型: ${manager.subTypeFilter}`, 'sub-type');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 等级筛选（仅技艺模式）
        if ((manager.minLevel !== null || manager.maxLevel !== null) && mode === 'specialties') {
            let levelText = '等级: ';
            if (manager.minLevel !== null && manager.maxLevel !== null) {
                levelText += `${manager.minLevel} - ${manager.maxLevel}`;
            } else if (manager.minLevel !== null) {
                levelText += `≥ ${manager.minLevel}`;
            } else {
                levelText += `≤ ${manager.maxLevel}`;
            }
            
            const bubble = this.createFilterBubble(levelText, 'level');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 名称筛选
        if (manager.nameFilter) {
            const bubble = this.createFilterBubble(`搜索: "${manager.nameFilter}"`, 'name');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 价格筛选
        if (manager.minCost !== null || manager.maxCost !== null) {
            let priceText = mode === 'items' ? '价格: ' : '成本: ';
            if (manager.minCost !== null && manager.maxCost !== null) {
                priceText += `${manager.minCost} - ${manager.maxCost}`;
            } else if (manager.minCost !== null) {
                priceText += `≥ ${manager.minCost}`;
            } else {
                priceText += `≤ ${manager.maxCost}`;
            }
            
            const bubble = this.createFilterBubble(priceText, 'price');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 重量筛选（仅物品模式）
        if ((manager.minWeight !== null || manager.maxWeight !== null) && mode === 'items') {
            let weightText = '重量: ';
            if (manager.minWeight !== null && manager.maxWeight !== null) {
                weightText += `${manager.minWeight} - ${manager.maxWeight}`;
            } else if (manager.minWeight !== null) {
                weightText += `≥ ${manager.minWeight}`;
            } else {
                weightText += `≤ ${manager.maxWeight}`;
            }
            
            const bubble = this.createFilterBubble(weightText, 'weight');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 标签筛选
        const allSelectedTags = [
            ...Array.from(manager.selectedTags).map(t => `标签: ${t}`),
            ...Array.from(manager.selectedRarity).map(t => `稀有度: ${t}`),
            ...Array.from(manager.selectedSkill).map(t => `技能: ${t}`),
            ...Array.from(manager.selectedNeed).map(t => `需求: ${t}`)
        ];
        
        if (allSelectedTags.length > 0) {
            allSelectedTags.forEach(tagText => {
                const bubble = this.createFilterBubble(tagText, 'tags');
                bubblesContainer.appendChild(bubble);
            });
            hasActiveFilters = true;
        }
        
        // 如果没有活动筛选，显示提示
        if (!hasActiveFilters) {
            bubblesContainer.innerHTML = '<div class="filter-bubble" style="background: transparent; border: 2px dashed var(--border-gray); color: var(--text-light);">无活动筛选条件</div>';
        } else {
            // 添加清空按钮
            const clearBubble = document.createElement('div');
            clearBubble.className = 'filter-bubble clear-all';
            clearBubble.textContent = '清空';
            clearBubble.style.cursor = 'pointer';
            clearBubble.style.background = 'var(--error-color)';
            clearBubble.style.color = 'white';
            clearBubble.style.marginLeft = 'auto';
            clearBubble.addEventListener('click', () => {
                this.manager.clearFilters();
                this.updateFilterBubbles(mode);
                this.manager.renderFilterResults(
                    mode === 'items' ? 'item-list' : 'specialty-list',
                    mode === 'items' ? 'results-count' : 'specialty-results-count'
                );
            });
            bubblesContainer.appendChild(clearBubble);
        }
    }
    
    // 创建筛选泡泡
    createFilterBubble(text, filterType) {
        const bubble = document.createElement('div');
        bubble.className = 'filter-bubble';
        bubble.innerHTML = `
            ${text}
            <span class="remove" data-type="${filterType}">×</span>
        `;
        
        // 添加移除事件
        const removeBtn = bubble.querySelector('.remove');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFilter(filterType);
            this.updateFilterBubbles(this.currentModalMode);
            this.manager.renderFilterResults(
                this.currentModalMode === 'items' ? 'item-list' : 'specialty-list',
                this.currentModalMode === 'items' ? 'results-count' : 'specialty-results-count'
            );
        });
        
        return bubble;
    }
    
    // 移除特定筛选
    removeFilter(filterType) {
        switch(filterType) {
            case 'main-type':
                this.manager.mainTypeFilter = '';
                this.manager.subTypeFilter = '';
                break;
            case 'sub-type':
                this.manager.subTypeFilter = '';
                break;
            case 'level':
                this.manager.minLevel = null;
                this.manager.maxLevel = null;
                break;
            case 'name':
                this.manager.nameFilter = '';
                break;
            case 'price':
                this.manager.minCost = null;
                this.manager.maxCost = null;
                break;
            case 'weight':
                this.manager.minWeight = null;
                this.manager.maxWeight = null;
                break;
            case 'tags':
                this.manager.selectedTags.clear();
                this.manager.selectedRarity.clear();
                this.manager.selectedSkill.clear();
                this.manager.selectedNeed.clear();
                break;
        }
        
        // 重新应用筛选
        this.manager.applyFilter({});
    }
}