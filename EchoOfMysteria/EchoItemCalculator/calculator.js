// ================================
// 模块化设计：计算器模块
// ================================
class CalculatorModule {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.calculatorItems = this.loadCalculatorItems();
        
        // 角色属性
        this.characterStrength = 5;
        this.characterEndurance = 5;
    }
    
    // 从localStorage加载计算器物品
    loadCalculatorItems() {
        try {
            const stored = localStorage.getItem('echo-calculator-items');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('加载计算器物品失败，使用空数组:', error);
            return [];
        }
    }
    
    // 保存计算器物品到localStorage
    saveCalculatorItems() {
        try {
            localStorage.setItem('echo-calculator-items', JSON.stringify(this.calculatorItems));
        } catch (error) {
            console.warn('保存计算器物品失败:', error);
        }
    }
    
    // 添加物品到计算器
    addItem(itemId) {
        const item = this.itemManager.items.find(i => i.id == itemId);
        if (!item) {
            console.warn(`未找到物品: ${itemId}`);
            return;
        }
        
        // 检查是否已存在
        const existingItem = this.calculatorItems.find(i => i.id == itemId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.calculatorItems.push({
                ...item,
                quantity: 1
            });
        }
        
        this.saveCalculatorItems();
        this.renderCalculator();
        
        // 显示状态消息
        this.showStatus(`已添加 ${item.name} 到计算器`, 'success');
    }
    
    // 从计算器移除物品
    removeFromCalculator(itemId) {
        this.calculatorItems = this.calculatorItems.filter(item => item.id != itemId);
        this.saveCalculatorItems();
        this.renderCalculator();
    }
    
    // 更新计算器物品数量
    updateQuantity(itemId, newQuantity) {
        const item = this.calculatorItems.find(i => i.id == itemId);
        if (!item) return;
        
        // 确保数量是正整数
        newQuantity = parseInt(newQuantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
            newQuantity = 0;
        }
        
        if (newQuantity === 0) {
            this.removeFromCalculator(itemId);
        } else {
            item.quantity = newQuantity;
            this.saveCalculatorItems();
            this.renderCalculator();
        }
    }
    
    // 渲染计算器
    renderCalculator() {
        const calculatorElement = document.getElementById('calculator-items');
        const totalCostElement = document.getElementById('total-cost');
        const totalWeightElement = document.getElementById('total-weight');
        const carryStatusElement = document.getElementById('carry-status');
        const weightStatusElement = document.getElementById('weight-status');
        
        // 清空计算器
        calculatorElement.innerHTML = '';
        
        if (this.calculatorItems.length === 0) {
            calculatorElement.innerHTML = '<div class="empty-state">计算器为空，请从筛选结果中添加物品</div>';
            totalCostElement.textContent = '';
            totalWeightElement.textContent = '0';
            carryStatusElement.textContent = '轻快';
            weightStatusElement.className = 'weight-status light';
            return;
        }
        
        // 计算总消耗和总重量
        let totalCost = 0;
        let totalWeight = 0;
        
        // 渲染计算器物品
        this.calculatorItems.forEach(item => {
            const itemCost = item.cost * item.quantity;
            const itemWeight = item.weight * item.quantity;
            totalCost += itemCost;
            totalWeight += itemWeight;
            
            // 处理描述中的分号，替换为换行符
            const description = item.description ? this.escapeHtml(item.description).replace(/;/g, '\n') : '';
            
            const itemElement = document.createElement('div');
            itemElement.className = 'calculator-item';
            
            itemElement.innerHTML = `
                <div class="calculator-item-header">
                    <div class="calculator-item-name">${this.escapeHtml(item.name)}</div>
                    <div class="calculator-item-tags">
                        ${item.tags ? item.tags.map(tag => `<span class="calculator-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                    </div>
                </div>
                <div class="calculator-item-details">
                    <div class="calculator-item-description">${description}</div>
                    <div class="calculator-item-controls">
                        <input type="number" class="quantity-input" value="${item.quantity}" min="0" data-id="${item.id}">
                        <span class="calculator-item-cost">${this.formatCurrency(itemCost)}</span>
                        <button class="btn-danger remove-btn" data-id="${item.id}">删除</button>
                    </div>
                </div>
            `;
            
            calculatorElement.appendChild(itemElement);
        });
        
        // 更新总消耗和总重量
        totalCostElement.innerHTML = `<span class="currency-display">总价格: ${this.formatCurrency(totalCost)}</span>`;
        totalWeightElement.textContent = totalWeight;
        
        // 计算负重状态
        const carryCapacity = 20 + this.characterStrength + this.characterEndurance * 30;
        const carryPercentage = totalWeight / carryCapacity;
        
        let statusText = '';
        let statusClass = '';
        
        if (carryPercentage <= 0.25) {
            statusText = '轻快';
            statusClass = 'light';
        } else if (carryPercentage <= 0.5) {
            statusText = '正常';
            statusClass = 'normal';
        } else if (carryPercentage <= 1) {
            statusText = '缓慢';
            statusClass = 'heavy';
        } else {
            statusText = '超重';
            statusClass = 'overloaded';
        }
        
        carryStatusElement.textContent = statusText;
        weightStatusElement.className = `weight-status ${statusClass}`;
        
        // 添加事件监听器
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const itemId = e.target.dataset.id;
                const newQuantity = parseInt(e.target.value);
                this.updateQuantity(itemId, newQuantity);
            });
            
            input.addEventListener('blur', (e) => {
                const itemId = e.target.dataset.id;
                const newQuantity = parseInt(e.target.value);
                this.updateQuantity(itemId, newQuantity);
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                this.removeFromCalculator(itemId);
            });
        });
    }
    
    // 清空计算器
    clearCalculator() {
        this.calculatorItems = [];
        this.saveCalculatorItems();
        this.renderCalculator();
        this.showStatus('计算器已清空', 'success');
    }
    
    // 货币格式化 - 新版：显示为"金币 银币 铜币"
    formatCurrency(copper) {
        // 根据规则书：1金币 = 100银币 = 10000铜币
        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const copperRemainder = copper % 100;
        
        let result = [];
        if (gold > 0) result.push(`${gold}金币`);
        if (silver > 0) result.push(`${silver}银币`);
        if (copperRemainder > 0 || result.length === 0) result.push(`${copperRemainder}铜币`);
        
        return result.join(' ');
    }
    
    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 显示状态消息
    showStatus(message, type) {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = 'status-message';
        
        if (type === 'success') {
            statusElement.classList.add('status-success');
        } else if (type === 'error') {
            statusElement.classList.add('status-error');
        } else if (type === 'warning') {
            statusElement.classList.add('status-warning');
        }
        
        // 3秒后自动清除成功消息
        if (type === 'success') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'status-message';
            }, 3000);
        }
    }
}