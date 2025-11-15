// ================================
// 模块化设计：筛选管理器
// ================================
class FilterManager {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.selectedTags = new Set();
        this.selectedRarity = new Set();
        this.selectedSkill = new Set();
        this.selectedNeed = new Set();
        this.filterRule = 'AND';
        
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
        const categories = [
            {
                title: '标签筛选',
                key: 'tags',
                values: this.itemManager.getAllTags(),
                selected: this.selectedTags
            },
            {
                title: '稀有度',
                key: 'rarity',
                values: this.itemManager.getAllRarity(),
                selected: this.selectedRarity
            },
            {
                title: '技能需求',
                key: 'skill',
                values: this.itemManager.getAllSkill(),
                selected: this.selectedSkill
            },
            {
                title: '装备需求',
                key: 'need',
                values: this.itemManager.getAllNeed(),
                selected: this.selectedNeed
            }
        ];
        
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
                
                const tagElement = document.createElement('div');
                tagElement.className = 'tag-option';
                tagElement.textContent = value;
                tagElement.dataset.category = category.key;
                tagElement.dataset.value = value;
                
                if (category.selected.has(value)) {
                    tagElement.classList.add('selected');
                }
                
                // 检查标签是否在当前筛选条件下可用
                if (!this.isTagAvailable(category.key, value)) {
                    tagElement.classList.add('disabled');
                }
                
                tagElement.addEventListener('click', () => {
                    if (tagElement.classList.contains('disabled')) return;
                    
                    this.toggleTag(category.key, value);
                    this.applyFilterDebounced();
                });
                
                contentElement.appendChild(tagElement);
            });
            
            categoryElement.appendChild(titleElement);
            categoryElement.appendChild(contentElement);
            container.appendChild(categoryElement);
        });
        
        // 添加筛选规则选择器
        const ruleContainer = document.createElement('div');
        ruleContainer.className = 'filter-rule-selector';
        ruleContainer.innerHTML = `
            <label>
                <input type="radio" name="filter-rule" value="OR" ${this.filterRule === 'OR' ? 'checked' : ''}> 任一标签 (OR)
            </label>
            <label>
                <input type="radio" name="filter-rule" value="AND" ${this.filterRule === 'AND' ? 'checked' : ''}> 所有标签 (AND)
            </label>
        `;
        container.appendChild(ruleContainer);
        
        // 添加筛选规则事件监听
        document.querySelectorAll('input[name="filter-rule"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.filterRule = e.target.value;
                this.applyFilterDebounced();
            });
        });
    }
    
    // 检查标签是否在当前筛选条件下可用
    isTagAvailable(category, value) {
        // 获取当前主类型和子类型筛选
        const mainTypeFilter = document.getElementById('main-type-filter').value;
        const subTypeFilter = document.getElementById('sub-type-filter').value;
        
        // 获取当前筛选条件下的物品
        const currentItems = this.itemManager.getFilteredItems(
            this.selectedTags,
            this.selectedRarity,
            this.selectedSkill,
            this.selectedNeed,
            this.filterRule,
            mainTypeFilter,
            subTypeFilter
        );
        
        // 检查是否有物品包含此标签
        return currentItems.some(item => {
            switch(category) {
                case 'tags': return item.tags && item.tags.includes(value);
                case 'rarity': return item.rarity === value;
                case 'skill': return item.skill === value;
                case 'need': return item.need && item.need.includes(value);
                default: return false;
            }
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
            need: this.selectedNeed,
            rule: this.filterRule
        };
    }
    
    // 清除所有筛选
    clearAllFilters() {
        this.selectedTags.clear();
        this.selectedRarity.clear();
        this.selectedSkill.clear();
        this.selectedNeed.clear();
        this.filterRule = 'AND';
        
        // 重置UI元素
        document.getElementById('name-filter').value = '';
        document.getElementById('min-cost').value = '';
        document.getElementById('max-cost').value = '';
        document.getElementById('min-weight').value = '';
        document.getElementById('max-weight').value = '';
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
        
        // 排序选择
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.itemManager.setSortBy(e.target.value);
            this.applyFilterDebounced();
        });
        
        // 主类型选择变化
        document.getElementById('main-type-filter').addEventListener('change', (e) => {
            this.itemManager.updateSubTypeFilter(e.target.value);
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
        
        const minCost = minCostValue !== null ? this.itemManager.convertCurrency(minCostValue, costUnit) : null;
        const maxCost = maxCostValue !== null ? this.itemManager.convertCurrency(maxCostValue, maxCostUnit) : null;
        
        // 获取重量筛选
        const minWeight = document.getElementById('min-weight').value ? parseFloat(document.getElementById('min-weight').value) : null;
        const maxWeight = document.getElementById('max-weight').value ? parseFloat(document.getElementById('max-weight').value) : null;
        
        const mainTypeFilter = document.getElementById('main-type-filter').value;
        const subTypeFilter = document.getElementById('sub-type-filter').value;
        
        // 更新活动筛选显示
        this.updateActiveFilters(mainTypeFilter, subTypeFilter, nameFilter, minCost, maxCost, minWeight, maxWeight);
        
        // 应用筛选
        this.itemManager.applyFilter(
            this.selectedTags,
            this.selectedRarity,
            this.selectedSkill,
            this.selectedNeed,
            this.filterRule,
            nameFilter,
            minCost,
            maxCost,
            minWeight,
            maxWeight,
            mainTypeFilter,
            subTypeFilter
        );
        
        // 更新标签可用性
        this.renderTagFilter();
    }
    
    // 更新活动筛选显示
    updateActiveFilters(mainTypeFilter, subTypeFilter, nameFilter, minCost, maxCost, minWeight, maxWeight) {
        const activeFiltersContainer = document.getElementById('active-filters');
        const activeFilterTags = document.getElementById('active-filter-tags');
        
        activeFilterTags.innerHTML = '';
        let hasActiveFilters = false;
        
        // 类型筛选
        if (mainTypeFilter) {
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `主类型: ${mainTypeFilter} <span class="remove" data-type="main-type">×</span>`;
            activeFilterTags.appendChild(tag);
            hasActiveFilters = true;
        }
        
        if (subTypeFilter) {
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `子类型: ${subTypeFilter} <span class="remove" data-type="sub-type">×</span>`;
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
                priceText += `${this.itemManager.formatCurrency(minCost)} - ${this.itemManager.formatCurrency(maxCost)}`;
            } else if (minCost !== null) {
                priceText += `≥ ${this.itemManager.formatCurrency(minCost)}`;
            } else {
                priceText += `≤ ${this.itemManager.formatCurrency(maxCost)}`;
            }
            
            const tag = document.createElement('span');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `${priceText} <span class="remove" data-type="price">×</span>`;
            activeFilterTags.appendChild(tag);
            hasActiveFilters = true;
        }
        
        // 重量筛选
        if (minWeight !== null || maxWeight !== null) {
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
                this.itemManager.updateSubTypeFilter('');
                break;
            case 'sub-type':
                document.getElementById('sub-type-filter').value = '';
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