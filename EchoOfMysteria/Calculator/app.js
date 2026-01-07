// ================================
// 统一应用类 - 新界面布局
// ================================
class UnifiedCalculatorApp {
    constructor() {
        // 初始化数据管理器
        this.dataManager = new UnifiedDataManager();
        
        // 初始化物品管理器
        this.itemManager = new UnifiedManager(this.dataManager, 'items');
        
        // 初始化特质管理器
        this.specialtyManager = new UnifiedManager(this.dataManager, 'specialties');
        
        // 初始化筛选管理器
        this.itemFilterManager = new UnifiedFilterManager(this.itemManager);
        this.specialtyFilterManager = new UnifiedFilterManager(this.specialtyManager);
        
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
            
            // 并行加载物品和特质数据
            await Promise.all([
                this.itemManager.loadData(),
                this.specialtyManager.loadData()
            ]);
            
            this.showDataStatus('✅ 数据加载完成', 'healthy');
            
            // 初始化物品筛选UI
            this.itemFilterManager.updateFilterBubbles('items');
            
            // 初始化特质筛选UI
            this.specialtyFilterManager.updateFilterBubbles('specialties');
            
            // 初始加载时应用默认筛选并显示
            this.itemManager.applyFilter({});
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
            
            // 根据视图执行特定操作
            switch(viewId) {
                case 'items-view':
                    if (this.itemManager.filteredData.length === 0) {
                        this.itemManager.applyFilter({});
                    }
                    this.itemManager.renderFilterResults('item-list', 'results-count');
                    break;
                case 'specialties-view':
                    if (this.specialtyManager.filteredData.length === 0) {
                        this.specialtyManager.applyFilter({});
                    }
                    this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
                    break;
                case 'calculator-view':
                    this.calculatorModule.renderCalculator();
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
        
        // 筛选弹窗应用按钮
        const applyFilterBtn = document.getElementById('apply-filter');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', () => {
                if (this.itemFilterManager.currentModalMode === 'items') {
                    this.itemFilterManager.applyFilter();
                } else if (this.specialtyFilterManager.currentModalMode === 'specialties') {
                    this.specialtyFilterManager.applyFilter();
                }
            });
        }
        
        // 筛选弹窗清除按钮
        const clearFilterBtn = document.getElementById('clear-filter');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                if (this.itemFilterManager.currentModalMode === 'items') {
                    this.itemFilterManager.clearFilter();
                } else if (this.specialtyFilterManager.currentModalMode === 'specialties') {
                    this.specialtyFilterManager.clearFilter();
                }
            });
        }
        
        // 主类型筛选器变化时更新子类型筛选器
        const mainTypeFilter = document.getElementById('main-type-filter');
        if (mainTypeFilter) {
            mainTypeFilter.addEventListener('change', (e) => {
                const mode = this.itemFilterManager.currentModalMode || 
                           (this.currentView.includes('items') ? 'items' : 'specialties');
                
                if (mode === 'items') {
                    this.itemManager.updateSubTypeFilter(e.target.value, 'sub-type-filter');
                    this.itemFilterManager.renderTagFilter('items');
                } else if (mode === 'specialties') {
                    this.specialtyManager.updateSubTypeFilter(e.target.value, 'sub-type-filter');
                    this.specialtyFilterManager.renderTagFilter('specialties');
                }
            });
        }
        
        // 子类型筛选器变化时重新渲染标签筛选器
        const subTypeFilter = document.getElementById('sub-type-filter');
        if (subTypeFilter) {
            subTypeFilter.addEventListener('change', () => {
                const mode = this.itemFilterManager.currentModalMode || 
                           (this.currentView.includes('items') ? 'items' : 'specialties');
                
                if (mode === 'items') {
                    this.itemFilterManager.renderTagFilter('items');
                } else if (mode === 'specialties') {
                    this.specialtyFilterManager.renderTagFilter('specialties');
                }
            });
        }
        
        // 分页按钮
        const prevPage = document.getElementById('prev-page');
        const nextPage = document.getElementById('next-page');
        const specialtyPrevPage = document.getElementById('specialty-prev-page');
        const specialtyNextPage = document.getElementById('specialty-next-page');
        
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                this.itemManager.prevPage();
            });
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                this.itemManager.nextPage();
            });
        }
        
        if (specialtyPrevPage) {
            specialtyPrevPage.addEventListener('click', () => {
                this.specialtyManager.prevPage();
            });
        }
        
        if (specialtyNextPage) {
            specialtyNextPage.addEventListener('click', () => {
                this.specialtyManager.nextPage();
            });
        }
        
        // 每页显示数量变化
        const itemsPerPage = document.getElementById('items-per-page');
        const specialtyItemsPerPage = document.getElementById('specialty-items-per-page');
        
        if (itemsPerPage) {
            itemsPerPage.addEventListener('change', (e) => {
                this.itemManager.updateItemsPerPage(e.target.value);
            });
        }
        
        if (specialtyItemsPerPage) {
            specialtyItemsPerPage.addEventListener('change', (e) => {
                this.specialtyManager.updateItemsPerPage(e.target.value);
            });
        }
        
        // 搜索框输入事件
        const globalSearch = document.getElementById('global-search');
        const specialtySearch = document.getElementById('specialty-search');
        
        if (globalSearch) {
            let searchTimeout;
            globalSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.itemManager.nameFilter = e.target.value;
                    this.itemManager.applyFilter({});
                    this.itemManager.renderFilterResults('item-list', 'results-count');
                    this.itemFilterManager.updateFilterBubbles('items');
                }, 300);
            });
        }
        
        if (specialtySearch) {
            let searchTimeout;
            specialtySearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.specialtyManager.nameFilter = e.target.value;
                    this.specialtyManager.applyFilter({});
                    this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
                    this.specialtyFilterManager.updateFilterBubbles('specialties');
                }, 300);
            });
        }
        
        // 键盘快捷键：ESC关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const filterModal = document.getElementById('filter-modal');
                const detailModal = document.getElementById('detail-modal');
                const characterModal = document.getElementById('character-modal');
                
                if (filterModal && filterModal.style.display === 'flex') {
                    filterModal.style.display = 'none';
                }
                
                if (detailModal && detailModal.style.display === 'flex') {
                    detailModal.style.display = 'none';
                }
                
                if (characterModal && characterModal.style.display === 'flex') {
                    characterModal.style.display = 'none';
                }
            }
        });
    }
}

// 初始化应用
let unifiedApp;
document.addEventListener('DOMContentLoaded', () => {
    unifiedApp = new UnifiedCalculatorApp();
});