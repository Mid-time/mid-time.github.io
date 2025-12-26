// ================================
// 统一应用类 - 修复切换模式问题
// ================================
class UnifiedCalculatorApp {
    constructor() {
        // 初始化各个模块
        this.dataManager = new UnifiedDataManager();
        this.manager = new UnifiedManager(this.dataManager);
        this.filterManager = new UnifiedFilterManager(this.manager);
        this.calculatorModule = new UnifiedCalculator(this.manager);
        
        // 将计算器模块暴露给全局
        window.unifiedCalculatorModule = this.calculatorModule;
        
        this.currentMode = 'items';
        
        // 筛选条件状态存储
        this.filterStates = {
            items: {},
            specialties: {}
        };
        
        this.initializeEventListeners();
        this.initializeApp();
    }
    
    // 初始化应用
    async initializeApp() {
        try {
            this.showDataStatus('🔄 正在加载数据...', 'loading');
            
            // 加载初始模式的数据
            await this.manager.loadCurrentData();
            
            this.showDataStatus('✅ 数据加载完成', 'healthy');
            this.filterManager.initializeFilterUI();
            
            // 显示数据来源信息
            this.showDataSourceInfo();
            
            // 初始化类型筛选器
            this.manager.initializeMainTypeFilter();
            
            // 初始化时自动应用筛选，显示所有数据
            this.filterManager.applyFilter();
            
            // 初始化计算器
            this.calculatorModule.renderCalculator();
            
            // 初始化模式切换器滑块
            this.updateModeSwitcherSlider();
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showDataStatus('❌ 应用初始化失败: ' + error.message, 'error');
            this.showRecoveryOptions([error.message]);
        }
    }
    
    // 切换模式
    async switchMode(newMode) {
        if (this.currentMode === newMode) return;
        
        console.log(`切换模式从 ${this.currentMode} 到 ${newMode}`);
        
        // 保存当前模式的筛选状态
        this.saveCurrentFilterState();
        
        this.currentMode = newMode;
        this.manager.setMode(newMode);
        this.calculatorModule.setMode(newMode);
        
        // 清空筛选条件（但保留在状态中）
        this.filterManager.clearAllFilters();
        
        // 更新UI模式显示
        this.updateUIMode();
        
        // 更新模式切换器滑块位置
        this.updateModeSwitcherSlider();
        
        try {
            this.showDataStatus('🔄 正在切换模式...', 'loading');
            
            // 加载新模式的数据
            await this.manager.loadCurrentData();
            
            this.showDataStatus('✅ 模式切换完成', 'healthy');
            
            // 恢复新模式的筛选状态
            this.restoreFilterState(newMode);
            
            // 重新初始化筛选器
            this.filterManager.initializeFilterUI();
            
            // 初始化类型筛选器
            this.manager.initializeMainTypeFilter();
            
            // 应用筛选
            this.filterManager.applyFilter();
            
            // 更新数据来源信息
            this.showDataSourceInfo();
            
        } catch (error) {
            console.error(`切换模式失败:`, error);
            this.showDataStatus('❌ 模式切换失败: ' + error.message, 'error');
        }
    }
    
    // 保存当前筛选状态
    saveCurrentFilterState() {
        const state = {
            selectedTags: Array.from(this.filterManager.selectedTags),
            selectedRarity: Array.from(this.filterManager.selectedRarity),
            selectedSkill: Array.from(this.filterManager.selectedSkill),
            selectedNeed: Array.from(this.filterManager.selectedNeed),
            mainTypeFilter: document.getElementById('main-type-filter')?.value || '',
            subTypeFilter: document.getElementById('sub-type-filter')?.value || '',
            nameFilter: document.getElementById('global-search')?.value || '',
            minCost: document.getElementById('min-cost')?.value || '',
            maxCost: document.getElementById('max-cost')?.value || '',
            minWeight: document.getElementById('min-weight')?.value || '',
            maxWeight: document.getElementById('max-weight')?.value || '',
            minLevel: document.getElementById('min-level')?.value || '',
            maxLevel: document.getElementById('max-level')?.value || '',
            sortBy: document.getElementById('sort-by')?.value || 'id-asc'
        };
        
        this.filterStates[this.currentMode] = state;
    }
    
    // 恢复筛选状态
    restoreFilterState(mode) {
        const state = this.filterStates[mode];
        if (!state) return;
        
        // 恢复筛选器状态
        this.filterManager.selectedTags = new Set(state.selectedTags || []);
        this.filterManager.selectedRarity = new Set(state.selectedRarity || []);
        this.filterManager.selectedSkill = new Set(state.selectedSkill || []);
        this.filterManager.selectedNeed = new Set(state.selectedNeed || []);
        
        // 恢复UI元素值
        const elements = {
            'main-type-filter': state.mainTypeFilter,
            'sub-type-filter': state.subTypeFilter,
            'global-search': state.nameFilter,
            'min-cost': state.minCost,
            'max-cost': state.maxCost,
            'min-weight': state.minWeight,
            'max-weight': state.maxWeight,
            'min-level': state.minLevel,
            'max-level': state.maxLevel,
            'sort-by': state.sortBy
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            }
        });
        
        // 更新子类型筛选器
        if (state.mainTypeFilter && this.manager.updateSubTypeFilter) {
            this.manager.updateSubTypeFilter(state.mainTypeFilter);
        }
    }
    
    // 更新模式切换器滑块位置
    updateModeSwitcherSlider() {
        const modeSwitcher = document.querySelector('.mode-switcher');
        if (modeSwitcher) {
            if (this.currentMode === 'specialties') {
                modeSwitcher.classList.add('specialties');
            } else {
                modeSwitcher.classList.remove('specialties');
            }
        }
    }
    
    // 更新UI模式显示
    updateUIMode() {
        // 更新模式按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.mode === this.currentMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新标题
        const modeText = this.currentMode === 'items' ? '物品' : '特质';
        const calculatorTitle = document.getElementById('calculator-title');
        const resultsTitle = document.getElementById('results-title');
        
        if (calculatorTitle) calculatorTitle.textContent = `当前计算${modeText}`;
        if (resultsTitle) resultsTitle.textContent = `筛选结果`;
        
        // 显示/隐藏模式特定的控件
        const isItemsMode = this.currentMode === 'items';
        
        // 角色属性面板
        const characterAttributes = document.getElementById('character-attributes');
        if (characterAttributes) {
            characterAttributes.style.display = isItemsMode ? 'block' : 'none';
        }
        
        // 等级筛选
        const levelFilter = document.getElementById('level-filter');
        if (levelFilter) {
            levelFilter.style.display = isItemsMode ? 'none' : 'block';
        }
        
        // 重量筛选
        const weightFilter = document.getElementById('weight-filter');
        if (weightFilter) {
            weightFilter.style.display = isItemsMode ? 'block' : 'none';
        }
        
        // 货币单位选择（特质模式隐藏）
        const currencySelector = document.getElementById('currency-selector');
        if (currencySelector) {
            currencySelector.style.display = isItemsMode ? 'block' : 'none';
        }
        
        // 更新价格筛选标签
        const priceFilterLabel = document.getElementById('price-filter-label');
        const typeFilterLabel = document.getElementById('type-filter-label');
        if (priceFilterLabel) priceFilterLabel.textContent = isItemsMode ? '价格范围' : '成本范围';
        if (typeFilterLabel) typeFilterLabel.textContent = `${modeText}类型筛选`;
        
        // 更新排序选项
        this.updateSortOptions();
        
        // 更新全局搜索占位符
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.placeholder = `搜索${modeText}名称、描述或ID...`;
        }
    }
    
    // 更新排序选项
    updateSortOptions() {
        const sortSelect = document.getElementById('sort-by');
        if (!sortSelect) return;
        
        const currentValue = sortSelect.value;
        
        sortSelect.innerHTML = '';
        
        // 通用排序选项
        const commonOptions = [
            { value: 'id-asc', text: 'ID 从小到大' },
            { value: 'id-desc', text: 'ID 从大到小' },
            { value: 'name-asc', text: '名称 A-Z' },
            { value: 'name-desc', text: '名称 Z-A' },
            { value: 'cost-asc', text: (this.currentMode === 'items' ? '价格' : '成本') + ' 低到高' },
            { value: 'cost-desc', text: (this.currentMode === 'items' ? '价格' : '成本') + ' 高到低' }
        ];
        
        // 模式特定的排序选项
        const modeSpecificOptions = this.currentMode === 'items' ? [
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
        
        if (!sortSelect.value) {
            sortSelect.value = 'id-asc';
        }
    }
    
    // 显示数据来源信息
    showDataSourceInfo() {
        const statusElement = document.getElementById('data-status');
        if (!statusElement) return;
        
        const sourceInfo = this.dataManager.getSourceInfo();
        
        let infoHtml = `<div class="data-source-info" style="margin-top: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.8);">`;
        infoHtml += `物品: ${sourceInfo.items.count}个 | 特质: ${sourceInfo.specialties.count}个`;
        infoHtml += `</div>`;
        
        // 清除旧的信息并添加新的
        const oldInfo = statusElement.nextElementSibling;
        if (oldInfo && oldInfo.classList.contains('data-source-info')) {
            oldInfo.remove();
        }
        statusElement.insertAdjacentHTML('afterend', infoHtml);
    }
    
    // 显示数据状态
    showDataStatus(message, type) {
        const statusElement = document.getElementById('data-status');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = 'status-message';
        
        switch(type) {
            case 'loading':
                statusElement.classList.add('status-loading');
                break;
            case 'warning':
                statusElement.classList.add('status-warning');
                break;
            case 'error':
                statusElement.classList.add('status-error');
                break;
            case 'healthy':
                statusElement.classList.add('status-healthy');
                break;
        }
    }
    
    // 显示恢复选项
    showRecoveryOptions(issues) {
        const recoveryContainer = document.getElementById('recovery-container');
        if (!recoveryContainer) return;
        
        const recoveryHtml = `
            <div class="recovery-panel" style="margin: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
                <h3 style="margin-bottom: 10px;">数据同步问题</h3>
                <p>检测到以下问题：</p>
                <ul style="margin: 10px 0 20px 20px;">
                    ${issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
                <div class="recovery-actions" style="display: flex; gap: 10px;">
                    <button class="btn-success" onclick="unifiedApp.dataManager.forceRefresh()">强制刷新数据</button>
                    <button class="btn-danger" onclick="unifiedApp.ignoreDataIssues()">忽略问题</button>
                </div>
            </div>
        `;
        
        recoveryContainer.innerHTML = recoveryHtml;
    }
    
    // 忽略数据问题
    ignoreDataIssues() {
        const recoveryContainer = document.getElementById('recovery-container');
        if (recoveryContainer) {
            recoveryContainer.innerHTML = '';
        }
        this.showDataStatus('⚠️ 使用当前数据继续运行', 'warning');
    }
    
    // 下载计算器清单
    downloadCalculatorData() {
        const currentModeItems = this.calculatorModule.calculatorItems.filter(
            item => item.mode === this.currentMode
        );
        
        if (currentModeItems.length === 0) {
            this.showStatus('计算器为空，无法下载', 'warning');
            return;
        }
        
        let content = '';
        let totalCost = 0;
        let totalWeight = 0;
        const timestamp = new Date().toLocaleString('zh-CN');
        
        // 添加标题
        content += `统一计算器 - ${this.currentMode === 'items' ? '物品' : '特质'}清单\n`;
        content += `生成时间: ${timestamp}\n`;
        content += `当前模式: ${this.currentMode === 'items' ? '物品计算器' : '特质计算器'}\n`;
        content += '='.repeat(50) + '\n\n';
        
        // 添加角色属性（仅物品模式）
        if (this.currentMode === 'items') {
            const strength = document.getElementById('character-strength')?.value || 5;
            const endurance = document.getElementById('character-endurance')?.value || 5;
            // 修正负重计算公式
            const carryCapacity = 20 + parseInt(strength) + parseInt(endurance) * 3;
            content += `角色属性: 力量 ${strength}, 耐性 ${endurance}\n`;
            content += `负重容量: ${carryCapacity}\n`;
        }
        
        // 添加物品列表
        content += `${this.currentMode === 'items' ? '物品' : '特质'}列表:\n`;
        content += '-'.repeat(50) + '\n';
        
        currentModeItems.forEach((item, index) => {
            content += `${index + 1}. ${item.name}\n`;
            content += `   ID: ${item.id}\n`;
            
            if (this.currentMode === 'items') {
                const itemCost = item.cost * item.quantity;
                const itemWeight = item.weight * item.quantity;
                totalCost += itemCost;
                totalWeight += itemWeight;
                
                content += `   数量: ${item.quantity}\n`;
                content += `   单价: ${this.formatCurrencyForDownload(item.cost)}\n`;
                content += `   总价: ${this.formatCurrencyForDownload(itemCost)}\n`;
                content += `   重量: ${itemWeight}\n`;
                
                if (item.tags && item.tags.length > 0) {
                    content += `   标签: ${item.tags.join(', ')}\n`;
                }
                if (item.need && item.need.length > 0) {
                    content += `   需求: ${item.need.join(', ')}\n`;
                }
                
            } else {
                const levelIndex = item.currentLevel - 1;
                let itemCost = 0;
                
                if (Array.isArray(item.cost) && levelIndex < item.cost.length) {
                    itemCost = item.cost[levelIndex];
                } else {
                    itemCost = item.cost || 0;
                }
                
                totalCost += itemCost;
                
                content += `   等级: ${item.currentLevel}/${item.level}\n`;
                content += `   成本: ${itemCost}\n`;
                
                if (item.tag && item.tag.length > 0) {
                    content += `   标签: ${item.tag.join(', ')}\n`;
                }
                if (item.need && item.need.length > 0) {
                    content += `   需求: ${item.need.join(', ')}\n`;
                }
                
                if (item.description) {
                    let currentDescription = '';
                    if (Array.isArray(item.description) && levelIndex < item.description.length) {
                        currentDescription = item.description[levelIndex];
                    } else {
                        currentDescription = item.description || '';
                    }
                    
                    currentDescription = currentDescription.replace(/<[^>]*>/g, '');
                    content += `   效果: ${currentDescription}\n`;
                }
            }
            
            content += '\n';
        });
        
        // 添加总计
        content += '总计:\n';
        content += '-'.repeat(50) + '\n';
        
        if (this.currentMode === 'items') {
            content += `总价格: ${this.formatCurrencyForDownload(totalCost)}\n`;
            content += `总重量: ${totalWeight}\n`;
            
            const strength = document.getElementById('character-strength')?.value || 5;
            const endurance = document.getElementById('character-endurance')?.value || 5;
            // 修正负重计算公式
            const carryCapacity = 20 + parseInt(strength) + parseInt(endurance) * 3;
            const carryPercentage = totalWeight / carryCapacity;
            
            let carryStatus = '';
            if (carryPercentage <= 0.25) carryStatus = '轻快';
            else if (carryPercentage <= 0.5) carryStatus = '正常';
            else if (carryPercentage <= 1) carryStatus = '缓慢';
            else carryStatus = '超重';
            
            content += `负重状态: ${carryStatus}\n`;
            content += `负重容量: ${carryCapacity} (当前 ${totalWeight}/${carryCapacity})\n`;
        } else {
            content += `总成本: ${totalCost}\n`;
            content += `特质数量: ${currentModeItems.length}\n`;
        }
        
        // 创建并下载文件
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const fileName = `calculator_${this.currentMode}_${Date.now()}.txt`;
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showStatus(`已下载清单: ${fileName}`, 'success');
    }
    
    // 为下载格式化货币
    formatCurrencyForDownload(copper) {
        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const copperRemainder = copper % 100;
        
        let result = [];
        if (gold > 0) result.push(`${gold}金币`);
        if (silver > 0) result.push(`${silver}银币`);
        if (copperRemainder > 0 || result.length === 0) result.push(`${copperRemainder}铜币`);
        
        return result.join(' ');
    }
    
    // 显示状态消息
    showStatus(message, type) {
        this.showDataStatus(message, type);
    }
    
    // 初始化事件监听器
    initializeEventListeners() {
        // 模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // 角色属性变化
        const characterStrength = document.getElementById('character-strength');
        const characterEndurance = document.getElementById('character-endurance');
        
        if (characterStrength) {
            characterStrength.addEventListener('change', (e) => {
                this.calculatorModule.characterStrength = parseInt(e.target.value) || 5;
                this.calculatorModule.renderCalculator();
            });
        }
        
        if (characterEndurance) {
            characterEndurance.addEventListener('change', (e) => {
                this.calculatorModule.characterEndurance = parseInt(e.target.value) || 5;
                this.calculatorModule.renderCalculator();
            });
        }
        
        // 清空计算器
        const clearCalculator = document.getElementById('clear-calculator');
        if (clearCalculator) {
            clearCalculator.addEventListener('click', () => {
                this.calculatorModule.clearCalculator();
            });
        }
        
        // 下载清单
        const downloadCalculator = document.getElementById('download-calculator');
        if (downloadCalculator) {
            downloadCalculator.addEventListener('click', () => {
                this.downloadCalculatorData();
            });
        }
        
        // 分页按钮
        const prevPage = document.getElementById('prev-page');
        const nextPage = document.getElementById('next-page');
        
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                this.manager.prevPage();
            });
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                this.manager.nextPage();
            });
        }
        
        // 每页显示数量变化
        const itemsPerPage = document.getElementById('items-per-page');
        if (itemsPerPage) {
            itemsPerPage.addEventListener('change', (e) => {
                this.manager.itemsPerPage = parseInt(e.target.value) || 20;
                this.manager.currentPage = 1;
                this.manager.renderFilterResults();
            });
        }
        
        // 键盘快捷键：ESC关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const filterModal = document.getElementById('filter-modal');
                const detailModal = document.getElementById('detail-modal');
                
                if (filterModal && filterModal.style.display === 'flex') {
                    filterModal.style.display = 'none';
                }
                
                if (detailModal && detailModal.style.display === 'flex') {
                    detailModal.style.display = 'none';
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