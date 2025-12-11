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
        
        // 存储展开状态
        this.expandedItems = new Set();
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
    addItem(item, mode, selectedLevel = 1) {
        // 检查是否已存在
        const existingIndex = this.calculatorItems.findIndex(i => i.id == item.id && i.mode === mode);
        
        if (existingIndex !== -1) {
            // 如果已存在，覆盖上一个
            if (mode === 'items') {
                this.calculatorItems[existingIndex].quantity += 1;
            } else {
                // 特质模式：更新等级
                this.calculatorItems[existingIndex].currentLevel = selectedLevel;
            }
        } else {
            const calculatorItem = {
                ...item,
                mode: mode,
                quantity: mode === 'items' ? 1 : 1, // 特质默认为1，不可重复购买
                currentLevel: mode === 'specialties' ? selectedLevel : 0
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
        
        item.currentLevel = newLevel;
        this.saveCalculatorItems();
        this.renderCalculator();
    }
    
    // 切换描述展开状态
    toggleDescription(itemId) {
        if (this.expandedItems.has(itemId)) {
            this.expandedItems.delete(itemId);
        } else {
            this.expandedItems.add(itemId);
        }
        this.renderCalculator();
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
                const levelIndex = item.currentLevel - 1;
                if (Array.isArray(item.cost) && levelIndex < item.cost.length) {
                    itemCost = item.cost[levelIndex];
                } else {
                    itemCost = item.cost || 0;
                }
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
        if (this.currentMode === 'items') {
            totalCostElement.innerHTML = `<span class="currency-display">总价格: ${this.formatCurrency(totalCost)}</span>`;
        } else {
            totalCostElement.innerHTML = `<span class="currency-display">总成本: ${totalCost}</span>`;
        }
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
        const isExpanded = this.expandedItems.has(item.id);
        const descriptionClass = isExpanded ? 'expanded' : '';
        
        container.innerHTML = `
            <div class="calculator-item-content">
                <div class="calculator-item-header">
                    <div class="calculator-item-name">${item.name}</div>
                    <div class="calculator-item-tags">
                        ${item.tags ? item.tags.map(tag => `<span class="calculator-tag">${tag}</span>`).join('') : ''}
                    </div>
                </div>
                <div class="calculator-item-description ${descriptionClass}" data-id="${item.id}">
                    ${item.description}
                </div>
                ${item.description && item.description.length > 100 ? 
                    `<button class="toggle-description-btn" data-id="${item.id}">${isExpanded ? '收起' : '展开'}</button>` : ''}
            </div>
            <div class="calculator-item-controls">
                <div class="quantity-control">
                    <label>数量:</label>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="0" data-id="${item.id}">
                </div>
                <span class="calculator-item-cost">${this.formatCurrency(itemCost)}</span>
                <span class="calculator-item-weight">重量: ${itemWeight}</span>
                <button class="btn-danger remove-btn" data-id="${item.id}">删除</button>
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
        
        // 添加展开/收起按钮事件监听器
        const toggleBtn = container.querySelector('.toggle-description-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                this.toggleDescription(itemId);
            });
        }
        
        // 添加描述点击展开事件监听器
        const descriptionElement = container.querySelector('.calculator-item-description');
        if (descriptionElement && !isExpanded) {
            descriptionElement.addEventListener('click', (e) => {
                if (e.target === descriptionElement) {
                    const itemId = descriptionElement.dataset.id;
                    this.toggleDescription(itemId);
                }
            });
        }
    }
    
    // 渲染特质计算器项目
    renderSpecialtyCalculator(container, item, itemCost) {
        // 获取当前等级的描述
        const currentDescription = Array.isArray(item.description) ? 
            (item.description[item.currentLevel - 1] || item.description[0] || '') : 
            item.description || '';
        
        const isExpanded = this.expandedItems.has(item.id);
        const descriptionClass = isExpanded ? 'expanded' : '';
        
        container.innerHTML = `
            <div class="calculator-item-content">
                <div class="calculator-item-header">
                    <div class="calculator-item-name">${item.name}</div>
                    <div class="calculator-item-tags">
                        ${item.tag ? item.tag.map(tag => `<span class="calculator-tag">${tag}</span>`).join('') : ''}
                    </div>
                </div>
                <div class="calculator-item-level">等级: ${item.currentLevel}/${item.level}</div>
                <div class="calculator-item-description ${descriptionClass}" data-id="${item.id}">
                    ${currentDescription}
                </div>
                ${currentDescription && currentDescription.length > 100 ? 
                    `<button class="toggle-description-btn" data-id="${item.id}">${isExpanded ? '收起' : '展开'}</button>` : ''}
            </div>
            <div class="calculator-item-controls">
                <span class="calculator-item-cost">成本: ${itemCost}</span>
                <button class="btn-danger remove-btn" data-id="${item.id}">删除</button>
            </div>
        `;
        
        // 添加删除按钮事件监听器
        const removeBtn = container.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            this.removeFromCalculator(itemId);
        });
        
        // 添加展开/收起按钮事件监听器
        const toggleBtn = container.querySelector('.toggle-description-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                this.toggleDescription(itemId);
            });
        }
        
        // 添加描述点击展开事件监听器
        const descriptionElement = container.querySelector('.calculator-item-description');
        if (descriptionElement && !isExpanded) {
            descriptionElement.addEventListener('click', (e) => {
                if (e.target === descriptionElement) {
                    const itemId = descriptionElement.dataset.id;
                    this.toggleDescription(itemId);
                }
            });
        }
    }
    
    // 清空计算器
    clearCalculator() {
        // 只清除当前模式的物品
        this.calculatorItems = this.calculatorItems.filter(item => item.mode !== this.currentMode);
        this.expandedItems.clear();
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