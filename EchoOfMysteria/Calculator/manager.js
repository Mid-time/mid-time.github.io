// ================================
// 统一管理器 - 负责数据管理、筛选与与计算器交互（防重复声明）
// ================================
if (typeof UnifiedManager === 'undefined') {
    class UnifiedManager {
        constructor(dataManager, mode = 'items') {
            this.dataManager = dataManager;
            this.currentMode = mode; // 'items' 或 'specialties'
            this.currentData = [];
            this.filteredData = [];
            this.currentPage = 1;
            this.itemsPerPage = 20;

            // 筛选状态（由 UnifiedFilterSystem 管理并注入）
            this.filterSystem = null;

            // 计算器模块引用（由 app 初始化后注入）
            this.calculatorModule = null;

            // 技艺等级选择（仅 specialties）
            this.specialtyLevels = new Map();
        }

        setFilterSystem(filterSystem) {
            this.filterSystem = filterSystem;
        }

        setCalculatorModule(calculatorModule) {
            this.calculatorModule = calculatorModule;
        }

        async loadData() {
            if (this.currentMode === 'items') {
                this.currentData = await this.dataManager.loadItems();
            } else {
                this.currentData = await this.dataManager.loadSpecialties();
                this.currentData.forEach(s => this.specialtyLevels.set(s.id, 1));
            }
            this.applyFilterAndSort();
            return true;
        }

        applyFilterAndSort() {
            if (!this.filterSystem) {
                this.filteredData = [...this.currentData];
            } else {
                this.filterSystem.setMode(this.currentMode);
                this.filteredData = this.filterSystem.applyFiltersToData(this.currentData, this.currentMode);
                this.filteredData = this.filterSystem.sortData(this.filteredData, this.currentMode);
            }
            this.currentPage = 1;
        }

        // 渲染结果列表（item-list / specialty-list）
        renderFilterResults(listId = 'item-list', countId = 'results-count') {
            const container = document.getElementById(listId);
            const resultsCount = document.getElementById(countId);
            const pagination = document.getElementById(listId.includes('specialty') ? 'specialty-pagination' : 'pagination');
            if (!container) return;

            container.innerHTML = '';
            if (!this.filteredData || this.filteredData.length === 0) {
                container.innerHTML = `<div class="empty-state">没有找到匹配的${this.currentMode === 'items' ? '物品' : '技艺'}</div>`;
                if (pagination) pagination.style.display = 'none';
                if (resultsCount) resultsCount.textContent = '0 个项目';
                return;
            }

            const totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.itemsPerPage));
            if (this.currentPage > totalPages) this.currentPage = totalPages;
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const pageItems = this.filteredData.slice(start, start + this.itemsPerPage);

            pageItems.forEach(item => {
                const el = document.createElement('div');
                el.className = 'compact-item';
                el.dataset.id = item.id;
                this.renderCompactItem(el, item);
                container.appendChild(el);
            });

            if (resultsCount) resultsCount.textContent = `${this.filteredData.length} 个项目`;

            // 分页显示
            if (pagination) {
                pagination.style.display = 'flex';
                const pageInfo = document.getElementById(listId.includes('specialty') ? 'specialty-page-info' : 'page-info');
                if (pageInfo) pageInfo.textContent = `第 ${this.currentPage} 页，共 ${totalPages} 页`;
                const prev = document.getElementById(listId.includes('specialty') ? 'specialty-prev-page' : 'prev-page');
                const next = document.getElementById(listId.includes('specialty') ? 'specialty-next-page' : 'next-page');
                if (prev) prev.disabled = this.currentPage <= 1;
                if (next) next.disabled = this.currentPage >= totalPages;
            }
        }

        // 渲染紧凑条目：包含添加/数量调节或等级选择（技艺）
        renderCompactItem(container, item) {
            const tags = item.tags || item.tag || [];
            const displayTags = tags.slice(0, 3);
            let costText = '';

            if (this.currentMode === 'items') {
                costText = this.formatCurrency(item.cost || 0);
            } else {
                const lvl = this.specialtyLevels.get(item.id) || 1;
                if (Array.isArray(item.cost)) {
                    costText = `成本: ${item.cost[lvl - 1] !== undefined ? item.cost[lvl - 1] : item.cost.join('/')}`;
                } else {
                    costText = `成本: ${item.cost || 0}`;
                }
            }

            // 是否在计算器中
            const inCalc = this.calculatorModule ? this.calculatorModule.isInCalculator(item.id, this.currentMode) : false;
            const calcQty = this.calculatorModule ? this.calculatorModule.getCalculatorQuantity(item.id, this.currentMode) : 0;

            let actionHtml = '';
            if (this.currentMode === 'items') {
                if (inCalc && calcQty > 0) {
                    actionHtml = `
                        <div class="quantity-adjuster">
                            <button class="btn-danger decrease-btn" data-id="${item.id}" data-mode="items">-</button>
                            <input type="number" class="quantity-input" value="${calcQty}" min="0" data-id="${item.id}" data-mode="items">
                            <button class="btn-success increase-btn" data-id="${item.id}" data-mode="items">+</button>
                        </div>
                    `;
                } else {
                    actionHtml = `<button class="btn-success compact-add-btn" data-id="${item.id}" data-mode="items">添加</button>`;
                }
            } else {
                // specialties: 添加为等级选择之前
                if (inCalc) {
                    actionHtml = `<button class="btn-danger compact-remove-btn" data-id="${item.id}" data-mode="specialties">移除</button>`;
                } else {
                    actionHtml = `<button class="btn-success compact-add-btn" data-id="${item.id}" data-mode="specialties">添加</button>`;
                }
            }

            container.innerHTML = `
                <div class="compact-item-header">
                    <div class="compact-item-name">${this.escapeHtml(item.name)}</div>
                    <div class="compact-item-tags">
                        ${displayTags.map(t => `<span class="compact-tag">${this.escapeHtml(t)}</span>`).join('')}
                        ${tags.length > 3 ? `<span class="compact-tag">+${tags.length - 3}</span>` : ''}
                    </div>
                </div>
                <div class="compact-item-details">
                    <div class="compact-item-cost">${costText}</div>
                    ${actionHtml}
                </div>
            `;

            // 绑定事件
            const addBtn = container.querySelector('.compact-add-btn');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.addToCalculator(item.id, this.currentMode);
                    // 小延迟后重新渲染当前项以显示数量控件
                    setTimeout(() => this.renderCompactItem(container, item), 120);
                });
            }

            const decrease = container.querySelector('.decrease-btn');
            const increase = container.querySelector('.increase-btn');
            const qtyInput = container.querySelector('.quantity-input');

            if (decrease) {
                decrease.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = e.target.dataset.id;
                    const cur = parseInt(qtyInput.value) || 0;
                    const newQ = Math.max(0, cur - 1);
                    this.calculatorModule.updateQuantity(id, 'items', newQ);
                    setTimeout(() => this.renderCompactItem(container, item), 100);
                });
            }
            if (increase) {
                increase.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = e.target.dataset.id;
                    const cur = parseInt(qtyInput.value) || 0;
                    const newQ = cur + 1;
                    this.calculatorModule.updateQuantity(id, 'items', newQ);
                    setTimeout(() => this.renderCompactItem(container, item), 100);
                });
            }
            if (qtyInput) {
                qtyInput.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const id = e.target.dataset.id;
                    const newQ = parseInt(e.target.value) || 0;
                    this.calculatorModule.updateQuantity(id, 'items', newQ);
                    setTimeout(() => this.renderCompactItem(container, item), 100);
                });
            }

            const removeBtn = container.querySelector('.compact-remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = e.target.dataset.id;
                    this.calculatorModule.removeFromCalculator(id, 'specialties');
                    setTimeout(() => this.renderCompactItem(container, item), 100);
                });
            }
        }

        addToCalculator(itemId, mode) {
            const item = this.currentData.find(i => i.id == itemId);
            if (!item) return;
            let level = 1;
            if (this.currentMode === 'specialties') level = this.specialtyLevels.get(itemId) || 1;
            if (this.calculatorModule) {
                this.calculatorModule.addItem(item, mode || this.currentMode, level);
            }
        }

        // 更新技艺等级（只修改本管理器的状态）
        updateSpecialtyLevel(itemId, newLevel) {
            this.specialtyLevels.set(itemId, newLevel);
            if (this.calculatorModule && this.calculatorModule.isInCalculator(itemId, 'specialties')) {
                this.calculatorModule.updateLevel(itemId, newLevel);
            }
        }

        // 工具方法
        formatCurrency(copper) {
            const gold = Math.floor(copper / 10000);
            const silver = Math.floor((copper % 10000) / 100);
            const copperRemainder = copper % 100;
            const parts = [];
            if (gold > 0) parts.push(`${gold}金币`);
            if (silver > 0) parts.push(`${silver}银币`);
            if (copperRemainder > 0 || parts.length === 0) parts.push(`${copperRemainder}铜币`);
            return parts.join(' ');
        }

        escapeHtml(text) {
            if (!text) return '';
            const d = document.createElement('div');
            d.textContent = text;
            return d.innerHTML;
        }

        formatDescription(text) {
            if (!text) return '';
            return text.replace(/;/g, '<br>').replace(/\{([^}]+)\}/g, '<strong>$1</strong>');
        }

        showStatus(msg, type) {
            const el = document.getElementById('data-status');
            if (!el) return;
            el.textContent = msg;
            el.className = 'data-status';
            if (type === 'success') el.classList.add('success');
            if (type === 'error') el.classList.add('error');
            if (type === 'warning') el.classList.add('warning');
            setTimeout(() => {
                if (el.textContent === msg) { el.textContent = ''; el.className = 'data-status'; }
            }, 3000);
        }
    }

    window.UnifiedManager = UnifiedManager;
}
