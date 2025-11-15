// ================================
// 主应用类
// ================================
class EchoMysteriaCalculator {
    constructor() {
        // 初始化各个模块
        this.dataManager = new EchoDataManager();
        this.itemManager = new ItemManager(this.dataManager);
        this.filterManager = new FilterManager(this.itemManager);
        this.calculatorModule = new CalculatorModule(this.itemManager);
        
        // 将计算器模块暴露给全局，以便其他模块调用
        window.calculatorModule = this.calculatorModule;
        
        this.initializeEventListeners();
        this.loadAllData();
        this.calculatorModule.renderCalculator();
    }
    
    // 加载所有必要数据
    async loadAllData() {
        try {
            this.showDataStatus('🔄 正在加载数据...', 'loading');
            
            const success = await this.itemManager.loadAllData();
            
            if (success && this.itemManager.items.length > 0) {
                this.showDataStatus('✅ 数据加载完成', 'healthy');
                this.filterManager.initializeFilterUI();
                
                // 显示数据来源信息
                this.showDataSourceInfo();
                
                // 初始化时自动应用筛选，显示所有物品
                this.filterManager.applyFilter();
            } else {
                throw new Error('数据加载失败或没有数据');
            }
            
        } catch (error) {
            console.error('数据加载失败:', error);
            this.showDataStatus('❌ 数据加载失败，使用备用数据', 'error');
            this.showRecoveryOptions(['数据文件加载失败']);
            
            // 即使使用备用数据，也要尝试显示筛选结果
            if (this.itemManager.items.length > 0) {
                this.filterManager.applyFilter();
            }
        }
    }
    
    // 显示数据来源信息
    showDataSourceInfo() {
        const statusElement = document.getElementById('data-status');
        const sourceInfo = this.dataManager.getSourceInfo();
        const versionInfo = this.dataManager.getVersionInfo();
        
        let infoHtml = `<div class="data-source-info">`;
        infoHtml += `物品: ${sourceInfo.items.source} (${this.itemManager.items.length}个)`;
        if (versionInfo.items) infoHtml += ` [v${versionInfo.items}]`;
        infoHtml += `</div>`;
        
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
                    ${issues.map(issue => `<li>${this.escapeHtml(issue)}</li>`).join('')}
                </ul>
                <div class="recovery-actions">
                    <button class="btn-success" onclick="echoCalculator.dataManager.forceRefresh()">强制刷新数据</button>
                    <button class="btn-warning" onclick="echoCalculator.dataManager.useFallbackData()">使用备用数据</button>
                    <button class="btn-danger" onclick="echoCalculator.ignoreDataIssues()">忽略问题</button>
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
            this.itemManager.prevPage();
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            this.itemManager.nextPage();
        });
        
        // 每页显示数量变化
        document.getElementById('items-per-page').addEventListener('change', (e) => {
            this.itemManager.itemsPerPage = parseInt(e.target.value) || 20;
            this.itemManager.currentPage = 1;
            this.itemManager.renderFilterResults();
        });
    }
    
    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
let echoCalculator;
document.addEventListener('DOMContentLoaded', () => {
    echoCalculator = new EchoMysteriaCalculator();
});