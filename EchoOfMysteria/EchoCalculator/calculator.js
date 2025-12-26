// ================================
// 统一计算器模块 - 支持新UI布局
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
        
        // 初始化事件监听器
        this.initializeEventListeners();
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
    
    // 初始化事件监听器
    initializeEventListeners() {
        // 从其他地方添加物品时的全局监听
        document.addEventListener('add-to-calculator', (e) => {
            if (e.detail) {
                this.addItem(e.detail.item, e.detail.mode, e.detail.level);
            }
        });
    }
    
    // 添加物品到计算器
    addItem(item, mode, selectedLevel = 1) {
        // 检查是否已存在（特质不可重复购买）
        const existingItem = this.calculatorItems.find(i => i.id == item.id && i.mode === mode);
        
        if (existingItem) {
            if (mode === 'items') {
                existingItem.quantity += 1;
            } else {
                // 特质模式：如果已存在且等级不同，则更新等级
                if (existingItem.currentLevel !== selectedLevel) {
                    existingItem.currentLevel = selectedLevel;
                } else {
                    // 相同等级的特质不可重复购买
                    this.showStatus(`${item.name} 已存在于计算器中`, 'warning');
                    return;
                }
            }
        } else {
            const calculatorItem = {
                ...item,
                mode: mode,
                quantity: mode === 'items' ? 1 : 1,
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
    
    // 渲染计算器
    renderCalculator() {
        const calculatorElement = document.getElementById('calculator-items');
        const totalCostElement = document.getElementById('total-cost');
        const totalWeightElement = document.getElementById('total-weight');
        const carryStatusElement = document.getElementById('carry-status');
        const weightStatusElement = document.getElementById('weight-status');
        
        // 清空计算器
        if (calculatorElement) {
            calculatorElement.innerHTML = '';
        }
        
        // 过滤当前模式的物品
        const currentModeItems = this.calculatorItems.filter(item => item.mode === this.currentMode);
        
        if (currentModeItems.length === 0) {
            if (calculatorElement) {
                calculatorElement.innerHTML = '<div class="empty-state">计算器为空，请从筛选结果中添加' + (this.currentMode === 'items' ? '物品' : '特质') + '</div>';
            }
            
            if (totalCostElement) {
                if (this.currentMode === 'items') {
                    totalCostElement.innerHTML = `<span class="currency-display">总价格: 0 铜币 | 总重量: 0</span>`;
                } else {
                    totalCostElement.innerHTML = `<span class="currency-display">总成本: 0</span>`;
                }
            }
            
            if (totalWeightElement) totalWeightElement.textContent = '0';
            if (carryStatusElement) carryStatusElement.textContent = '轻快';
            
            if (weightStatusElement) {
                weightStatusElement.className = 'weight-status light';
                weightStatusElement.innerHTML = `
                    <div>总重量: <span id="total-weight">0</span></div>
                    <div>负重状态: <span id="carry-status">轻快</span></div>
                `;
                weightStatusElement.style.display = 'none';
            }
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
            
            // 添加点击事件显示详情
            itemElement.addEventListener('click', (e) => {
                // 防止点击按钮时触发详情
                if (!e.target.closest('.calculator-item-controls') && 
                    !e.target.closest('.remove-btn') &&
                    !e.target.closest('input') &&
                    !e.target.closest('select')) {
                    if (this.manager && this.manager.showItemDetail) {
                        this.manager.showItemDetail(item);
                    }
                }
            });
            
            if (calculatorElement) {
                calculatorElement.appendChild(itemElement);
            }
        });
        
        // 更新总消耗和总重量
        if (totalCostElement) {
            if (this.currentMode === 'items') {
                totalCostElement.innerHTML = `<span class="currency-display">总价格: ${this.formatCurrency(totalCost)} | 总重量: ${totalWeight}</span>`;
            } else {
                totalCostElement.innerHTML = `<span class="currency-display">总成本: ${totalCost}</span>`;
            }
        }
        
        if (totalWeightElement) totalWeightElement.textContent = totalWeight;
        
        // 计算负重状态（仅物品模式）- 修正负重计算公式
        if (this.currentMode === 'items') {
            // 修正负重计算公式：20 + 力量 + 耐性 * 3
            const carryCapacity = 20 + this.characterStrength + (this.characterEndurance * 3);
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
            
            if (carryStatusElement) carryStatusElement.textContent = statusText;
            
            if (weightStatusElement) {
                weightStatusElement.className = `weight-status ${statusClass}`;
                weightStatusElement.innerHTML = `
                    <div>总重量: <span id="total-weight">${totalWeight}</span></div>
                    <div>负重状态: <span id="carry-status">${statusText}</span></div>
                `;
                weightStatusElement.style.display = 'flex';
            }
        } else {
            if (weightStatusElement) {
                weightStatusElement.style.display = 'none';
            }
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
                <div class="calculator-item-description">${this.formatDescription(this.escapeHtml(item.description))}</div>
                <div class="calculator-item-controls">
                    <div class="quantity-control">
                        <label>数量:</label>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="0" data-id="${item.id}">
                    </div>
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
            e.stopPropagation();
            const itemId = e.target.dataset.id;
            this.removeFromCalculator(itemId);
        });
    }
    
    // 渲染特质计算器项目
    renderSpecialtyCalculator(container, item, itemCost) {
        // 获取当前等级的描述
        const currentDescription = Array.isArray(item.description) ? 
            (item.description[item.currentLevel - 1] || item.description[0] || '') : 
            item.description || '';
        
        // 构建等级选择器选项
        const levelOptions = [];
        for (let i = 1; i <= item.level; i++) {
            levelOptions.push(`<option value="${i}" ${i === item.currentLevel ? 'selected' : ''}>${i}</option>`);
        }
        
        container.innerHTML = `
            <div class="calculator-item-header">
                <div class="calculator-item-name">${this.escapeHtml(item.name)}</div>
                <div class="calculator-item-tags">
                    ${item.tag ? item.tag.map(tag => `<span class="calculator-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                </div>
            </div>
            <div class="calculator-item-details">
                <div class="calculator-item-description">${this.formatDescription(this.escapeHtml(currentDescription))}</div>
                <div class="calculator-item-controls">
                    <div class="level-control">
                        <label>等级:</label>
                        <select class="level-select" data-id="${item.id}">
                            ${levelOptions.join('')}
                        </select>
                        <span class="level-display">/${item.level}</span>
                    </div>
                    <span class="calculator-item-cost">成本: ${itemCost}</span>
                    <button class="btn-danger remove-btn" data-id="${item.id}">删除</button>
                </div>
            </div>
        `;
        
        // 添加等级选择事件监听器
        const levelSelect = container.querySelector('.level-select');
        levelSelect.addEventListener('change', (e) => {
            const itemId = e.target.dataset.id;
            const newLevel = parseInt(e.target.value);
            this.updateLevel(itemId, newLevel);
        });
        
        // 添加删除按钮事件监听器
        const removeBtn = container.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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
    
    // 检查物品是否在计算器中
    isInCalculator(itemId) {
        return this.calculatorItems.some(item => item.id == itemId && item.mode === this.currentMode);
    }
    
    // 获取计算器中的物品数量
    getCalculatorQuantity(itemId) {
        const item = this.calculatorItems.find(i => i.id == itemId && i.mode === this.currentMode);
        return item ? item.quantity : 0;
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 格式化描述（分号换行，加粗{}内容）
    formatDescription(text) {
        if (!text) return '';
        
        // 用<br>替换分号
        let formatted = text.replace(/;/g, '<br>');
        
        // 加粗{}中的内容
        formatted = formatted.replace(/\{([^}]+)\}/g, '<strong>$1</strong>');
        
        return formatted;
    }
    
    // 显示状态消息
    showStatus(message, type) {
        // 使用数据状态区域显示消息
        if (window.unifiedApp) {
            window.unifiedApp.showDataStatus(message, type);
        }
    }
}