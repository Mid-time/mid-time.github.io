// ================================
// 统一应用类
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
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showDataStatus('❌ 应用初始化失败: ' + error.message, 'error');
            this.showRecoveryOptions([error.message]);
        }
    }
    
    // 切换模式
    async switchMode(newMode) {
        if (this.currentMode === newMode) return;
        
        this.currentMode = newMode;
        this.manager.setMode(newMode);
        this.calculatorModule.setMode(newMode);
        
        // 更新UI模式显示
        this.updateUIMode();
        
        try {
            this.showDataStatus('🔄 正在切换模式...', 'loading');
            
            // 加载新模式的数据
            await this.manager.loadCurrentData();
            
            this.showDataStatus('✅ 模式切换完成', 'healthy');
            
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
        document.getElementById('calculator-title').textContent = `当前计算${modeText}`;
        document.getElementById('filter-title').textContent = `${modeText}筛选`;
        document.getElementById('results-title').textContent = `筛选结果`;
        document.getElementById('name-filter-label').textContent = `${modeText}名称/描述搜索`;
        document.getElementById('type-filter-label').textContent = `${modeText}类型筛选`;
        
        // 显示/隐藏模式特定的控件
        const isItemsMode = this.currentMode === 'items';
        
        // 角色属性面板
        document.getElementById('character-attributes').style.display = isItemsMode ? 'block' : 'none';
        
        // 类型筛选
        document.querySelector('.hierarchical-tags').style.display = 'block';
        
        // 等级筛选
        document.getElementById('level-filter').style.display = isItemsMode ? 'none' : 'block';
        
        // 重量筛选
        document.getElementById('weight-filter').style.display = isItemsMode ? 'block' : 'none';
        
        // 货币单位选择（特质模式隐藏）
        const costUnitElements = document.querySelectorAll('#cost-unit, #max-cost-unit');
        costUnitElements.forEach(element => {
            element.style.display = isItemsMode ? 'inline-block' : 'none';
        });
        
        // 更新价格筛选标签
        const priceLabels = document.querySelectorAll('.filter-group label');
        priceLabels.forEach(label => {
            if (label.textContent.includes('价格')) {
                label.textContent = isItemsMode ? '价格范围' : '成本范围';
            }
        });
        
        // 更新排序选项
        this.updateSortOptions();
    }
    
    // 更新排序选项
    updateSortOptions() {
        const sortSelect = document.getElementById('sort-by');
        const currentValue = sortSelect.value;
        
        // 保存当前选项
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
        
        // 添加所有选项
        [...commonOptions, ...modeSpecificOptions].forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.value === currentValue) {
                optionElement.selected = true;
            }
            sortSelect.appendChild(optionElement);
        });
        
        // 如果没有匹配的当前值，使用默认值
        if (!sortSelect.value) {
            sortSelect.value = 'id-asc';
        }
    }
    
    // 显示数据来源信息
    showDataSourceInfo() {
        const statusElement = document.getElementById('data-status');
        const sourceInfo = this.dataManager.getSourceInfo();
        
        let infoHtml = `<div class="data-source-info">`;
        infoHtml += `物品: ${sourceInfo.items.source} (${sourceInfo.items.count}个)`;
        infoHtml += ` | 特质: ${sourceInfo.specialties.source} (${sourceInfo.specialties.count}个)`;
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
        
        const recoveryHtml = `
            <div class="recovery-panel">
                <h3>数据同步问题</h3>
                <p>检测到以下问题：</p>
                <ul>
                    ${issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
                <div class="recovery-actions">
                    <button class="btn-success" onclick="unifiedApp.dataManager.forceRefresh()">强制刷新数据</button>
                    <button class="btn-danger" onclick="unifiedApp.ignoreDataIssues()">忽略问题</button>
                </div>
            </div>
        `;
        
        recoveryContainer.innerHTML = recoveryHtml;
    }
    
    // 忽略数据问题
    ignoreDataIssues() {
        document.getElementById('recovery-container').innerHTML = '';
        this.showDataStatus('⚠️ 使用当前数据继续运行', 'warning');
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
        document.getElementById('character-strength').addEventListener('change', (e) => {
            this.calculatorModule.characterStrength = parseInt(e.target.value) || 5;
            this.calculatorModule.renderCalculator();
        });
        
        document.getElementById('character-endurance').addEventListener('change', (e) => {
            this.calculatorModule.characterEndurance = parseInt(e.target.value) || 5;
            this.calculatorModule.renderCalculator();
        });
        
        // 清空计算器
        document.getElementById('clear-calculator').addEventListener('click', () => {
            this.calculatorModule.clearCalculator();
        });
        
        // 清除筛选
        document.getElementById('clear-filter').addEventListener('click', () => {
            this.filterManager.clearAllFilters();
            this.filterManager.applyFilter();
        });
        
        // 分页按钮
        document.getElementById('prev-page').addEventListener('click', () => {
            this.manager.prevPage();
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            this.manager.nextPage();
        });
        
        // 每页显示数量变化
        document.getElementById('items-per-page').addEventListener('change', (e) => {
            this.manager.itemsPerPage = parseInt(e.target.value) || 20;
            this.manager.currentPage = 1;
            this.manager.renderFilterResults();
        });
    }
}

// 初始化应用
let unifiedApp;
document.addEventListener('DOMContentLoaded', () => {
    unifiedApp = new UnifiedCalculatorApp();
});