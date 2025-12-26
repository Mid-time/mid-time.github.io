// ================================
// 统一筛选管理器 - 修复getFilteredData调用
// ================================
class UnifiedFilterManager {
    constructor(manager) {
        this.manager = manager;
        this.selectedTags = new Set();
        this.selectedRarity = new Set();
        this.selectedSkill = new Set();
        this.selectedNeed = new Set();
        
        // 筛选弹窗状态
        this.filterModal = null;
        
        // 不再使用防抖，改为点击应用筛选才更新
    }
    
    // 初始化筛选界面
    initializeFilterUI() {
        this.renderTagFilter();
        this.initializeEventListeners();
        this.initializeFilterModal();
    }
    
    // 渲染标签筛选器（带自动隐藏无结果选项）
    renderTagFilter() {
        const container = document.getElementById('tag-filter-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 获取当前筛选条件下的数据（排除当前正在筛选的标签）
        const currentData = this.manager.getFilteredDataForTags(
            this.selectedTags,
            this.selectedRarity,
            this.selectedSkill,
            this.selectedNeed,
            document.getElementById('main-type-filter')?.value || '',
            document.getElementById('sub-type-filter')?.value || '',
            document.getElementById('min-level')?.value || null,
            document.getElementById('max-level')?.value || null
        );
        
        // 创建标签分类
        const categories = [];
        
        if (this.manager.currentMode === 'items') {
            categories.push(
                {
                    title: '标签筛选',
                    key: 'tags',
                    values: this.getAllAvailableTags(currentData, 'tags'),
                    selected: this.selectedTags
                },
                {
                    title: '稀有度',
                    key: 'rarity',
                    values: this.getAllAvailableTags(currentData, 'rarity'),
                    selected: this.selectedRarity
                },
                {
                    title: '技能需求',
                    key: 'skill',
                    values: this.getAllAvailableTags(currentData, 'skill'),
                    selected: this.selectedSkill
                },
                {
                    title: '装备需求',
                    key: 'need',
                    values: this.getAllAvailableTags(currentData, 'need'),
                    selected: this.selectedNeed
                }
            );
        } else {
            categories.push(
                {
                    title: '标签筛选',
                    key: 'tags',
                    values: this.getAllAvailableTags(currentData, 'tags'),
                    selected: this.selectedTags
                },
                {
                    title: '稀有度',
                    key: 'rarity',
                    values: this.getAllAvailableTags(currentData, 'rarity'),
                    selected: this.selectedRarity
                },
                {
                    title: '装备需求',
                    key: 'need',
                    values: this.getAllAvailableTags(currentData, 'need'),
                    selected: this.selectedNeed
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
                tagElement.textContent = value;
                tagElement.dataset.category = category.key;
                tagElement.dataset.value = value;
                
                if (category.selected.has(value)) {
                    tagElement.classList.add('selected');
                }
                
                tagElement.addEventListener('click', () => {
                    this.toggleTag(category.key, value);
                    this.renderTagFilter();
                });
                
                contentElement.appendChild(tagElement);
            });
            
            categoryElement.appendChild(titleElement);
            categoryElement.appendChild(contentElement);
            container.appendChild(categoryElement);
        });
    }
    
    // 获取当前筛选条件下可用的标签
    getAllAvailableTags(data, category) {
        const availableTags = new Set();
        
        data.forEach(item => {
            switch(category) {
                case 'tags':
                    const tags = item.tags || item.tag || [];
                    tags.forEach(tag => {
                        if (tag && tag !== '') availableTags.add(tag);
                    });
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
            case 'tags': targetSet = this.selectedTags; break;
            case 'rarity': targetSet = this.selectedRarity; break;
            case 'skill': targetSet = this.selectedSkill; break;
            case 'need': targetSet = this.selectedNeed; break;
            default: return;
        }
        
        if (targetSet.has(value)) {
            targetSet.delete(value);
        } else {
            targetSet.add(value);
        }
    }
    
    // 清除所有筛选
    clearAllFilters() {
        this.selectedTags.clear();
        this.selectedRarity.clear();
        this.selectedSkill.clear();
        this.selectedNeed.clear();
        
        // 重置UI元素
        const mainTypeFilter = document.getElementById('main-type-filter');
        const subTypeFilter = document.getElementById('sub-type-filter');
        const minLevel = document.getElementById('min-level');
        const maxLevel = document.getElementById('max-level');
        const minCost = document.getElementById('min-cost');
        const maxCost = document.getElementById('max-cost');
        const minWeight = document.getElementById('min-weight');
        const maxWeight = document.getElementById('max-weight');
        const globalSearch = document.getElementById('global-search');
        
        if (mainTypeFilter) mainTypeFilter.value = '';
        if (subTypeFilter) subTypeFilter.value = '';
        if (minLevel) minLevel.value = '';
        if (maxLevel) maxLevel.value = '';
        if (minCost) minCost.value = '';
        if (maxCost) maxCost.value = '';
        if (minWeight) minWeight.value = '';
        if (maxWeight) maxWeight.value = '';
        if (globalSearch) globalSearch.value = '';
        
        // 更新子类型筛选器
        if (this.manager.updateSubTypeFilter) {
            this.manager.updateSubTypeFilter('');
        }
        
        // 更新UI
        this.renderTagFilter();
        this.updateActiveFilterBubbles();
    }
    
    // 初始化筛选弹窗
    initializeFilterModal() {
        this.filterModal = document.getElementById('filter-modal');
        const filterToggle = document.getElementById('filter-toggle');
        const closeBtn = this.filterModal?.querySelector('.close-filter-btn');
        const applyBtn = document.getElementById('apply-filter');
        const clearBtn = document.getElementById('clear-filter');
        
        if (!this.filterModal || !filterToggle || !closeBtn || !applyBtn || !clearBtn) {
            console.warn('筛选弹窗元素未找到');
            return;
        }
        
        // 切换弹窗显示
        filterToggle.addEventListener('click', () => {
            this.filterModal.style.display = 'flex';
            this.renderTagFilter();
        });
        
        // 关闭弹窗
        closeBtn.addEventListener('click', () => {
            this.filterModal.style.display = 'none';
        });
        
        // 点击弹窗外关闭
        this.filterModal.addEventListener('click', (e) => {
            if (e.target === this.filterModal) {
                this.filterModal.style.display = 'none';
            }
        });
        
        // 应用筛选
        applyBtn.addEventListener('click', () => {
            this.applyFilter();
            this.filterModal.style.display = 'none';
        });
        
        // 清除筛选
        clearBtn.addEventListener('click', () => {
            this.clearAllFilters();
            this.applyFilter();
            this.filterModal.style.display = 'none';
        });
    }
    
    // 初始化事件监听器
    initializeEventListeners() {
        // 主类型筛选器变化时更新子类型筛选器
        const mainTypeFilter = document.getElementById('main-type-filter');
        if (mainTypeFilter) {
            mainTypeFilter.addEventListener('change', (e) => {
                if (this.manager.updateSubTypeFilter) {
                    this.manager.updateSubTypeFilter(e.target.value);
                }
                this.renderTagFilter();
            });
        }
        
        // 子类型筛选器变化时重新渲染标签筛选器
        const subTypeFilter = document.getElementById('sub-type-filter');
        if (subTypeFilter) {
            subTypeFilter.addEventListener('change', () => {
                this.renderTagFilter();
            });
        }
        
        // 其他筛选条件变化时也重新渲染标签筛选器
        const levelInputs = ['min-level', 'max-level', 'min-cost', 'max-cost', 'min-weight', 'max-weight'];
        levelInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => {
                    this.renderTagFilter();
                });
            }
        });
        
        // 排序选择
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.manager.setSortBy(e.target.value);
                this.applyFilter();
            });
        }
    }
    
    // 应用筛选
    applyFilter() {
        // 获取全局搜索
        const globalSearch = document.getElementById('global-search');
        const nameFilter = globalSearch ? globalSearch.value : '';
        
        // 获取价格筛选
        const minCostInput = document.getElementById('min-cost');
        const maxCostInput = document.getElementById('max-cost');
        const minCostValue = minCostInput && minCostInput.value ? parseFloat(minCostInput.value) : null;
        const maxCostValue = maxCostInput && maxCostInput.value ? parseFloat(maxCostInput.value) : null;
        
        let minCost = minCostValue;
        let maxCost = maxCostValue;
        
        // 获取重量筛选
        const minWeightInput = document.getElementById('min-weight');
        const maxWeightInput = document.getElementById('max-weight');
        const minWeight = minWeightInput && minWeightInput.value ? parseFloat(minWeightInput.value) : null;
        const maxWeight = maxWeightInput && maxWeightInput.value ? parseFloat(maxWeightInput.value) : null;
        
        // 获取等级筛选
        const minLevelInput = document.getElementById('min-level');
        const maxLevelInput = document.getElementById('max-level');
        const minLevel = minLevelInput && minLevelInput.value ? parseInt(minLevelInput.value) : null;
        const maxLevel = maxLevelInput && maxLevelInput.value ? parseInt(maxLevelInput.value) : null;
        
        const mainTypeFilter = document.getElementById('main-type-filter')?.value || '';
        const subTypeFilter = document.getElementById('sub-type-filter')?.value || '';
        
        // 更新活动筛选泡泡
        this.updateActiveFilterBubbles(mainTypeFilter, subTypeFilter, nameFilter, minCost, maxCost, minWeight, maxWeight, minLevel, maxLevel);
        
        // 应用筛选
        this.manager.applyFilter(
            this.selectedTags,
            this.selectedRarity,
            this.selectedSkill,
            this.selectedNeed,
            nameFilter,
            minCost,
            maxCost,
            minWeight,
            maxWeight,
            minLevel,
            maxLevel,
            mainTypeFilter,
            subTypeFilter
        );
    }
    
    // 更新活动筛选泡泡（添加清空按钮）
    updateActiveFilterBubbles(mainTypeFilter, subTypeFilter, nameFilter, minCost, maxCost, minWeight, maxWeight, minLevel, maxLevel) {
        const bubblesContainer = document.getElementById('active-filter-bubbles');
        if (!bubblesContainer) return;
        
        bubblesContainer.innerHTML = '';
        
        let hasActiveFilters = false;
        
        // 类型筛选
        if (mainTypeFilter) {
            const bubble = this.createFilterBubble(`主类型: ${mainTypeFilter}`, 'main-type');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        if (subTypeFilter) {
            const bubble = this.createFilterBubble(`子类型: ${subTypeFilter}`, 'sub-type');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 等级筛选（仅特质模式）
        if ((minLevel !== null || maxLevel !== null) && this.manager.currentMode === 'specialties') {
            let levelText = '等级: ';
            if (minLevel !== null && maxLevel !== null) {
                levelText += `${minLevel} - ${maxLevel}`;
            } else if (minLevel !== null) {
                levelText += `≥ ${minLevel}`;
            } else {
                levelText += `≤ ${maxLevel}`;
            }
            
            const bubble = this.createFilterBubble(levelText, 'level');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 名称筛选
        if (nameFilter) {
            const bubble = this.createFilterBubble(`搜索: "${nameFilter}"`, 'name');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 价格筛选
        if (minCost !== null || maxCost !== null) {
            let priceText = this.manager.currentMode === 'items' ? '价格: ' : '成本: ';
            if (minCost !== null && maxCost !== null) {
                priceText += `${minCost} - ${maxCost}`;
            } else if (minCost !== null) {
                priceText += `≥ ${minCost}`;
            } else {
                priceText += `≤ ${maxCost}`;
            }
            
            const bubble = this.createFilterBubble(priceText, 'price');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 重量筛选（仅物品模式）
        if ((minWeight !== null || maxWeight !== null) && this.manager.currentMode === 'items') {
            let weightText = '重量: ';
            if (minWeight !== null && maxWeight !== null) {
                weightText += `${minWeight} - ${maxWeight}`;
            } else if (minWeight !== null) {
                weightText += `≥ ${minWeight}`;
            } else {
                weightText += `≤ ${maxWeight}`;
            }
            
            const bubble = this.createFilterBubble(weightText, 'weight');
            bubblesContainer.appendChild(bubble);
            hasActiveFilters = true;
        }
        
        // 标签筛选
        const allSelectedTags = [
            ...Array.from(this.selectedTags).map(t => `标签: ${t}`),
            ...Array.from(this.selectedRarity).map(t => `稀有度: ${t}`),
            ...Array.from(this.selectedSkill).map(t => `技能: ${t}`),
            ...Array.from(this.selectedNeed).map(t => `需求: ${t}`)
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
                this.clearAllFilters();
                this.applyFilter();
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
            this.applyFilter();
        });
        
        return bubble;
    }
    
    // 移除特定筛选
    removeFilter(filterType) {
        switch(filterType) {
            case 'main-type':
                const mainTypeFilter = document.getElementById('main-type-filter');
                if (mainTypeFilter) {
                    mainTypeFilter.value = '';
                    if (this.manager.updateSubTypeFilter) {
                        this.manager.updateSubTypeFilter('');
                    }
                }
                break;
            case 'sub-type':
                const subTypeFilter = document.getElementById('sub-type-filter');
                if (subTypeFilter) {
                    subTypeFilter.value = '';
                }
                break;
            case 'level':
                const minLevel = document.getElementById('min-level');
                const maxLevel = document.getElementById('max-level');
                if (minLevel) minLevel.value = '';
                if (maxLevel) maxLevel.value = '';
                break;
            case 'name':
                const globalSearch = document.getElementById('global-search');
                if (globalSearch) globalSearch.value = '';
                break;
            case 'price':
                const minCost = document.getElementById('min-cost');
                const maxCost = document.getElementById('max-cost');
                if (minCost) minCost.value = '';
                if (maxCost) maxCost.value = '';
                break;
            case 'weight':
                const minWeight = document.getElementById('min-weight');
                const maxWeight = document.getElementById('max-weight');
                if (minWeight) minWeight.value = '';
                if (maxWeight) maxWeight.value = '';
                break;
            case 'tags':
                // 移除所有标签筛选
                this.selectedTags.clear();
                this.selectedRarity.clear();
                this.selectedSkill.clear();
                this.selectedNeed.clear();
                this.renderTagFilter();
                break;
        }
    }
}