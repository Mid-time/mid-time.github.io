// ================================
// 统一计算器模块
// ================================
class UnifiedCalculator {
    constructor(manager) {
        this.manager = manager;
        this.calculatorItems = this.loadCalculatorItems();
        
        // 角色属性
        this.characterStrength = 5;
        this.characterEndurance = 5;
        
        // 当前模式
        this.currentMode = 'items';
    }
    
    // 设置当前模式
    setMode(mode) {
        this.currentMode = mode;
        this.renderCalculator();
    }
    
    // 从localStorage加载计算器物品
    loadCalculatorItems() {
        try {
            const stored = localStorage.getItem('unified-calculator-items');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('加载计算器物品失败，使用空数组:', error);
            return [];
        }
    }
    
    // 保存计算器物品到localStorage
    saveCalculatorItems() {
        try {
            localStorage.setItem('unified-calculator-items', JSON.stringify(this.calculatorItems));
        } catch (error) {
            console.warn('保存计算器物品失败:', error);
        }
    }
    
    // 添加物品到计算器
    addItem(item, mode) {
        // 检查是否已存在
        const existingItem = this.calculatorItems.find(i => i.id == item.id && i.mode === mode);
        
        if (existingItem) {
            if (mode === 'items') {
                existingItem.quantity += 1;
            } else {
                // 特质模式：增加等级
                existingItem.currentLevel = Math.min(existingItem.currentLevel + 1, item.level);
            }
        } else {
            const calculatorItem = {
                ...item,
                mode: mode,
                quantity: mode === 'items' ? 1 : 0,
                currentLevel: mode === 'specialties' ? 1 : 0
            };
            
            this.calculatorItems.push(calculatorItem);
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
    
    // 更新特质等级
    updateLevel(itemId, newLevel) {
        const item = this.calculatorItems.find(i => i.id == itemId);
        if (!item || item.mode !== 'specialties') return;
        
        // 确保等级在有效范围内
        newLevel = parseInt(newLevel);
        if (isNaN(newLevel) || newLevel < 1) {
            newLevel = 1;
        } else if (newLevel > item.level) {
            newLevel = item.level;
        }
        
        if (newLevel === 0) {
            this.removeFromCalculator(itemId);
        } else {
            item.currentLevel = newLevel;
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
        
        // 过滤当前模式的物品
        const currentModeItems = this.calculatorItems.filter(item => item.mode === this.currentMode);
        
        if (currentModeItems.length === 0) {
            calculatorElement.innerHTML = '<div class="empty-state">计算器为空，请从筛选结果中添加' + (this.currentMode === 'items' ? '物品' : '特质') + '</div>';
            totalCostElement.textContent = '';
            totalWeightElement.textContent = '0';
            carryStatusElement.textContent = '轻快';
            weightStatusElement.className = 'weight-status light';
            weightStatusElement.style.display = this.currentMode === 'items' ? 'flex' : 'none';
            return;
        }
        
        // 计算总消耗和总重量
        let totalCost = 0;
        let totalWeight = 0;
        
        // 渲染计算器物品
        currentModeItems.forEach(item => {
            let itemCost = 0;
            let itemWeight = 0;
            
            if (item.mode === 'items') {
                itemCost = item.cost * item.quantity;
                itemWeight = item.weight * item.quantity;
            } else {
                // 特质模式：使用当前等级的成本
                itemCost = item.cost[item.currentLevel - 1] || 0;
                itemWeight = 0; // 特质没有重量
            }
            
            totalCost += itemCost;
            totalWeight += itemWeight;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'calculator-item';
            
            if (item.mode === 'items') {
                this.renderItemCalculator(itemElement, item, itemCost, itemWeight);
            } else {
                this.renderSpecialtyCalculator(itemElement, item, itemCost);
            }
            
            calculatorElement.appendChild(itemElement);
        });
        
        // 更新总消耗和总重量
        totalCostElement.innerHTML = `<span class="currency-display">总价格: ${this.formatCurrency(totalCost)}</span>`;
        totalWeightElement.textContent = totalWeight;
        
        // 计算负重状态（仅物品模式）
        if (this.currentMode === 'items') {
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
            weightStatusElement.style.display = 'flex';
        } else {
            weightStatusElement.style.display = 'none';
        }
    }
    
    // 渲染物品计算器项目
    renderItemCalculator(container, item, itemCost, itemWeight) {
        container.innerHTML = `
            <div class="calculator-item-header">
                <div class="calculator-item-name">${this.escapeHtml(item.name)}</div>
                <div class="calculator-item-tags">
                    ${item.tags ? item.tags.map(tag => `<span class="calculator-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                </div>
            </div>
            <div class="calculator-item-details">
                <div class="calculator-item-description">${this.escapeHtml(item.description)}</div>
                <div class="calculator-item-controls">
                    <input type="number" class="quantity-input" value="${item.quantity}" min="0" data-id="${item.id}">
                    <span class="calculator-item-cost">${this.formatCurrency(itemCost)}</span>
                    <span class="calculator-item-weight">重量: ${itemWeight}</span>
                    <button class="btn-danger remove-btn" data-id="${item.id}">删除</button>
                </div>
            </div>
        `;
        
        // 添加事件监听器
        const quantityInput = container.querySelector('.quantity-input');
        quantityInput.addEventListener('change', (e) => {
            const itemId = e.target.dataset.id;
            const newQuantity = parseInt(e.target.value);
            this.updateQuantity(itemId, newQuantity);
        });
        
        quantityInput.addEventListener('blur', (e) => {
            const itemId = e.target.dataset.id;
            const newQuantity = parseInt(e.target.value);
            this.updateQuantity(itemId, newQuantity);
        });
        
        const removeBtn = container.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            this.removeFromCalculator(itemId);
        });
    }
    
    // 渲染特质计算器项目
    renderSpecialtyCalculator(container, item, itemCost) {
        // 构建等级选择器
        const levelButtons = [];
        for (let i = 1; i <= item.level; i++) {
            const isActive = i === item.currentLevel;
            levelButtons.push(`<button class="level-btn ${isActive ? 'active' : ''}" data-level="${i}" data-id="${item.id}">${i}</button>`);
        }
        
        container.innerHTML = `
            <div class="calculator-item-header">
                <div class="calculator-item-name">${this.escapeHtml(item.name)}</div>
                <div class="calculator-item-tags">
                    ${item.tag ? item.tag.map(tag => `<span class="calculator-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                </div>
            </div>
            <div class="calculator-item-details">
                <div class="calculator-item-description">${this.escapeHtml(item.description[item.currentLevel - 1] || '')}</div>
                <div class="calculator-item-controls">
                    <div class="level-controls">
                        <span>等级:</span>
                        ${levelButtons.join('')}
                        <span class="level-display">${item.currentLevel}/${item.level}</span>
                    </div>
                    <span class="calculator-item-cost">${this.formatCurrency(itemCost)}</span>
                    <button class="btn-danger remove-btn" data-id="${item.id}">删除</button>
                </div>
            </div>
        `;
        
        // 添加等级按钮事件监听器
        container.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                const newLevel = parseInt(e.target.dataset.level);
                this.updateLevel(itemId, newLevel);
            });
        });
        
        // 添加删除按钮事件监听器
        const removeBtn = container.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            this.removeFromCalculator(itemId);
        });
    }
    
    // 清空计算器
    clearCalculator() {
        // 只清除当前模式的物品
        this.calculatorItems = this.calculatorItems.filter(item => item.mode !== this.currentMode);
        this.saveCalculatorItems();
        this.renderCalculator();
        this.showStatus('计算器已清空', 'success');
    }
    
    // 货币格式化
    formatCurrency(copper) {
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