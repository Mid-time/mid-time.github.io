// ================================
// 统一筛选系统 - 独立管理物品和技艺的筛选状态
// ================================
class UnifiedFilterSystem {
    constructor() {
        // 独立的筛选状态存储
        this.itemFilters = this.createFilterSet();
        this.specialtyFilters = this.createFilterSet();
        
        // 当前模式
        this.currentMode = 'items';
        
        // 初始化事件
        this.initializeEvents();
        
        // 添加实时更新定时器
        this.realTimeUpdateTimer = null;
    }
    
    // 创建筛选集合
    createFilterSet() {
        return {
            selectedTags: new Set(),
            selectedRarity: new Set(),
            selectedSkill: new Set(),
            selectedNeed: new Set(),
            nameFilter: '',
            minCost: null,
            maxCost: null,
            minWeight: null,
            maxWeight: null,
            minLevel: null,
            maxLevel: null,
            mainTypeFilter: '',
            subTypeFilter: '',
            sortBy: 'id-asc'
        };
    }
    
    // 获取当前筛选状态
    getCurrentFilters() {
        return this.currentMode === 'items' ? this.itemFilters : this.specialtyFilters;
    }
    
    // 设置当前模式
    setMode(mode) {
        this.currentMode = mode;
        this.updateFilterBubbles();
    }
    
    // 清除当前模式的筛选
    clearCurrentFilters() {
        const filters = this.getCurrentFilters();
        Object.assign(filters, this.createFilterSet());
        this.updateFilterBubbles();
    }
    
    // 应用筛选到数据 - 增强版：返回筛选后的数据和可用标签
    applyFiltersToData(data, mode = null, returnAvailableTags = false) {
        const filters = mode ? (mode === 'items' ? this.itemFilters : this.specialtyFilters) : this.getCurrentFilters();
        const availableTags = {
            tags: new Set(),
            rarity: new Set(),
            skill: new Set(),
            need: new Set()
        };
        
        const filteredData = data.filter(item => {
            // 类型筛选
            const mainType = item.maintype || '';
            const subType = item.subtype || '';
            
            if (filters.mainTypeFilter && mainType !== filters.mainTypeFilter) {
                return false;
            }
            if (filters.subTypeFilter && subType !== filters.subTypeFilter) {
                return false;
            }
            
            // 等级筛选（仅技艺模式）
            if (mode === 'specialties' || (mode === null && this.currentMode === 'specialties')) {
                const itemLevel = item.level || 1;
                if (filters.minLevel !== null && itemLevel < filters.minLevel) return false;
                if (filters.maxLevel !== null && itemLevel > filters.maxLevel) return false;
            }
            
            // 名称/描述筛选
            if (filters.nameFilter) {
                const searchTerm = filters.nameFilter.toLowerCase();
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
            
            // 价格/成本筛选
            let itemCost = this.getCurrentCost(item, mode);
            if (itemCost === null) itemCost = 0;
            
            if (filters.minCost !== null && itemCost < filters.minCost) return false;
            if (filters.maxCost !== null && itemCost > filters.maxCost) return false;
            
            // 重量筛选（仅物品模式）
            if (mode === 'items' || (mode === null && this.currentMode === 'items')) {
                if (filters.minWeight !== null && item.weight < filters.minWeight) return false;
                if (filters.maxWeight !== null && item.weight > filters.maxWeight) return false;
            }
            
            // 标签筛选
            const tags = item.tags || item.tag || [];
            if (filters.selectedTags.size > 0) {
                const hasAllTags = Array.from(filters.selectedTags).every(tag => 
                    tags.includes(tag)
                );
                if (!hasAllTags) return false;
            }
            
            // 稀有度筛选
            if (filters.selectedRarity.size > 0 && !filters.selectedRarity.has(item.rarity)) {
                return false;
            }
            
            // 技能需求筛选（仅物品模式）
            if ((mode === 'items' || (mode === null && this.currentMode === 'items')) && 
                filters.selectedSkill.size > 0 && !filters.selectedSkill.has(item.skill)) {
                return false;
            }
            
            // 需求筛选
            if (filters.selectedNeed.size > 0) {
                const hasAllNeed = Array.from(filters.selectedNeed).every(need => 
                    item.need && item.need.includes(need)
                );
                if (!hasAllNeed) return false;
            }
            
            // 收集可用标签（如果需要）
            if (returnAvailableTags) {
                // 收集标签
                tags.forEach(tag => {
                    if (tag && tag !== '') availableTags.tags.add(tag);
                });
                
                // 收集稀有度
                if (item.rarity && item.rarity !== '') {
                    availableTags.rarity.add(item.rarity);
                }
                
                // 收集技能需求（仅物品模式）
                if ((mode === 'items' || (mode === null && this.currentMode === 'items')) && 
                    item.skill && item.skill !== '' && item.skill !== '无') {
                    availableTags.skill.add(item.skill);
                }
                
                // 收集需求
                if (item.need && Array.isArray(item.need)) {
                    item.need.forEach(need => {
                        if (need && need !== '') availableTags.need.add(need);
                    });
                }
            }
            
            return true;
        });
        
        if (returnAvailableTags) {
            return { filteredData, availableTags };
        }
        
        return filteredData;
    }
    
    // 获取当前成本（考虑技艺等级）
    getCurrentCost(item, mode = null) {
        if (!item.cost) return 0;
        
        // 如果是技艺且有当前等级，返回当前等级的成本
        if ((mode === 'specialties' || (mode === null && this.currentMode === 'specialties')) && 
            item.currentLevel && Array.isArray(item.cost)) {
            const levelIndex = item.currentLevel - 1;
            if (levelIndex >= 0 && levelIndex < item.cost.length) {
                return item.cost[levelIndex];
            }
        }
        
        // 否则返回基础成本
        if (Array.isArray(item.cost)) {
            return item.cost[0] || 0;
        }
        
        return item.cost;
    }
    
    // 更新筛选泡泡 - 修复无结果筛选条件消失
    updateFilterBubbles() {
        const mode = this.currentMode;
        const bubblesContainerId = mode === 'items' ? 'active-filter-bubbles' : 'specialty-filter-bubbles';
        const bubblesContainer = document.getElementById(bubblesContainerId);
        if (!bubblesContainer) return;
        
        bubblesContainer.innerHTML = '';
        
        const filters = this.getCurrentFilters();
        let hasActiveFilters = false;
        
        // 类型筛选
        if (filters.mainTypeFilter) {
            const bubble = this.createFilterBubble(`主类型: ${filters.mainTypeFilter}`, 'main-type');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        if (filters.subTypeFilter) {
            const bubble = this.createFilterBubble(`子类型: ${filters.subTypeFilter}`, 'sub-type');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 等级筛选（仅技艺模式）
        if ((filters.minLevel !== null || filters.maxLevel !== null) && mode === 'specialties') {
            let levelText = '等级: ';
            if (filters.minLevel !== null && filters.maxLevel !== null) {
                levelText += `${filters.minLevel} - ${filters.maxLevel}`;
            } else if (filters.minLevel !== null) {
                levelText += `≥ ${filters.minLevel}`;
            } else {
                levelText += `≤ ${filters.maxLevel}`;
            }
            
            const bubble = this.createFilterBubble(levelText, 'level');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 名称筛选
        if (filters.nameFilter) {
            const bubble = this.createFilterBubble(`搜索: "${filters.nameFilter}"`, 'name');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 价格筛选
        if (filters.minCost !== null || filters.maxCost !== null) {
            let priceText = mode === 'items' ? '价格: ' : '成本: ';
            if (filters.minCost !== null && filters.maxCost !== null) {
                priceText += `${filters.minCost} - ${filters.maxCost}`;
            } else if (filters.minCost !== null) {
                priceText += `≥ ${filters.minCost}`;
            } else {
                priceText += `≤ ${filters.maxCost}`;
            }
            
            const bubble = this.createFilterBubble(priceText, 'price');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 重量筛选（仅物品模式）
        if ((filters.minWeight !== null || filters.maxWeight !== null) && mode === 'items') {
            let weightText = '重量: ';
            if (filters.minWeight !== null && filters.maxWeight !== null) {
                weightText += `${filters.minWeight} - ${filters.maxWeight}`;
            } else if (filters.minWeight !== null) {
                weightText += `≥ ${filters.minWeight}`;
            } else {
                weightText += `≤ ${filters.maxWeight}`;
            }
            
            const bubble = this.createFilterBubble(weightText, 'weight');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 标签筛选
        const allSelectedTags = [
            ...Array.from(filters.selectedTags).map(t => `标签: ${t}`),
            ...Array.from(filters.selectedRarity).map(t => `稀有度: ${t}`),
            ...Array.from(filters.selectedSkill).map(t => `技能: ${t}`),
            ...Array.from(filters.selectedNeed).map(t => `需求: ${t}`)
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
            clearBubble.addEventListener('click', () => {
                this.clearCurrentFilters();
                this.triggerFilterChange();
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
            this.updateFilterBubbles();
            this.triggerFilterChange();
        });
        
        return bubble;
    }
    
    // 移除特定筛选
    removeFilter(filterType) {
        const filters = this.getCurrentFilters();
        
        switch(filterType) {
            case 'main-type':
                filters.mainTypeFilter = '';
                filters.subTypeFilter = '';
                break;
            case 'sub-type':
                filters.subTypeFilter = '';
                break;
            case 'level':
                filters.minLevel = null;
                filters.maxLevel = null;
                break;
            case 'name':
                filters.nameFilter = '';
                break;
            case 'price':
                filters.minCost = null;
                filters.maxCost = null;
                break;
            case 'weight':
                filters.minWeight = null;
                filters.maxWeight = null;
                break;
            case 'tags':
                filters.selectedTags.clear();
                filters.selectedRarity.clear();
                filters.selectedSkill.clear();
                filters.selectedNeed.clear();
                break;
        }
    }
    
    // 触发筛选变化事件
    triggerFilterChange() {
        const event = new CustomEvent('filterChange', { detail: { mode: this.currentMode } });
        document.dispatchEvent(event);
    }
    
    // 初始化事件 - 增强版：添加实时更新和动态隐藏不可用标签
    initializeEvents() {
        // 监听筛选弹窗应用按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'apply-filter') {
                this.collectFilterValuesFromModal();
                this.updateFilterBubbles();
                this.triggerFilterChange();
                
                // 应用筛选后关闭弹窗
                this.hideFilterModal();
            } else if (e.target.id === 'clear-filter') {
                this.clearModalFilters();
            }
        });
        
        // 监听搜索框输入
        const globalSearch = document.getElementById('global-search');
        const specialtySearch = document.getElementById('specialty-search');
        
        if (globalSearch) {
            let searchTimeout;
            globalSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.itemFilters.nameFilter = e.target.value;
                    this.updateFilterBubbles();
                    this.triggerFilterChange();
                }, 300);
            });
        }
        
        if (specialtySearch) {
            let searchTimeout;
            specialtySearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.specialtyFilters.nameFilter = e.target.value;
                    this.updateFilterBubbles();
                    this.triggerFilterChange();
                }, 300);
            });
        }
        
        // 监听主类型筛选器变化 - 实现实时筛选
        document.addEventListener('change', (e) => {
            if (e.target.id === 'main-type-filter' || e.target.id === 'sub-type-filter') {
                const modal = document.getElementById('filter-modal');
                if (modal && modal.style.display === 'flex') {
                    // 如果筛选弹窗打开，实时更新筛选条件
                    this.collectFilterValuesFromModal();
                    this.updateFilterBubbles();
                    this.triggerFilterChange();
                    
                    // 重新渲染标签筛选器（动态隐藏不可用标签）
                    this.updateTagFilterAfterTypeChange();
                }
            }
        });
        
        // 监听数值输入框变化 - 实现实时筛选
        const numericInputs = ['min-level', 'max-level', 'min-cost', 'max-cost', 'min-weight', 'max-weight'];
        numericInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                let inputTimeout;
                input.addEventListener('input', (e) => {
                    clearTimeout(inputTimeout);
                    inputTimeout = setTimeout(() => {
                        const modal = document.getElementById('filter-modal');
                        if (modal && modal.style.display === 'flex') {
                            this.collectFilterValuesFromModal();
                            this.updateFilterBubbles();
                            this.triggerFilterChange();
                        }
                    }, 300);
                });
            }
        });
        
        // 监听排序变化 - 实现实时筛选
        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const modal = document.getElementById('filter-modal');
                if (modal && modal.style.display === 'flex') {
                    this.collectFilterValuesFromModal();
                    this.updateFilterBubbles();
                    this.triggerFilterChange();
                }
            });
        }
        
        // 监听标签点击 - 实时更新
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-option')) {
                const modal = document.getElementById('filter-modal');
                if (modal && modal.style.display === 'flex') {
                    // 延迟一点时间确保点击状态已经改变
                    setTimeout(() => {
                        this.collectFilterValuesFromModal();
                        this.updateFilterBubbles();
                        this.triggerFilterChange();
                    }, 50);
                }
            }
        });
    }
    
    // 从筛选弹窗收集筛选值
    collectFilterValuesFromModal() {
        const filters = this.getCurrentFilters();
        
        // 类型筛选
        const mainTypeFilter = document.getElementById('main-type-filter');
        const subTypeFilter = document.getElementById('sub-type-filter');
        
        filters.mainTypeFilter = mainTypeFilter ? mainTypeFilter.value : '';
        filters.subTypeFilter = subTypeFilter ? subTypeFilter.value : '';
        
        // 等级筛选
        const minLevel = document.getElementById('min-level');
        const maxLevel = document.getElementById('max-level');
        
        filters.minLevel = minLevel && minLevel.value !== '' ? parseInt(minLevel.value) : null;
        filters.maxLevel = maxLevel && maxLevel.value !== '' ? parseInt(maxLevel.value) : null;
        
        // 价格筛选
        const minCost = document.getElementById('min-cost');
        const maxCost = document.getElementById('max-cost');
        
        filters.minCost = minCost && minCost.value !== '' ? parseFloat(minCost.value) : null;
        filters.maxCost = maxCost && maxCost.value !== '' ? parseFloat(maxCost.value) : null;
        
        // 重量筛选
        const minWeight = document.getElementById('min-weight');
        const maxWeight = document.getElementById('max-weight');
        
        filters.minWeight = minWeight && minWeight.value !== '' ? parseFloat(minWeight.value) : null;
        filters.maxWeight = maxWeight && maxWeight.value !== '' ? parseFloat(maxWeight.value) : null;
        
        // 排序
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            filters.sortBy = sortBy.value;
        }
        
        // 标签筛选（需要从弹窗中的选中状态收集）
        this.collectTagFiltersFromModal();
    }
    
    // 收集标签筛选值
    collectTagFiltersFromModal() {
        const filters = this.getCurrentFilters();
        
        // 重置标签集合
        filters.selectedTags.clear();
        filters.selectedRarity.clear();
        filters.selectedSkill.clear();
        filters.selectedNeed.clear();
        
        // 收集选中的标签
        const tagOptions = document.querySelectorAll('.tag-option.selected');
        tagOptions.forEach(option => {
            const category = option.dataset.category;
            const value = option.dataset.value;
            
            switch(category) {
                case 'tags': filters.selectedTags.add(value); break;
                case 'rarity': filters.selectedRarity.add(value); break;
                case 'skill': filters.selectedSkill.add(value); break;
                case 'need': filters.selectedNeed.add(value); break;
            }
        });
    }
    
    // 清除弹窗中的筛选值
    clearModalFilters() {
        // 类型筛选器
        const mainTypeFilter = document.getElementById('main-type-filter');
        const subTypeFilter = document.getElementById('sub-type-filter');
        
        if (mainTypeFilter) mainTypeFilter.value = '';
        if (subTypeFilter) {
            subTypeFilter.value = '';
            subTypeFilter.style.display = 'none';
        }
        
        // 数值筛选器
        const numericInputs = [
            'min-level', 'max-level',
            'min-cost', 'max-cost',
            'min-weight', 'max-weight'
        ];
        
        numericInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
        
        // 标签筛选器
        const tagOptions = document.querySelectorAll('.tag-option.selected');
        tagOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        // 排序
        const sortBy = document.getElementById('sort-by');
        if (sortBy) sortBy.value = 'id-asc';
        
        // 清除筛选状态
        this.clearCurrentFilters();
    }
    
    // 隐藏筛选弹窗
    hideFilterModal() {
        const modal = document.getElementById('filter-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // 对数据进行排序
    sortData(data, mode = null) {
        const filters = mode ? (mode === 'items' ? this.itemFilters : this.specialtyFilters) : this.getCurrentFilters();
        const sortBy = filters.sortBy || 'id-asc';
        
        return [...data].sort((a, b) => {
            switch(sortBy) {
                case 'id-asc':
                    return (a.id || 0) - (b.id || 0);
                case 'id-desc':
                    return (b.id || 0) - (a.id || 0);
                case 'name-asc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '');
                case 'cost-asc':
                    return this.getCurrentCost(a, mode) - this.getCurrentCost(b, mode);
                case 'cost-desc':
                    return this.getCurrentCost(b, mode) - this.getCurrentCost(a, mode);
                case 'weight-asc':
                    if (mode === 'items' || (mode === null && this.currentMode === 'items')) {
                        return (a.weight || 0) - (b.weight || 0);
                    }
                    return 0;
                case 'weight-desc':
                    if (mode === 'items' || (mode === null && this.currentMode === 'items')) {
                        return (b.weight || 0) - (a.weight || 0);
                    }
                    return 0;
                case 'level-asc':
                    if (mode === 'specialties' || (mode === null && this.currentMode === 'specialties')) {
                        return (a.level || 0) - (b.level || 0);
                    }
                    return 0;
                case 'level-desc':
                    if (mode === 'specialties' || (mode === null && this.currentMode === 'specialties')) {
                        return (b.level || 0) - (a.level || 0);
                    }
                    return 0;
                default:
                    return (a.id || 0) - (b.id || 0);
            }
        });
    }
    
    // 更新类型变化后的标签筛选器
    async updateTagFilterAfterTypeChange() {
        // 获取当前模式的管理器
        const manager = this.currentMode === 'items' ? 
            (window.unifiedApp && window.unifiedApp.itemManager) : 
            (window.unifiedApp && window.unifiedApp.specialtyManager);
        
        if (!manager || !manager.currentData) return;
        
        // 获取当前筛选条件下的数据和可用标签
        const result = this.applyFiltersToData(manager.currentData, this.currentMode, true);
        const { availableTags } = result;
        
        // 获取当前选中的标签
        const filters = this.getCurrentFilters();
        
        // 更新标签筛选器显示
        this.updateTagFilterDisplay(availableTags, filters);
    }
    
    // 更新标签筛选器显示
    updateTagFilterDisplay(availableTags, currentFilters) {
        const container = document.getElementById('tag-filter-container');
        if (!container) return;
        
        // 获取所有标签选项
        const tagOptions = container.querySelectorAll('.tag-option');
        
        tagOptions.forEach(option => {
            const category = option.dataset.category;
            const value = option.dataset.value;
            
            // 检查这个标签在当前筛选条件下是否可用
            let isAvailable = false;
            switch(category) {
                case 'tags':
                    isAvailable = availableTags.tags.has(value);
                    break;
                case 'rarity':
                    isAvailable = availableTags.rarity.has(value);
                    break;
                case 'skill':
                    isAvailable = availableTags.skill.has(value);
                    break;
                case 'need':
                    isAvailable = availableTags.need.has(value);
                    break;
            }
            
            // 如果标签不可用，隐藏它
            if (!isAvailable) {
                option.style.display = 'none';
                // 如果这个标签当前被选中，取消选中它
                if (option.classList.contains('selected')) {
                    option.classList.remove('selected');
                    
                    // 从筛选器中移除这个标签
                    switch(category) {
                        case 'tags':
                            currentFilters.selectedTags.delete(value);
                            break;
                        case 'rarity':
                            currentFilters.selectedRarity.delete(value);
                            break;
                        case 'skill':
                            currentFilters.selectedSkill.delete(value);
                            break;
                        case 'need':
                            currentFilters.selectedNeed.delete(value);
                            break;
                    }
                }
            } else {
                option.style.display = 'flex';
            }
        });
        
        // 检查是否有空的分类需要隐藏
        const filterSections = container.querySelectorAll('.filter-section');
        filterSections.forEach(section => {
            const category = section.querySelector('h4')?.textContent;
            const tagOptions = section.querySelectorAll('.tag-option');
            const visibleOptions = Array.from(tagOptions).filter(opt => opt.style.display !== 'none');
            
            if (visibleOptions.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        });
    }
}