// ================================
// 统一计算器模块 - 支持新界面布局
// ================================
class UnifiedCalculator {
    constructor(itemManager, specialtyManager) {
        this.itemManager = itemManager;
        this.specialtyManager = specialtyManager;
        
        // 设置计算器模块引用
        if (this.itemManager) this.itemManager.setCalculatorModule(this);
        if (this.specialtyManager) this.specialtyManager.setCalculatorModule(this);
        
        // 计算器物品
        this.calculatorItems = this.loadCalculatorItems();
        
        // 角色属性
        this.characterStrength = this.loadCharacterStrength();
        this.characterEndurance = this.loadCharacterEndurance();
        
        // 初始化事件监听器
        this.initializeEventListeners();
    }
    
    // 初始化事件监听器
    initializeEventListeners() {
        // 清空计算器按钮
        const clearCalculator = document.getElementById('clear-calculator');
        if (clearCalculator) {
            clearCalculator.addEventListener('click', () => {
                this.clearCalculator();
            });
        }
        
        // 下载清单按钮
        const downloadCalculator = document.getElementById('download-calculator');
        if (downloadCalculator) {
            downloadCalculator.addEventListener('click', () => {
                this.downloadCalculatorData();
            });
        }
        
        // 修改角色属性按钮
        const editCharacter = document.getElementById('edit-character');
        if (editCharacter) {
            editCharacter.addEventListener('click', () => {
                this.showCharacterModal();
            });
        }
        
        // 角色属性弹窗事件
        this.initializeCharacterModalEvents();
        
        // 折叠栏切换
        this.initializeAccordionEvents();
    }
    
    // 初始化折叠栏事件（独立折叠）- 修复版
    initializeAccordionEvents() {
        // 移除之前绑定的事件，防止重复绑定
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            // 克隆元素并替换以移除所有事件监听器
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            // 绑定点击事件
            newHeader.addEventListener('click', (e) => {
                this.handleAccordionClick(e);
            });
            
            // 添加键盘支持
            newHeader.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleAccordionClick(e);
                }
            });
            
            // 设置可访问性
            newHeader.setAttribute('tabindex', '0');
            newHeader.setAttribute('role', 'button');
            newHeader.setAttribute('aria-expanded', newHeader.parentElement.classList.contains('active') ? 'true' : 'false');
        });
        
        // 默认展开第一个折叠栏
        const firstAccordion = document.querySelector('.accordion-item');
        if (firstAccordion && !firstAccordion.classList.contains('active')) {
            this.toggleAccordion(firstAccordion);
        }
    }
    
    // 处理折叠栏点击
    handleAccordionClick(e) {
        const header = e.currentTarget;
        const accordionItem = header.parentElement;
        this.toggleAccordion(accordionItem);
        
        // 更新ARIA属性
        const isExpanded = accordionItem.classList.contains('active');
        header.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }
    
    // 切换折叠栏状态
    toggleAccordion(accordionItem) {
        const content = accordionItem.querySelector('.accordion-content');
        const icon = accordionItem.querySelector('.accordion-icon');
        
        // 切换当前折叠栏
        const isActive = accordionItem.classList.contains('active');
        
        if (isActive) {
            accordionItem.classList.remove('active');
            if (content) {
                content.style.display = 'none';
                content.style.height = '0';
                content.style.opacity = '0';
            }
            if (icon) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        } else {
            accordionItem.classList.add('active');
            if (content) {
                content.style.display = 'block';
                // 使用setTimeout确保transition生效
                setTimeout(() => {
                    content.style.height = 'auto';
                    content.style.opacity = '1';
                }, 10);
            }
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        }
    }
    
    // 初始化角色属性弹窗事件
    initializeCharacterModalEvents() {
        const characterModal = document.getElementById('character-modal');
        const closeCharacterBtn = document.querySelector('.close-character-btn');
        const resetCharacterBtn = document.getElementById('reset-character');
        const characterForm = document.getElementById('character-form');
        
        if (closeCharacterBtn) {
            closeCharacterBtn.addEventListener('click', () => {
                this.hideCharacterModal();
            });
        }
        
        if (characterModal) {
            characterModal.addEventListener('click', (e) => {
                if (e.target === characterModal) {
                    this.hideCharacterModal();
                }
            });
        }
        
        if (resetCharacterBtn) {
            resetCharacterBtn.addEventListener('click', () => {
                this.resetCharacterAttributes();
            });
        }
        
        if (characterForm) {
            characterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCharacterAttributes();
            });
        }
        
        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && characterModal && characterModal.style.display === 'flex') {
                this.hideCharacterModal();
            }
        });
    }
    
    // 显示角色属性弹窗
    showCharacterModal() {
        const characterModal = document.getElementById('character-modal');
        if (!characterModal) return;
        
        // 设置当前值
        document.getElementById('character-strength').value = this.characterStrength;
        document.getElementById('character-endurance').value = this.characterEndurance;
        
        characterModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    // 隐藏角色属性弹窗
    hideCharacterModal() {
        const characterModal = document.getElementById('character-modal');
        if (characterModal) {
            characterModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // 重置角色属性
    resetCharacterAttributes() {
        document.getElementById('character-strength').value = 5;
        document.getElementById('character-endurance').value = 5;
    }
    
    // 保存角色属性
    saveCharacterAttributes() {
        const strength = parseInt(document.getElementById('character-strength').value) || 5;
        const endurance = parseInt(document.getElementById('character-endurance').value) || 5;
        
        // 验证输入
        if (strength < 1 || strength > 20) {
            this.showStatus('力量值必须在1-20之间', 'error');
            return;
        }
        
        if (endurance < 1 || endurance > 20) {
            this.showStatus('耐性值必须在1-20之间', 'error');
            return;
        }
        
        this.characterStrength = strength;
        this.characterEndurance = endurance;
        
        // 保存到localStorage
        this.saveCharacterAttributesToStorage();
        
        // 重新渲染计算器以更新负重状态
        this.renderCalculator();
        
        // 隐藏弹窗
        this.hideCharacterModal();
        
        this.showStatus('角色属性已更新', 'success');
    }
    
    // 从localStorage加载角色力量
    loadCharacterStrength() {
        try {
            const stored = localStorage.getItem('character-strength');
            return stored ? parseInt(stored) : 5;
        } catch (error) {
            console.warn('加载角色力量失败，使用默认值:', error);
            return 5;
        }
    }
    
    // 从localStorage加载角色耐性
    loadCharacterEndurance() {
        try {
            const stored = localStorage.getItem('character-endurance');
            return stored ? parseInt(stored) : 5;
        } catch (error) {
            console.warn('加载角色耐性失败，使用默认值:', error);
            return 5;
        }
    }
    
    // 保存角色属性到localStorage
    saveCharacterAttributesToStorage() {
        try {
            localStorage.setItem('character-strength', this.characterStrength);
            localStorage.setItem('character-endurance', this.characterEndurance);
        } catch (error) {
            console.warn('保存角色属性失败:', error);
        }
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
    
    // 检查物品是否在计算器中
    isInCalculator(itemId, mode) {
        return this.calculatorItems.some(item => item.id == itemId && item.mode === mode);
    }
    
    // 获取计算器中的物品数量
    getCalculatorQuantity(itemId, mode) {
        const item = this.calculatorItems.find(i => i.id == itemId && i.mode === mode);
        return item ? item.quantity : 0;
    }
    
    // 添加物品到计算器
    addItem(item, mode, selectedLevel = 1) {
        // 检查是否已存在（技艺不可重复购买）
        const existingItem = this.calculatorItems.find(i => i.id == item.id && i.mode === mode);
        
        if (existingItem) {
            if (mode === 'items') {
                existingItem.quantity += 1;
            } else {
                // 技艺模式：如果已存在且等级不同，则更新等级
                if (existingItem.currentLevel !== selectedLevel) {
                    existingItem.currentLevel = selectedLevel;
                    this.showStatus(`${item.name} 等级已更新为 ${selectedLevel}`, 'success');
                } else {
                    // 相同等级的技艺不可重复购买
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
        
        if (!existingItem || mode === 'items') {
            this.showStatus(`已添加 ${item.name} 到计算器`, 'success');
        }
    }
    
    // 从计算器移除物品
    removeFromCalculator(itemId, mode) {
        this.calculatorItems = this.calculatorItems.filter(item => !(item.id == itemId && item.mode === mode));
        this.saveCalculatorItems();
        this.renderCalculator();
    }
    
    // 更新计算器物品数量
    updateQuantity(itemId, mode, newQuantity) {
        const item = this.calculatorItems.find(i => i.id == itemId && i.mode === mode);
        if (!item) return;
        
        // 确保数量是正整数
        newQuantity = parseInt(newQuantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
            newQuantity = 0;
        }
        
        if (newQuantity === 0) {
            this.removeFromCalculator(itemId, mode);
        } else {
            item.quantity = newQuantity;
            this.saveCalculatorItems();
            this.renderCalculator();
        }
    }
    
    // 更新技艺等级
    updateLevel(itemId, newLevel) {
        const item = this.calculatorItems.find(i => i.id == itemId && i.mode === 'specialties');
        if (!item) return;
        
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
        // 分离物品和技艺
        const items = this.calculatorItems.filter(item => item.mode === 'items');
        const specialties = this.calculatorItems.filter(item => item.mode === 'specialties');
        
        // 更新计数
        const itemsCount = document.getElementById('items-count');
        const specialtiesCount = document.getElementById('specialties-count');
        
        if (itemsCount) itemsCount.textContent = items.length;
        if (specialtiesCount) specialtiesCount.textContent = specialties.length;
        
        // 渲染物品列表
        this.renderItemList(items);
        
        // 渲染技艺列表
        this.renderSpecialtyList(specialties);
        
        // 更新总计
        this.updateSummary(items, specialties);
        
        // 重新绑定折叠栏事件（确保事件正确绑定）
        this.initializeAccordionEvents();
    }
    
    // 渲染物品列表
    renderItemList(items) {
        const container = document.getElementById('calculator-items');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无购买的物品</div>';
            return;
        }
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'calculator-item';
            itemElement.dataset.id = item.id;
            
            this.renderItemElement(itemElement, item);
            container.appendChild(itemElement);
        });
    }
    
    // 渲染技艺列表
    renderSpecialtyList(specialties) {
        const container = document.getElementById('calculator-specialties');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (specialties.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无学习的技艺</div>';
            return;
        }
        
        specialties.forEach(specialty => {
            const specialtyElement = document.createElement('div');
            specialtyElement.className = 'calculator-item';
            specialtyElement.dataset.id = specialty.id;
            
            this.renderSpecialtyElement(specialtyElement, specialty);
            container.appendChild(specialtyElement);
        });
    }
    
    // 渲染物品元素
    renderItemElement(container, item) {
        const itemCost = item.cost * item.quantity;
        const itemWeight = item.weight * item.quantity;
        
        container.innerHTML = `
            <div class="calculator-item-header">
                <div class="calculator-item-name">${this.escapeHtml(item.name)}</div>
                <div class="calculator-item-tags">
                    ${item.tags ? item.tags.map(tag => `<span class="calculator-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                </div>
            </div>
            <div class="calculator-item-details">
                <div class="calculator-item-description">${this.formatDescription(this.escapeHtml(item.description || ''))}</div>
                <div class="calculator-item-controls">
                    <div class="quantity-control">
                        <label>数量:</label>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="0" data-id="${item.id}" data-mode="items">
                    </div>
                    <span class="calculator-item-cost">${this.formatCurrency(itemCost, 'items')}</span>
                    <span class="calculator-item-weight">重量: ${itemWeight}</span>
                    <button class="btn-danger remove-btn" data-id="${item.id}" data-mode="items">删除</button>
                </div>
            </div>
        `;
        
        // 添加事件监听器
        const quantityInput = container.querySelector('.quantity-input');
        quantityInput.addEventListener('change', (e) => {
            const itemId = e.target.dataset.id;
            const newQuantity = parseInt(e.target.value);
            this.updateQuantity(itemId, 'items', newQuantity);
        });
        
        quantityInput.addEventListener('blur', (e) => {
            const itemId = e.target.dataset.id;
            const newQuantity = parseInt(e.target.value);
            this.updateQuantity(itemId, 'items', newQuantity);
        });
        
        const removeBtn = container.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = e.target.dataset.id;
            this.removeFromCalculator(itemId, 'items');
        });
    }
    
    // 渲染技艺元素
    renderSpecialtyElement(container, specialty) {
        // 获取当前等级的描述和成本
        const currentLevel = specialty.currentLevel || 1;
        
        // 构建等级选择器选项
        const levelOptions = [];
        for (let i = 1; i <= specialty.level; i++) {
            levelOptions.push(`<option value="${i}" ${i === currentLevel ? 'selected' : ''}>${i}</option>`);
        }
        
        container.innerHTML = `
            <div class="calculator-item-header">
                <div class="calculator-item-name">${this.escapeHtml(specialty.name)}</div>
                <div class="calculator-item-tags">
                    ${specialty.tag ? specialty.tag.map(tag => `<span class="calculator-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                </div>
            </div>
            <div class="calculator-item-details">
                <div class="calculator-item-description">
                    ${this.formatDescription(this.escapeHtml(specialty.description || ''))}
                </div>
                <div class="calculator-item-controls">
                    <div class="level-control">
                        <label>等级:</label>
                        <select class="level-select" data-id="${specialty.id}">
                            ${levelOptions.join('')}
                        </select>
                        <span class="level-display">/${specialty.level}</span>
                    </div>
                    <span class="calculator-item-cost">消耗: ${this.getSpecialtyCost(specialty, currentLevel)} 技艺点</span>
                    <button class="btn-danger remove-btn" data-id="${specialty.id}" data-mode="specialties">删除</button>
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
            this.removeFromCalculator(itemId, 'specialties');
        });
    }
    
    // 获取技艺成本（根据等级）
    getSpecialtyCost(specialty, currentLevel) {
        if (!specialty.cost) return 0;
        
        if (Array.isArray(specialty.cost)) {
            const levelIndex = currentLevel - 1;
            if (levelIndex >= 0 && levelIndex < specialty.cost.length) {
                return specialty.cost[levelIndex];
            } else if (specialty.cost.length > 0) {
                return specialty.cost[0];
            } else {
                return 0;
            }
        }
        
        return specialty.cost;
    }
    
    // 更新总计
    updateSummary(items, specialties) {
        // 计算总消耗
        let totalCopperCost = 0;  // 铜币总消耗
        let totalSpecialtyCost = 0; // 技艺点总消耗
        let totalWeight = 0;
        
        // 计算物品总消耗和总重量
        items.forEach(item => {
            totalCopperCost += (item.cost || 0) * item.quantity;
            totalWeight += (item.weight || 0) * item.quantity;
        });
        
        // 计算技艺总消耗（技艺点）
        specialties.forEach(specialty => {
            const currentLevel = specialty.currentLevel || 1;
            totalSpecialtyCost += this.getSpecialtyCost(specialty, currentLevel);
        });
        
        // 计算负重状态
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
        
        // 更新负重显示
        const weightSummary = document.getElementById('weight-summary');
        const weightStatusBadge = document.getElementById('weight-status-badge');
        const totalSpecialtyCostElement = document.getElementById('total-specialty-cost');
        
        if (weightSummary) {
            weightSummary.innerHTML = `
                <span style="font-size: 1.4rem; font-weight: bold;">${totalWeight}</span>
                <span style="font-size: 0.9rem; color: var(--text-light);">/${carryCapacity}</span>
            `;
        }
        
        if (totalSpecialtyCostElement) {
            totalSpecialtyCostElement.innerHTML = `
                <span style="font-size: 1.4rem; font-weight: bold;">${totalSpecialtyCost}</span>
                <span style="font-size: 0.9rem; color: var(--text-light);"> 点</span>
            `;
        }
        
        if (weightStatusBadge) {
            weightStatusBadge.textContent = statusText;
            weightStatusBadge.className = 'weight-status-badge ' + statusClass;
        }
        
        // 返回总消耗信息，供其他函数使用
        return {
            copperCost: totalCopperCost,
            specialtyCost: totalSpecialtyCost,
            weight: totalWeight
        };
    }
    
    // 清空计算器
    clearCalculator() {
        this.calculatorItems = [];
        this.saveCalculatorItems();
        this.renderCalculator();
        
        this.showStatus('计算器已清空', 'success');
    }
    
    // 下载计算器清单
    downloadCalculatorData() {
        const items = this.calculatorItems.filter(item => item.mode === 'items');
        const specialties = this.calculatorItems.filter(item => item.mode === 'specialties');
        
        if (items.length === 0 && specialties.length === 0) {
            this.showStatus('计算器为空，无法下载', 'warning');
            return;
        }
        
        let content = '';
        let totalCopperCost = 0;
        let totalSpecialtyCost = 0;
        let totalWeight = 0;
        const timestamp = new Date().toLocaleString('zh-CN');
        
        // 添加标题
        content += `统一计算器清单\n`;
        content += `生成时间: ${timestamp}\n`;
        content += `角色属性: 力量 ${this.characterStrength}, 耐性 ${this.characterEndurance}\n`;
        content += '='.repeat(50) + '\n\n';
        
        // 添加物品列表
        if (items.length > 0) {
            content += `物品列表 (${items.length}个):\n`;
            content += '-'.repeat(50) + '\n';
            
            items.forEach((item, index) => {
                const itemCost = (item.cost || 0) * item.quantity;
                const itemWeight = (item.weight || 0) * item.quantity;
                totalCopperCost += itemCost;
                totalWeight += itemWeight;
                
                content += `${index + 1}. ${item.name}\n`;
                content += `   数量: ${item.quantity}\n`;
                content += `   单价: ${this.formatCurrencyForDownload(item.cost || 0)}\n`;
                content += `   总价: ${this.formatCurrencyForDownload(itemCost)} (${item.cost || 0} × ${item.quantity})\n`;
                content += `   重量: ${itemWeight}\n`;
                
                // 添加物品描述
                if (item.description) {
                    // 清理描述中的HTML标签
                    const cleanDesc = item.description.replace(/<[^>]*>/g, '');
                    content += `   描述: ${cleanDesc}\n`;
                }
                
                if (item.tags && item.tags.length > 0) {
                    content += `   标签: ${item.tags.join(', ')}\n`;
                }
                if (item.need && item.need.length > 0) {
                    content += `   需求: ${item.need.join(', ')}\n`;
                }
                
                content += '\n';
            });
        }
        
        // 添加技艺列表
        if (specialties.length > 0) {
            content += `技艺列表 (${specialties.length}个):\n`;
            content += '-'.repeat(50) + '\n';
            
            specialties.forEach((specialty, index) => {
                const currentLevel = specialty.currentLevel || 1;
                const specialtyCost = this.getSpecialtyCost(specialty, currentLevel);
                const specialtyDescription = this.getSpecialtyDescription(specialty, currentLevel);
                
                totalSpecialtyCost += specialtyCost;
                
                content += `${index + 1}. ${specialty.name}\n`;
                content += `   等级: ${currentLevel}/${specialty.level}\n`;
                content += `   消耗: ${specialtyCost} 技艺点\n`;
                
                // 显示所有等级的成本
                if (Array.isArray(specialty.cost)) {
                    content += `   所有等级成本: ${specialty.cost.join('/')}\n`;
                }
                
                if (specialty.tag && specialty.tag.length > 0) {
                    content += `   标签: ${specialty.tag.join(', ')}\n`;
                }
                if (specialty.need && specialty.need.length > 0) {
                    content += `   需求: ${specialty.need.join(', ')}\n`;
                }
                
                // 显示描述
                const cleanDescription = specialtyDescription
                    .replace(/<[^>]*>/g, '')
                    .replace(/\{([^}]+)\}/g, (match, content) => {
                        if (content.includes('/')) {
                            const parts = content.split('/');
                            const levelIndex = currentLevel - 1;
                            if (levelIndex >= 0 && levelIndex < parts.length) {
                                return parts[levelIndex];
                            }
                        }
                        return content;
                    });
                
                content += `   效果: ${cleanDescription}\n`;
                
                content += '\n';
            });
        }
        
        // 添加总计
        content += '总计:\n';
        content += '-'.repeat(50) + '\n';
        content += `铜币总消耗: ${this.formatCurrencyForDownload(totalCopperCost)}\n`;
        content += `技艺点总消耗: ${totalSpecialtyCost} 点\n`;
        
        if (items.length > 0) {
            content += `总重量: ${totalWeight}\n`;
            
            const carryCapacity = 20 + this.characterStrength + (this.characterEndurance * 3);
            const carryPercentage = totalWeight / carryCapacity;
            
            let carryStatus = '';
            if (carryPercentage <= 0.25) carryStatus = '轻快';
            else if (carryPercentage <= 0.5) carryStatus = '正常';
            else if (carryPercentage <= 1) carryStatus = '缓慢';
            else carryStatus = '超重';
            
            content += `负重状态: ${carryStatus}\n`;
            content += `负重容量: ${carryCapacity} (当前 ${totalWeight}/${carryCapacity})\n`;
        }
        
        content += `物品数量: ${items.length}\n`;
        content += `技艺数量: ${specialties.length}\n`;
        
        // 创建并下载文件
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const fileName = `calculator_${Date.now()}.txt`;
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showStatus(`已下载清单: ${fileName}`, 'success');
    }
    
    // 获取技艺描述（根据等级）
    getSpecialtyDescription(specialty, currentLevel) {
        if (!specialty.description) return '';
        
        // 如果description是数组，根据等级获取对应描述
        if (Array.isArray(specialty.description)) {
            const levelIndex = currentLevel - 1;
            if (levelIndex >= 0 && levelIndex < specialty.description.length) {
                return specialty.description[levelIndex];
            } else if (specialty.description.length > 0) {
                return specialty.description[0];
            } else {
                return '';
            }
        }
        
        // 如果不是数组，直接返回
        return specialty.description;
    }
    
    // 货币格式化 - 修复版：区分物品和技艺
    formatCurrency(copper, mode = 'items') {
        if (mode === 'specialties') {
            // 技艺点直接显示
            return `${copper} 技艺点`;
        }
        
        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const copperRemainder = copper % 100;
        
        let result = [];
        if (gold > 0) result.push(`${gold}金币`);
        if (silver > 0) result.push(`${silver}银币`);
        if (copperRemainder > 0 || result.length === 0) result.push(`${copperRemainder}铜币`);
        
        return result.join(' ');
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
    
    // HTML转义函数
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 格式化描述（处理CSV中的换行符和{}内容）
    formatDescription(text) {
        if (!text) return '';
        
        // 用<br>替换CSV中的换行符（通常是\n）
        let formatted = text.replace(/\n/g, '<br>');
        
        // 加粗{}中的内容
        formatted = formatted.replace(/\{([^}]+)\}/g, '<strong>$1</strong>');
        
        return formatted;
    }
    
    // 显示状态消息
    showStatus(message, type) {
        // 使用数据状态区域显示消息
        const statusElement = document.getElementById('data-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'data-status';
            
            if (type === 'success') {
                statusElement.classList.add('success');
            } else if (type === 'error') {
                statusElement.classList.add('error');
            } else if (type === 'warning') {
                statusElement.classList.add('warning');
            } else if (type === 'loading') {
                statusElement.classList.add('loading');
            }
            
            // 3秒后自动清除
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.className = 'data-status';
                    statusElement.textContent = '';
                }
            }, 3000);
        }
    }
}
