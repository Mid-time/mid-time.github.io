// ================================
// 统一应用入口 - 初始化各模块并连接（防重复声明）
// ================================
if (typeof UnifiedCalculatorApp === 'undefined') {
    class UnifiedCalculatorApp {
        constructor() {
            // 创建数据管理器
            this.dataManager = new (window.UnifiedDataManager || UnifiedDataManager)();

            // 筛选���统
            this.filterSystem = new (window.UnifiedFilterSystem || UnifiedFilterSystem)();

            // 管理器（item & specialty）
            this.itemManager = new (window.UnifiedManager || UnifiedManager)(this.dataManager, 'items');
            this.specialtyManager = new (window.UnifiedManager || UnifiedManager)(this.dataManager, 'specialties');

            this.itemManager.setFilterSystem(this.filterSystem);
            this.specialtyManager.setFilterSystem(this.filterSystem);

            // 计算器模块
            this.calculatorModule = new (window.UnifiedCalculator || UnifiedCalculator)(this.itemManager, this.specialtyManager);

            this.currentView = 'items-view';

            this.initializeEventListeners();
            this.initializeApp();
        }

        async initializeApp() {
            try {
                this.showDataStatus('🔄 正在加载数据...', 'loading');
                await Promise.all([ this.itemManager.loadData(), this.specialtyManager.loadData() ]);
                this.showDataStatus('✅ 数据加载完成', 'success');

                // 初始化筛选气泡显示
                this.filterSystem.setMode('items');
                this.filterSystem.updateFilterBubbles && this.filterSystem.updateFilterBubbles();

                // 初始显示
                this.itemManager.renderFilterResults('item-list', 'results-count');
                this.switchView('items-view');
            } catch (err) {
                console.error('应用初始化失败:', err);
                this.showDataStatus('❌ 应用初始化失败: ' + (err.message || err), 'error');
            }
        }

        switchView(viewId) {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            const v = document.getElementById(viewId);
            if (!v) return;
            v.classList.add('active');
            this.currentView = viewId;

            // nav active
            document.querySelectorAll('.nav-item').forEach(n => {
                n.classList.toggle('active', n.dataset.view === viewId);
            });

            const mode = viewId === 'items-view' ? 'items' : (viewId === 'specialties-view' ? 'specialties' : null);
            if (mode) {
                this.filterSystem.setMode(mode);
                this.filterSystem.updateFilterBubbles && this.filterSystem.updateFilterBubbles();
            }

            if (viewId === 'items-view') {
                this.itemManager.applyFilterAndSort();
                this.itemManager.renderFilterResults('item-list', 'results-count');
            } else if (viewId === 'specialties-view') {
                this.specialtyManager.applyFilterAndSort();
                this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
            } else if (viewId === 'calculator-view') {
                this.calculatorModule.renderCalculator();
            }
        }

        showDataStatus(message, type) {
            const el = document.getElementById('data-status');
            if (!el) return;
            el.textContent = message; el.className = 'data-status';
            if (type === 'success') el.classList.add('success');
            if (type === 'error') el.classList.add('error');
            if (type === 'warning') el.classList.add('warning');
            if (type === 'loading') el.classList.add('loading');
            if (type !== 'loading') {
                setTimeout(() => { if (el.textContent === message) { el.textContent = ''; el.className = 'data-status'; } }, 3000);
            }
        }

        initializeEventListeners() {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const viewId = item.dataset.view;
                    this.switchView(viewId);
                });
            });

            // 简化：filter 变化通过 filter-system 的事件与 manager 的渲染协作
            document.addEventListener('filterChange', (e) => {
                const mode = e.detail && e.detail.mode ? e.detail.mode : this.filterSystem.currentMode;
                if (mode === 'items') {
                    this.itemManager.applyFilterAndSort();
                    this.itemManager.renderFilterResults('item-list', 'results-count');
                } else if (mode === 'specialties') {
                    this.specialtyManager.applyFilterAndSort();
                    this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count');
                }
            });

            // 分页与每页数等（直接绑定到 manager）
            const prevPage = document.getElementById('prev-page');
            const nextPage = document.getElementById('next-page');
            const specialtyPrev = document.getElementById('specialty-prev-page');
            const specialtyNext = document.getElementById('specialty-next-page');

            if (prevPage) prevPage.addEventListener('click', () => { this.itemManager.currentPage = Math.max(1, this.itemManager.currentPage - 1); this.itemManager.renderFilterResults('item-list', 'results-count'); });
            if (nextPage) nextPage.addEventListener('click', () => { this.itemManager.currentPage++; this.itemManager.renderFilterResults('item-list', 'results-count'); });
            if (specialtyPrev) specialtyPrev.addEventListener('click', () => { this.specialtyManager.currentPage = Math.max(1, this.specialtyManager.currentPage - 1); this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count'); });
            if (specialtyNext) specialtyNext.addEventListener('click', () => { this.specialtyManager.currentPage++; this.specialtyManager.renderFilterResults('specialty-list', 'specialty-results-count'); });

            // 搜索输入（简化实时搜索）
            const globalSearch = document.getElementById('global-search');
            if (globalSearch) {
                let t;
                globalSearch.addEventListener('input', (e) => {
                    clearTimeout(t);
                    t = setTimeout(() => {
                        this.filterSystem.itemFilters.nameFilter = e.target.value;
                        this.filterSystem.triggerFilterChange && this.filterSystem.triggerFilterChange();
                    }, 300);
                });
            }

            const specialtySearch = document.getElementById('specialty-search');
            if (specialtySearch) {
                let t;
                specialtySearch.addEventListener('input', (e) => {
                    clearTimeout(t);
                    t = setTimeout(() => {
                        this.filterSystem.specialtyFilters.nameFilter = e.target.value;
                        this.filterSystem.triggerFilterChange && this.filterSystem.triggerFilterChange();
                    }, 300);
                });
            }

            // 绑定筛选弹窗打开按钮（调用 filter-system 的 modal 操作）
            const filterToggle = document.getElementById('filter-toggle');
            const specialtyFilterToggle = document.getElementById('specialty-filter-toggle');
            if (filterToggle) filterToggle.addEventListener('click', () => { this.filterSystem.setMode('items'); const modal = document.getElementById('filter-modal'); if (modal) modal.style.display = 'flex'; });
            if (specialtyFilterToggle) specialtyFilterToggle.addEventListener('click', () => { this.filterSystem.setMode('specialties'); const modal = document.getElementById('filter-modal'); if (modal) modal.style.display = 'flex'; });

            // 关闭弹窗处理
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-filter-btn') || e.target.id === 'filter-modal') {
                    const modal = document.getElementById('filter-modal');
                    if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
                }
                if (e.target.classList.contains('close-detail-btn') || e.target.id === 'detail-modal') {
                    const modal = document.getElementById('detail-modal');
                    if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
                }
            });

            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const fm = document.getElementById('filter-modal'); if (fm) fm.style.display = 'none'; const cm = document.getElementById('character-modal'); if (cm) cm.style.display = 'none'; } });
        }
    }

    window.UnifiedCalculatorApp = UnifiedCalculatorApp;

    // 自动初始化
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.unifiedApp) window.unifiedApp = new UnifiedCalculatorApp();
    });
}
