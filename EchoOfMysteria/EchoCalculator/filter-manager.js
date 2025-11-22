// ================================
// 统一筛选管理器
// ================================
class UnifiedFilterManager {
    constructor(manager) {
        this.manager = manager;
        this.selectedTags = new Set();
        this.selectedRarity = new Set();
        this.selectedSkill = new Set();
        this.selectedNeed = new Set();
        
        // 防抖定时器
        this.debounceTimer = null;
    }
    
    // 初始化筛选界面
    initializeFilterUI() {
        this.renderTagFilter();
        this.initializeEventListeners();
    }
    
    // 渲染标签筛选器
    renderTagFilter() {
        const container = document.getElementById('tag-filter-container');
        container.innerHTML = '';
        
        // 创建标签分类
        const categories = [];
        
        if (this.manager.currentMode === 'items') {
            categories.push(
                {
                    title: '标签筛选',
                    key: 'tags',
                    values: this.manager.getAllTags(),
                    selected: this.selectedTags
                },
                {
                    title: '稀有度',
                    key: 'rarity',
                    values: this.manager.getAllRarity(),
                    selected: this.selectedRarity
                },
                {
                    title: '技能需求',
                    key: 'skill',
                    values: this.manager.getAllSkill(),
                    selected: this.selectedSkill
                },
                {
                    title: '装备需求',
                    key: 'need',
                    values: this.manager.getAllNeed(),
                    selected: this.selectedNeed
                }
            );
        } else {
            categories.push(
                {
                    title: '标签筛选',
                    key: 'tags',
                    values: this.manager.getAllTags(),
                    selected: this.selectedTags
                },
                {
                    title: '稀有度',
                    key: 'rarity',
                    values: this.manager.getAllRarity(),
                    selected: this.selectedRarity
                },
                {
                    title: '装备需求',
                    key: 'need',
                    values: this.manager.getAllNeed(),
                    selected: this.selectedNeed
                }
            );
        }
        
        // 渲染每个分类
        categories.forEach(category => {
            if (category.values.size === 0) return;
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'filter-category';
            
            const titleElement = document.createElement('div');
            titleElement.className = 'filter-category-title';
            titleElement.textContent = category.title;
            
            const contentElement = document.createElement('div');
            contentElement.className = 'filter-category-content tag-filter';
            
            // 添加标签选项
            Array.from(category.values).sort().forEach(value => {
                if (!value || value === '') return;
                
                // 检查标签是否在当前筛选条件下可用
                if (!this.isTagAvailable(category.key, value)) {
                    return; // 直接跳过，不显示
                }
                
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
                    this.applyFilterDebounced();
                });
                
                contentElement.appendChild(tagElement);
            });
            
            categoryElement.appendChild(titleElement);
            categoryElement.appendChild(contentElement);
            container.appendChild(categoryElement);
        });
    }
    
    // 检查标签是否在当前筛选条件下可用
    isTagAvailable(category, value) {
        // 获取当前类型筛选
        const mainTypeFilter = document.getElementById('main-type-filter').value;
        const subTypeFilter = document.getElementById('sub-type-filter').value;
        
        // 获取当前等级筛选
        const minLevel = document.getElementById('min-level').value ? parseInt(document.getElementById('min-level').value) : null;
        const maxLevel = document.getElementById('max-level').value ? parseInt(document.getElementById('max-level').value) : null;
        
        // 获取当前筛选条件下的数据
        const currentData = this.manager.getFilteredData(
            this.selectedTags,
            this.selectedRarity,
            this.selectedSkill,
            this.selectedNeed,
            mainTypeFilter,
            subTypeFilter,
            minLevel,
            maxLevel
        );
        
        // 检查是否有数据包含此标签
        return currentData.some(item => {
            switch(category) {
                case 'tags': 
                    const tags = item.tags || item.tag || [];
                    return tags.includes(value);
                case 'rarity': return item.rarity === value;
                case 'skill': return item.skill === value;
                case 'need': return item.need && item.need.includes(value);
                default: return false;
            }
        });
    }
    
    // 获取筛选后的数据（用于标签可用性检查）
    getFilteredData(selectedTags, selectedRarity, selectedSkill, selectedNeed, mainTypeFilter, subTypeFilter, minLevel, maxLevel) {
        return this.manager.currentData.filter(item => {
            // 类型筛选
            if (this.manager.currentMode === 'items') {
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
            if (this.manager.currentMode === 'specialties') {
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
            if (this.manager.currentMode === 'items' && selectedSkill.size > 0 && !selectedSkill.has(item.skill)) {
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
    
    // 获取当前筛选条件
    getCurrentFilters() {
        return {
            tags: this.selectedTags,
            rarity: this.selectedRarity,
            skill: this.selectedSkill,
            need: this.selectedNeed
        };
    }
    
    // 清除所有筛选
    clearAllFilters() {
        this.selectedTags.clear();
        this.selectedRarity.clear();
        this.selectedSkill.clear();
        this.selectedNeed.clear();
        
        // 重置UI元素
        document.getElementById('name-filter').value = '';
        document.getElementById('min-cost').value = '';
        document.getElementById('max-cost').value = '';
        document.getElementById('min-weight').value = '';
        document.getElementById('max-weight').value = '';
        document.getElementById('min-level').value = '';
        document.getElementById('max-level').value = '';
        document.getElementById('main-type-filter').value = '';
        document.getElementById('sub-type-filter').style.display = 'none';
        document.getElementById('sub-type-filter').value = '';
        
        // 更新UI
        this.renderTagFilter();
    }
    
    // 初始化事件监听器
    initializeEventListeners() {
        // 名称筛选
        document.getElementById('name-filter').addEventListener('input', () => {
            this.applyFilterDebounced();
        });
        
        // 价格筛选
        document.getElementById('min-cost').addEventListener('input', () => {
            this.applyFilterDebounced();
        });
        
        document.getElementById('max-cost').addEventListener('input', () => {
            this.applyFilterDebounced();
        });
        
        document.getElementById('cost-unit').addEventListener('change', () => {
            this.applyFilterDebounced();
        });
        
        document.getElementById('max-cost-unit').addEventListener('change', () => {
            this.applyFilterDebounced();
        });
        
        // 重量筛选
        document.getElementById('min-weight').addEventListener('input', () => {
            this.applyFilterDebounced();
        });
        
        document.getElementById('max-weight').addEventListener('input', () => {
            this.applyFilterDebounced();
        });
        
        // 等级筛选
        document.getElementById('min-level').addEventListener('input', () => {
            this.applyFilterDebounced();
        });
        
        document.getElementById('max-level').addEventListener('input', () => {
            this.applyFilterDebounced();
        });
        
        // 排序选择
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.manager.setSortBy(e.target.value);
            this.applyFilterDebounced();
        });
        
        // 主类型选择变化
        document.getElementById('main-type-filter').addEventListener('change', (e) => {
            if (this.manager.currentMode === 'items') {
                this.manager.updateSubTypeFilter(e.target.value);
            }
            this.applyFilterDebounced();
        });
        
        // 子类型选择变化
        document.getElementById('sub-type-filter').addEventListener('change', () => {
            this.applyFilterDebounced();
        });
    }
    
    // 防抖应用筛选
    applyFilterDebounced() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.applyFilter();
        }, 300);
    }
    
    // 应用筛选
    applyFilter() {
        // 获取名称和价格筛选条件
        const nameFilter = document.getElementById('name-filter').value.toLowerCase();
        
        // 获取价格筛选（考虑单位转换）
        const minCostValue = document.getElementById('min-cost').value ? parseFloat(document.getElementById('min-cost').value) : null;
        const maxCostValue = document.getElementById('max-cost').value ? parseFloat(document.getElementById('max-cost').value) : null;
        const costUnit = document.getElementById('cost-unit').value;
        const maxCostUnit = document.getElementById('max-cost-unit').value;
        
        const minCost = minCostValue !== null ? this.manager.convertCurrency(minCostValue, costUnit) : null;
        const maxCost = maxCostValue !== null ? this.manager.convertCurrency(maxCostValue, maxCostUnit) : null;
        
        // 获取重量筛选
        const minWeight = document.getElementById('min-weight').value ? parseFloat(document.getElementById('min-weight').value) : null;
        const maxWeight = document.getElementById('max-weight').value ? parseFloat(document.getElementById('max-weight').value) : null;
        
        // 获取等级筛选
        const minLevel = document.getElementById('min-level').value ? parseInt(document.getElementById('min-level').value) : null;
        const maxLevel = document.getElementById('max-level').value ? parseInt(document.getElementById('max-level').value) : null;
        
        const mainTypeFilter = document.getElementById('main-type-filter').value;
        const subTypeFilter = document.getElementById('sub-type-filter').value;
        
        // 更新活动筛选显示
        this.updateActiveFilters(mainTypeFilter, subTypeFilter, nameFilter, minCost, maxCost, minWeight, maxWeight, minLevel, maxLevel);
        
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
        
        // 更新标签可用性
        this.renderTagFilter();
    }
    
    // 更新活动筛选显示
    updateActiveFilters(mainTypeFilter, subTypeFilter, nameFilter, minCost, maxCost, minWeight, maxWeight, minLevel, maxLevel) {
        const activeFiltersContainer = document.getElementById('active-filters');
        const activeFilterTags = document.getElementById('active-filter-tags');
        
        activeFilterTags.innerHTML = '';
        let hasActiveFilters = false;
        
        // 类型筛选
        if (mainTypeFilter) {
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `类型: ${mainTypeFilter} <span class="remove" data-type="main-type">×</span>`;
            activeFilterTags.appendChild(tag);
            hasActiveFilters = true;
        }
        
        if (subTypeFilter && this.manager.currentMode === 'items') {
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `子类型: ${subTypeFilter} <span class="remove" data-type="sub-type">×</span>`;
            activeFilterTags.appendChild(tag);
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
            
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `${levelText} <span class="remove" data-type="level">×</span>`;
            activeFilterTags.appendChild(tag);
            hasActiveFilters = true;
        }
        
        // 名称筛选
        if (nameFilter) {
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `搜索: ${nameFilter} <span class="remove" data-type="name">×</span>`;
            activeFilterTags.appendChild(tag);
            hasActiveFilters = true;
        }
        
        // 价格筛选
        if (minCost !== null || maxCost !== null) {
            let priceText = '价格: ';
            if (minCost !== null && maxCost !== null) {
                priceText += `${this.manager.currentMode === 'items' ? this.manager.formatCurrency(minCost) : minCost} - ${this.manager.currentMode === 'items' ? this.manager.formatCurrency(maxCost) : maxCost}`;
            } else if (minCost !== null) {
                priceText += `≥ ${this.manager.currentMode === 'items' ? this.manager.formatCurrency(minCost) : minCost}`;
            } else {
                priceText += `≤ ${this.manager.currentMode === 'items' ? this.manager.formatCurrency(maxCost) : maxCost}`;
            }
            
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `${priceText} <span class="remove" data-type="price">×</span>`;
            activeFilterTags.appendChild(tag);
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
            
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `${weightText} <span class="remove" data-type="weight">×</span>`;
            activeFilterTags.appendChild(tag);
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
                const tag = document.createElement('span');
                tag.className = 'active-filter-tag';
                tag.innerHTML = `${tagText} <span class="remove" data-type="tags">×</span>`;
                activeFilterTags.appendChild(tag);
            });
            hasActiveFilters = true;
        }
        
        // 显示或隐藏活动筛选区域
        if (hasActiveFilters) {
            activeFiltersContainer.style.display = 'block';
            
            // 添加移除筛选的事件监听
            document.querySelectorAll('.active-filter-tag .remove').forEach(removeBtn => {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const filterType = e.target.getAttribute('data-type');
                    this.removeFilter(filterType);
                });
            });
        } else {
            activeFiltersContainer.style.display = 'none';
        }
    }
    
    // 移除特定筛选
    removeFilter(filterType) {
        switch(filterType) {
            case 'main-type':
                document.getElementById('main-type-filter').value = '';
                if (this.manager.currentMode === 'items') {
                    this.manager.updateSubTypeFilter('');
                }
                break;
            case 'sub-type':
                document.getElementById('sub-type-filter').value = '';
                break;
            case 'level':
                document.getElementById('min-level').value = '';
                document.getElementById('max-level').value = '';
                break;
            case 'name':
                document.getElementById('name-filter').value = '';
                break;
            case 'price':
                document.getElementById('min-cost').value = '';
                document.getElementById('max-cost').value = '';
                break;
            case 'weight':
                document.getElementById('min-weight').value = '';
                document.getElementById('max-weight').value = '';
                break;
            case 'tags':
                this.clearAllFilters();
                break;
        }
        this.applyFilterDebounced();
    }
}