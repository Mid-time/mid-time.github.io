// ================================
// 统一应用类 - 新界面布局
// ================================
class UnifiedCalculatorApp {
    constructor() {
        // 初始化数据管理器
        this.dataManager = new UnifiedDataManager();
        
        // 初始化筛选系统
        this.filterSystem = new UnifiedFilterSystem();
        
        // 初始化物品管理器
        this.itemManager = new UnifiedManager(this.dataManager, 'items');
        this.itemManager.setFilterSystem(this.filterSystem);
        
        // 初始化技艺管理器
        this.specialtyManager = new UnifiedManager(this.dataManager, 'specialties');
        this.specialtyManager.setFilterSystem(this.filterSystem);
        
        // 初始化计算器模块
        this.calculatorModule = new UnifiedCalculator(this.itemManager, this.specialtyManager);
        
        // 当前视图
        this.currentView = 'items-view';
        
        this.initializeEventListeners();
        this.initializeApp();
    }
    
    // 初始化应用
    async initializeApp() {
        try {
            this.showDataStatus('🔄 正在加载数据...', 'loading');
            
            // 并行加载物品和技艺数据
            await Promise.all([
                this.itemManager.loadData(),
                this.specialtyManager.loadData()
            ]);
            
            this.showDataStatus('✅ 数据加载完成', 'success');
            
            // 更新筛选泡泡
            this.filterSystem.updateFilterBubbles();
            
            // 初始显示物品列表
            this.itemManager.renderFilterResults('item-list', 'results-count');
            
            // 切换到物品视图
            this.switchView('items-view');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showDataStatus('❌ 应用初始化失败: ' + error.message, 'error');
        }
    }
    
    // 切换视图
    switchView(viewId) {
        // 隐藏所有视图
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // 显示当前视图
        const currentView = document.getElementById(viewId);
        if (currentView) {
            currentView.classList.add('active');
            this.currentView = viewId;
            
            // 更新导航栏
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.view === viewId) {
                    item.classList.add('active');
                }
            });
            
            // 设置筛选系统模式
            const mode = viewId === 'items-view' ? 'items' : 
                        viewId === 'specialties-view' ? 'specialties' : null;
            
            if (mode) {
                this.filterSystem.setMode(mode);
                this.filterSystem.updateFilterBubbles();
            }
            
            // 根据视图执行特定操作
            switch(viewId) {
                case 'items-view':
                    this.itemManager.applyFilterAndSort();
                    this.itemManager.renderFilterResults('item-list', 'results-count');
                    break;
                case 'specialties-view':
                    this.specialtyManager.applyFilterAndSort();
                    this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
                    break;
                case 'calculator-view':
                    this.calculatorModule.renderCalculator();
                    // 切换到计算器视图时重新绑定折叠栏事件
                    this.calculatorModule.initializeAccordionEvents();
                    break;
            }
        }
    }
    
    // 显示数据状态
    showDataStatus(message, type) {
        const statusElement = document.getElementById('data-status');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = 'data-status';
        
        if (type === 'success' || type === 'healthy') {
            statusElement.classList.add('success');
        } else if (type === 'error') {
            statusElement.classList.add('error');
        } else if (type === 'warning') {
            statusElement.classList.add('warning');
        } else if (type === 'loading') {
            statusElement.classList.add('loading');
        }
        
        // 3秒后自动清除
        if (type !== 'loading') {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.className = 'data-status';
                    statusElement.textContent = '';
                }
            }, 3000);
        }
    }
    
    // 初始化事件监听器
    initializeEventListeners() {
        // 导航栏点击事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = e.currentTarget.dataset.view;
                this.switchView(viewId);
            });
        });
        
        // 监听筛选变化事件
        document.addEventListener('filterChange', (e) => {
            const mode = e.detail.mode;
            if (mode === 'items') {
                this.itemManager.applyFilterAndSort();
                this.itemManager.renderFilterResults('item-list', 'results-count');
            } else if (mode === 'specialties') {
                this.specialtyManager.applyFilterAndSort();
                this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
            }
        });
        
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
        
        // 筛选弹窗关闭事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-filter-btn') || e.target.id === 'filter-modal') {
                this.hideFilterModal();
            }
        });
        
        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideFilterModal();
            }
        });
        
        // 分页按钮
        const prevPage = document.getElementById('prev-page');
        const nextPage = document.getElementById('next-page');
        const specialtyPrevPage = document.getElementById('specialty-prev-page');
        const specialtyNextPage = document.getElementById('specialty-next-page');
        
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                this.itemManager.currentPage--;
                this.itemManager.renderFilterResults('item-list', 'results-count');
            });
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                this.itemManager.currentPage++;
                this.itemManager.renderFilterResults('item-list', 'results-count');
            });
        }
        
        if (specialtyPrevPage) {
            specialtyPrevPage.addEventListener('click', () => {
                this.specialtyManager.currentPage--;
                this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
            });
        }
        
        if (specialtyNextPage) {
            specialtyNextPage.addEventListener('click', () => {
                this.specialtyManager.currentPage++;
                this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
            });
        }
        
        // 每页显示数量变化
        const itemsPerPage = document.getElementById('items-per-page');
        const specialtyItemsPerPage = document.getElementById('specialty-items-per-page');
        
        if (itemsPerPage) {
            itemsPerPage.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 5 && value <= 100) {
                    this.itemManager.itemsPerPage = value;
                    this.itemManager.currentPage = 1;
                    this.itemManager.renderFilterResults('item-list', 'results-count');
                }
            });
        }
        
        if (specialtyItemsPerPage) {
            specialtyItemsPerPage.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 5 && value <= 100) {
                    this.specialtyManager.itemsPerPage = value;
                    this.specialtyManager.currentPage = 1;
                    this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
                }
            });
        }
        
        // 添加实时筛选事件监听
        this.initializeRealTimeFilterEvents();
    }
    
    // 初始化实时筛选事件
    initializeRealTimeFilterEvents() {
        // 监听数值输入框的变化
        const numericInputIds = ['min-level', 'max-level', 'min-cost', 'max-cost', 'min-weight', 'max-weight'];
        
        numericInputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                let timeout;
                input.addEventListener('input', (e) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        // 检查筛选弹窗是否打开
                        const modal = document.getElementById('filter-modal');
                        if (modal && modal.style.display === 'flex') {
                            this.applyRealTimeFilters();
                        }
                    }, 300);
                });
            }
        });
        
        // 监听类型选择变化
        const mainTypeFilter = document.getElementById('main-type-filter');
        const subTypeFilter = document.getElementById('sub-type-filter');
        
        if (mainTypeFilter) {
            mainTypeFilter.addEventListener('change', () => {
                const modal = document.getElementById('filter-modal');
                if (modal && modal.style.display === 'flex') {
                    this.applyRealTimeFilters();
                    
                    // 更新子类型筛选器
                    const mainType = mainTypeFilter.value;
                    if (mainType) {
                        const manager = this.filterSystem.currentMode === 'items' ? this.itemManager : this.specialtyManager;
                        this.updateSubTypeFilter(manager, mainType);
                        subTypeFilter.style.display = 'block';
                    } else {
                        subTypeFilter.style.display = 'none';
                        subTypeFilter.value = '';
                    }
                }
            });
        }
        
        if (subTypeFilter) {
            subTypeFilter.addEventListener('change', () => {
                const modal = document.getElementById('filter-modal');
                if (modal && modal.style.display === 'flex') {
                    this.applyRealTimeFilters();
                }
            });
        }
        
        // 监听排序变化
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', () => {
                const modal = document.getElementById('filter-modal');
                if (modal && modal.style.display === 'flex') {
                    this.applyRealTimeFilters();
                }
            });
        }
    }
    
    // 应用实时筛选
    applyRealTimeFilters() {
        // 收集筛选值
        this.filterSystem.collectFilterValuesFromModal();
        
        // 更新筛选泡泡
        this.filterSystem.updateFilterBubbles();
        
        // 触发筛选变化
        this.filterSystem.triggerFilterChange();
        
        // 更新标签筛选器（动态隐藏不可用标签）
        this.updateTagFilterForCurrentConditions();
    }
    
    // 更新标签筛选器（根据当前筛选条件动态隐藏不可用标签）
    updateTagFilterForCurrentConditions() {
        const mode = this.filterSystem.currentMode;
        const manager = mode === 'items' ? this.itemManager : this.specialtyManager;
        
        if (!manager || !manager.currentData) return;
        
        // 获取当前筛选条件下的数据和可用标签
        const result = this.filterSystem.applyFiltersToData(manager.currentData, mode, true);
        const { availableTags } = result;
        
        // 获取当前选中的标签
        const filters = this.filterSystem.getCurrentFilters();
        
        // 更新标签筛选器显示
        this.updateTagFilterDisplayInModal(availableTags, filters);
    }
    
    // 更新标签筛选器显示
    updateTagFilterDisplayInModal(availableTags, currentFilters) {
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
            const tagOptions = section.querySelectorAll('.tag-option');
            const visibleOptions = Array.from(tagOptions).filter(opt => opt.style.display !== 'none');
            
            if (visibleOptions.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        });
    }
    
    // 显示筛选弹窗
    showFilterModal(mode) {
        const modal = document.getElementById('filter-modal');
        if (!modal) return;
        
        // 设置模式
        this.filterSystem.currentMode = mode;
        
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
        const levelFilter = document.getElementById('level-filter');
        const weightFilter = document.getElementById('weight-filter');
        
        if (levelFilter) {
            levelFilter.style.display = mode === 'specialties' ? 'block' : 'none';
        }
        if (weightFilter) {
            weightFilter.style.display = mode === 'items' ? 'block' : 'none';
        }
        
        // 初始化弹窗内容
        this.initializeFilterModal(mode);
        
        // 显示弹窗
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // 初始化实时筛选
        this.initializeRealTimeFilterInModal();
    }
    
    // 初始化实时筛选
    initializeRealTimeFilterInModal() {
        // 为标签添加点击事件，实时更新筛选
        const tagOptions = document.querySelectorAll('.tag-option');
        tagOptions.forEach(option => {
            // 移除之前的事件监听器，防止重复绑定
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            newOption.addEventListener('click', () => {
                newOption.classList.toggle('selected');
                // 实时应用筛选
                setTimeout(() => {
                    this.applyRealTimeFilters();
                }, 50);
            });
        });
    }
    
    // 隐藏筛选弹窗
    hideFilterModal() {
        const modal = document.getElementById('filter-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // 初始化筛选弹窗
    initializeFilterModal(mode) {
        // 获取数据管理器
        const manager = mode === 'items' ? this.itemManager : this.specialtyManager;
        const filters = mode === 'items' ? this.filterSystem.itemFilters : this.filterSystem.specialtyFilters;
        
        // 初始化主类型筛选器
        this.initializeMainTypeFilter(manager, mode);
        
        // 设置当前筛选值
        this.setFilterValuesInModal(filters, mode);
        
        // 初始化标签筛选器（根据当前筛选条件动态显示可用标签）
        this.renderTagFilterWithDynamicVisibility(manager, filters, mode);
    }
    
    // 初始化主类型筛选器
    initializeMainTypeFilter(manager, mode) {
        const mainTypeSelector = document.getElementById('main-type-filter');
        const subTypeSelector = document.getElementById('sub-type-filter');
        
        if (!mainTypeSelector || !subTypeSelector) return;
        
        // 清空选项
        mainTypeSelector.innerHTML = '<option value="">所有主类型</option>';
        subTypeSelector.innerHTML = '<option value="">所有子类型</option>';
        
        // 获取类型映射
        const typeMapping = this.getTypeMapping(manager);
        
        // 添加主类型选项
        typeMapping.mainTypes.forEach(mainType => {
            const option = document.createElement('option');
            option.value = mainType;
            option.textContent = mainType;
            mainTypeSelector.appendChild(option);
        });
        
        // 设置当前值
        const filters = mode === 'items' ? this.filterSystem.itemFilters : this.filterSystem.specialtyFilters;
        mainTypeSelector.value = filters.mainTypeFilter || '';
        
        // 如果有主类型筛选，更新子类型筛选器
        if (filters.mainTypeFilter) {
            this.updateSubTypeFilter(manager, filters.mainTypeFilter);
            subTypeSelector.value = filters.subTypeFilter || '';
            subTypeSelector.style.display = 'block';
        } else {
            subTypeSelector.style.display = 'none';
        }
        
        // 添加主类型变化事件
        mainTypeSelector.onchange = (e) => {
            const mainType = e.target.value;
            if (mainType) {
                this.updateSubTypeFilter(manager, mainType);
                subTypeSelector.style.display = 'block';
            } else {
                subTypeSelector.style.display = 'none';
                subTypeSelector.value = '';
            }
            
            // 实时应用筛选
            this.applyRealTimeFilters();
        };
        
        // 子类型变化事件
        subTypeSelector.onchange = () => {
            // 实时应用筛选
            this.applyRealTimeFilters();
        };
    }
    
    // 获取类型映射
    getTypeMapping(manager) {
        const mainTypes = new Set();
        const subTypesByMainType = new Map();
        
        manager.currentData.forEach(item => {
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
    
    // 更新子类型筛选器
    updateSubTypeFilter(manager, mainType) {
        const subTypeSelector = document.getElementById('sub-type-filter');
        if (!subTypeSelector) return;
        
        subTypeSelector.innerHTML = '<option value="">所有子类型</option>';
        
        if (mainType) {
            const typeMapping = this.getTypeMapping(manager);
            const subTypes = typeMapping.subTypesByMainType.get(mainType);
            
            if (subTypes && subTypes.size > 0) {
                Array.from(subTypes).sort().forEach(subType => {
                    const option = document.createElement('option');
                    option.value = subType;
                    option.textContent = subType;
                    subTypeSelector.appendChild(option);
                });
            }
        }
    }
    
    // 设置筛选弹窗中的值
    setFilterValuesInModal(filters, mode) {
        // 数值输入框
        const numericFields = [
            { id: 'min-level', value: filters.minLevel },
            { id: 'max-level', value: filters.maxLevel },
            { id: 'min-cost', value: filters.minCost },
            { id: 'max-cost', value: filters.maxCost },
            { id: 'min-weight', value: filters.minWeight },
            { id: 'max-weight', value: filters.maxWeight }
        ];
        
        numericFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element && field.value !== null) {
                element.value = field.value;
            }
        });
        
        // 排序
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.value = filters.sortBy || 'id-asc';
        }
        
        // 更新排序选项
        this.updateSortOptions(mode);
    }
    
    // 更新排序选项
    updateSortOptions(mode) {
        const sortSelect = document.getElementById('sort-by');
        if (!sortSelect) return;
        
        const currentValue = sortSelect.value;
        
        // 清空选项
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
            sortSelect.appendChild(optionElement);
        });
        
        // 恢复当前值
        sortSelect.value = currentValue;
    }
    
    // 渲染标签筛选器（带动态可见性）
    renderTagFilterWithDynamicVisibility(manager, filters, mode) {
        const container = document.getElementById('tag-filter-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 获取当前数据
        const currentData = manager.currentData || [];
        
        if (currentData.length === 0) {
            container.innerHTML = '<div class="empty-state">无可用标签</div>';
            return;
        }
        
        // 获取当前筛选条件下的可用标签
        let availableTags = {
            tags: new Set(),
            rarity: new Set(),
            skill: new Set(),
            need: new Set()
        };
        
        // 如果已经有筛选条件，计算在当前条件下的可用标签
        if (this.hasActiveFilters(filters)) {
            const result = this.filterSystem.applyFiltersToData(currentData, mode, true);
            availableTags = result.availableTags;
        } else {
            // 如果没有筛选条件，使用所有可用标签
            availableTags = this.getAllAvailableTags(currentData, mode);
        }
        
        // 创建标签分类
        const categories = [];
        
        if (mode === 'items') {
            categories.push(
                {
                    title: '标签筛选',
                    key: 'tags',
                    values: availableTags.tags,
                    selected: filters.selectedTags
                },
                {
                    title: '稀有度',
                    key: 'rarity',
                    values: availableTags.rarity,
                    selected: filters.selectedRarity
                },
                {
                    title: '技能需求',
                    key: 'skill',
                    values: availableTags.skill,
                    selected: filters.selectedSkill
                },
                {
                    title: '装备需求',
                    key: 'need',
                    values: availableTags.need,
                    selected: filters.selectedNeed
                }
            );
        } else {
            categories.push(
                {
                    title: '标签筛选',
                    key: 'tags',
                    values: availableTags.tags,
                    selected: filters.selectedTags
                },
                {
                    title: '稀有度',
                    key: 'rarity',
                    values: availableTags.rarity,
                    selected: filters.selectedRarity
                },
                {
                    title: '装备需求',
                    key: 'need',
                    values: availableTags.need,
                    selected: filters.selectedNeed
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
                    tagElement.classList.toggle('selected');
                    // 实时应用筛选
                    setTimeout(() => {
                        this.applyRealTimeFilters();
                    }, 50);
                });
                
                contentElement.appendChild(tagElement);
            });
            
            categoryElement.appendChild(titleElement);
            categoryElement.appendChild(contentElement);
            container.appendChild(categoryElement);
        });
    }
    
    // 检查是否有活动的筛选条件
    hasActiveFilters(filters) {
        return filters.mainTypeFilter || filters.subTypeFilter ||
               filters.minLevel !== null || filters.maxLevel !== null ||
               filters.minCost !== null || filters.maxCost !== null ||
               filters.minWeight !== null || filters.maxWeight !== null ||
               filters.selectedTags.size > 0 || filters.selectedRarity.size > 0 ||
               filters.selectedSkill.size > 0 || filters.selectedNeed.size > 0;
    }
    
    // 获取所有可用标签
    getAllAvailableTags(data, mode) {
        const availableTags = {
            tags: new Set(),
            rarity: new Set(),
            skill: new Set(),
            need: new Set()
        };
        
        data.forEach(item => {
            // 收集标签
            const tags = item.tags || item.tag || [];
            if (Array.isArray(tags)) {
                tags.forEach(tag => {
                    if (tag && tag !== '') availableTags.tags.add(tag);
                });
            }
            
            // 收集稀有度
            if (item.rarity && item.rarity !== '') {
                availableTags.rarity.add(item.rarity);
            }
            
            // 收集技能需求（仅物品模式）
            if (mode === 'items' && item.skill && item.skill !== '' && item.skill !== '无') {
                availableTags.skill.add(item.skill);
            }
            
            // 收集需求
            if (item.need && Array.isArray(item.need)) {
                item.need.forEach(need => {
                    if (need && need !== '') availableTags.need.add(need);
                });
            }
        });
        
        return availableTags;
    }
}

// 初始化应用
let unifiedApp;
document.addEventListener('DOMContentLoaded', () => {
    unifiedApp = new UnifiedCalculatorApp();
});