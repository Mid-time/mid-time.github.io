// ================================
// 统一计算器模块 - 负责已加入项的管理与汇总（防重复声明）
// ================================
if (typeof UnifiedCalculator === 'undefined') {
    class UnifiedCalculator {
        constructor(itemManager, specialtyManager) {
            this.itemManager = itemManager;
            this.specialtyManager = specialtyManager;

            if (this.itemManager) this.itemManager.setCalculatorModule(this);
            if (this.specialtyManager) this.specialtyManager.setCalculatorModule(this);

            this.calculatorItems = this.loadCalculatorItems(); // 存储对象： { id, mode, quantity, currentLevel, name, cost, weight, ... }

            this.characterStrength = this.loadCharacterStrength();
            this.characterEndurance = this.loadCharacterEndurance();

            this.initializeEventListeners();
            this.renderCalculator();
        }

        initializeEventListeners() {
            const clearBtn = document.getElementById('clear-calculator');
            if (clearBtn) clearBtn.addEventListener('click', () => this.clearCalculator());
            const downloadBtn = document.getElementById('download-calculator');
            if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadCalculatorData());
            const editChar = document.getElementById('edit-character');
            if (editChar) editChar.addEventListener('click', () => this.showCharacterModal());
        }

        loadCharacterStrength() {
            try { const s = localStorage.getItem('character-strength'); return s ? parseInt(s) : 5; } catch { return 5; }
        }
        loadCharacterEndurance() {
            try { const s = localStorage.getItem('character-endurance'); return s ? parseInt(s) : 5; } catch { return 5; }
        }

        saveCharacterAttributesToStorage() {
            try {
                localStorage.setItem('character-strength', this.characterStrength);
                localStorage.setItem('character-endurance', this.characterEndurance);
            } catch (e) { console.warn(e); }
        }

        loadCalculatorItems() {
            try {
                const s = localStorage.getItem('unified-calculator-items');
                return s ? JSON.parse(s) : [];
            } catch (e) { console.warn(e); return []; }
        }

        saveCalculatorItems() {
            try {
                localStorage.setItem('unified-calculator-items', JSON.stringify(this.calculatorItems));
            } catch (e) { console.warn(e); }
        }

        isInCalculator(itemId, mode) {
            return this.calculatorItems.some(i => i.id == itemId && i.mode === mode);
        }

        getCalculatorQuantity(itemId, mode) {
            const it = this.calculatorItems.find(i => i.id == itemId && i.mode === mode);
            return it ? it.quantity : 0;
        }

        addItem(item, mode = 'items', selectedLevel = 1) {
            const existing = this.calculatorItems.find(i => i.id == item.id && i.mode === mode);
            if (existing) {
                if (mode === 'items') {
                    existing.quantity = (existing.quantity || 0) + 1;
                } else {
                    if (existing.currentLevel !== selectedLevel) existing.currentLevel = selectedLevel;
                    else { this.showStatus(`${item.name} 已在计算器中（相同等级）`, 'warning'); return; }
                }
            } else {
                const entry = {
                    id: item.id,
                    mode: mode,
                    name: item.name,
                    quantity: mode === 'items' ? 1 : 0,
                    currentLevel: mode === 'specialties' ? selectedLevel : 0,
                    cost: item.cost,
                    weight: item.weight || 0,
                    raw: item
                };
                if (mode === 'items') entry.quantity = 1;
                this.calculatorItems.push(entry);
            }
            this.saveCalculatorItems();
            this.renderCalculator();
        }

        removeFromCalculator(itemId, mode) {
            this.calculatorItems = this.calculatorItems.filter(i => !(i.id == itemId && i.mode === mode));
            this.saveCalculatorItems();
            this.renderCalculator();
        }

        updateQuantity(itemId, mode, newQuantity) {
            const it = this.calculatorItems.find(i => i.id == itemId && i.mode === mode);
            if (!it) return;
            newQuantity = parseInt(newQuantity) || 0;
            if (newQuantity <= 0) this.removeFromCalculator(itemId, mode);
            else {
                it.quantity = newQuantity;
                this.saveCalculatorItems();
                this.renderCalculator();
            }
        }

        updateLevel(itemId, newLevel) {
            const it = this.calculatorItems.find(i => i.id == itemId && i.mode === 'specialties');
            if (!it) return;
            const max = it.raw && it.raw.level ? it.raw.level : (it.level || 1);
            newLevel = Math.max(1, Math.min(parseInt(newLevel) || 1, max));
            it.currentLevel = newLevel;
            this.saveCalculatorItems();
            this.renderCalculator();
        }

        // 计算并渲染
        renderCalculator() {
            const items = this.calculatorItems.filter(i => i.mode === 'items');
            const specs = this.calculatorItems.filter(i => i.mode === 'specialties');

            // counts
            const itemsCount = document.getElementById('items-count');
            const specsCount = document.getElementById('specialties-count');
            if (itemsCount) itemsCount.textContent = items.length;
            if (specsCount) specsCount.textContent = specs.length;

            this.updateCharacterAttributesDisplay();
            this.renderItemList(items);
            this.renderSpecialtyList(specs);
            this.updateSummary(items, specs);
        }

        renderItemList(items) {
            const container = document.getElementById('calculator-items');
            if (!container) return;
            container.innerHTML = '';
            if (items.length === 0) { container.innerHTML = '<div class="empty-state">暂无购买的物品</div>'; return; }
            items.forEach(it => {
                const el = document.createElement('div');
                el.className = 'calculator-item';
                el.dataset.id = it.id;
                el.innerHTML = `
                    <div class="calculator-item-header">
                        <div class="calculator-item-name">${this.escapeHtml(it.name)}</div>
                    </div>
                    <div class="calculator-item-details">
                        <div class="calculator-item-controls">
                            <div class="quantity-control">
                                <label>数量:</label>
                                <input type="number" class="quantity-input" value="${it.quantity}" min="0" data-id="${it.id}">
                            </div>
                            <span class="calculator-item-cost">${this.formatCurrency((it.cost || 0) * it.quantity, 'items')}</span>
                            <span class="calculator-item-weight">重量: ${(it.weight || 0) * it.quantity}</span>
                            <button class="btn-danger remove-btn" data-id="${it.id}">删除</button>
                        </div>
                    </div>
                `;
                container.appendChild(el);
                const qty = el.querySelector('.quantity-input');
                const rem = el.querySelector('.remove-btn');
                qty.addEventListener('change', (e) => this.updateQuantity(it.id, 'items', parseInt(e.target.value) || 0));
                rem.addEventListener('click', (e) => { e.stopPropagation(); this.removeFromCalculator(it.id, 'items'); });
            });
        }

        renderSpecialtyList(specs) {
            const container = document.getElementById('calculator-specialties');
            if (!container) return;
            container.innerHTML = '';
            if (specs.length === 0) { container.innerHTML = '<div class="empty-state">暂无学习的技艺</div>'; return; }
            specs.forEach(s => {
                const maxLevel = s.raw.level || s.level || 1;
                const levelOptions = [];
                for (let i = 1; i <= maxLevel; i++) levelOptions.push(`<option value="${i}" ${i === s.currentLevel ? 'selected' : ''}>${i}</option>`);
                const costNow = Array.isArray(s.cost) ? (s.cost[s.currentLevel - 1] || s.cost[0]) : s.cost;
                const el = document.createElement('div');
                el.className = 'calculator-item';
                el.dataset.id = s.id;
                el.innerHTML = `
                    <div class="calculator-item-header">
                        <div class="calculator-item-name">${this.escapeHtml(s.name)}</div>
                    </div>
                    <div class="calculator-item-details">
                        <div class="calculator-item-controls">
                            <div class="level-control">
                                <label>等级:</label>
                                <select class="level-select" data-id="${s.id}">${levelOptions.join('')}</select>
                                <span class="level-display">/${maxLevel}</span>
                            </div>
                            <span class="calculator-item-cost">消耗: ${costNow} 技艺点</span>
                            <button class="btn-danger remove-btn" data-id="${s.id}">���除</button>
                        </div>
                    </div>
                `;
                container.appendChild(el);
                const sel = el.querySelector('.level-select');
                const rem = el.querySelector('.remove-btn');
                sel.addEventListener('change', (e) => this.updateLevel(s.id, parseInt(e.target.value) || 1));
                rem.addEventListener('click', (e) => { e.stopPropagation(); this.removeFromCalculator(s.id, 'specialties'); });
            });
        }

        updateSummary(items, specialties) {
            let totalCopperCost = 0;
            let totalSpecialtyCost = 0;
            let totalWeight = 0;

            items.forEach(i => { totalCopperCost += (i.cost || 0) * i.quantity; totalWeight += (i.weight || 0) * i.quantity; });
            specialties.forEach(s => {
                const cur = s.currentLevel || 1;
                const cost = Array.isArray(s.cost) ? (s.cost[cur - 1] || s.cost[0]) : (s.cost || 0);
                totalSpecialtyCost += cost;
            });

            const totalCostEl = document.getElementById('total-cost');
            if (totalCostEl) totalCostEl.textContent = this.formatCurrency(totalCopperCost, 'items');

            const totalSpecEl = document.getElementById('total-specialty-cost');
            if (totalSpecEl) totalSpecEl.textContent = `${totalSpecialtyCost} 点`;

            const carryCapacity = 20 + this.characterStrength + (this.characterEndurance * 3);
            const weightSummary = document.getElementById('weight-summary');
            const weightBadge = document.getElementById('weight-status-badge');
            const carryPercentage = totalWeight / (carryCapacity || 1);
            let statusText = '轻快', statusClass = 'light';
            if (carryPercentage <= 0.25) { statusText = '轻快'; statusClass = 'light'; }
            else if (carryPercentage <= 0.5) { statusText = '正常'; statusClass = 'normal'; }
            else if (carryPercentage <= 1) { statusText = '缓慢'; statusClass = 'heavy'; }
            else { statusText = '超重'; statusClass = 'overloaded'; }

            if (weightSummary) weightSummary.textContent = `${totalWeight}/${carryCapacity}`;
            if (weightBadge) { weightBadge.textContent = statusText; weightBadge.className = 'weight-status-badge ' + statusClass; }

            return { copperCost: totalCopperCost, specialtyCost: totalSpecialtyCost, weight: totalWeight };
        }

        clearCalculator() {
            this.calculatorItems = [];
            this.saveCalculatorItems();
            this.renderCalculator();
            this.showStatus('计算器已清空', 'success');
        }

        downloadCalculatorData() {
            const items = this.calculatorItems.filter(i => i.mode === 'items');
            const specs = this.calculatorItems.filter(i => i.mode === 'specialties');
            if (items.length === 0 && specs.length === 0) { this.showStatus('计算器为空，无法下载', 'warning'); return; }

            let content = `统一计算器清单\n生成时间: ${new Date().toLocaleString('zh-CN')}\n角色属性: 力量 ${this.characterStrength}, 耐性 ${this.characterEndurance}\n\n===============================\n\n`;
            let totalCopper = 0, totalSpec = 0, totalWeight = 0;
            if (items.length) {
                content += `物品列表 (${items.length}):\n`;
                items.forEach((it, idx) => {
                    const cost = (it.cost || 0) * it.quantity;
                    const weight = (it.weight || 0) * it.quantity;
                    totalCopper += cost; totalWeight += weight;
                    content += `${idx+1}. ${it.name}\n   ID:${it.id}\n   数量:${it.quantity}\n   单价:${this.formatCurrencyForDownload(it.cost || 0)}\n   总价:${this.formatCurrencyForDownload(cost)}\n   重量:${weight}\n\n`;
                });
            }
            if (specs.length) {
                content += `技艺列表 (${specs.length}):\n`;
                specs.forEach((s, idx) => {
                    const cur = s.currentLevel || 1;
                    const cost = Array.isArray(s.cost) ? (s.cost[cur - 1] || s.cost[0]) : s.cost || 0;
                    totalSpec += cost;
                    content += `${idx+1}. ${s.name}\n   ID:${s.id}\n   等级:${cur}/${s.raw.level || s.level || 1}\n   消耗:${cost} 技艺点\n\n`;
                });
            }

            content += `\n总计:\n铜币总消耗: ${this.formatCurrencyForDownload(totalCopper)}\n技艺点总消耗: ${totalSpec} 点\n总重量: ${totalWeight}\n`;
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const name = `calculator_${Date.now()}.txt`;
            a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            this.showStatus(`已下载清单: ${name}`, 'success');
        }

        // 工具函数
        formatCurrency(copper, mode = 'items') {
            if (mode === 'specialties') return `${copper} 技艺点`;
            const gold = Math.floor(copper / 10000), silver = Math.floor((copper % 10000) / 100), copperRemainder = Math.floor(copper % 100);
            const parts = [];
            if (gold > 0) parts.push(`${gold}金币`);
            if (silver > 0) parts.push(`${silver}银币`);
            if (copperRemainder > 0 || parts.length === 0) parts.push(`${copperRemainder}铜币`);
            return parts.join(' ');
        }
        formatCurrencyForDownload(copper) { return this.formatCurrency(copper, 'items'); }

        escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

        updateCharacterAttributesDisplay() {
            const s = document.getElementById('strength-value');
            const e = document.getElementById('endurance-value');
            if (s) s.textContent = this.characterStrength;
            if (e) e.textContent = this.characterEndurance;
        }

        showCharacterModal() {
            const m = document.getElementById('character-modal');
            if (!m) return;
            const cs = document.getElementById('character-strength');
            const ce = document.getElementById('character-endurance');
            if (cs) cs.value = this.characterStrength;
            if (ce) ce.value = this.characterEndurance;
            m.style.display = 'flex'; document.body.style.overflow = 'hidden';

            // 绑定保存与重置（一次绑定 - 防止重复）
            const form = document.getElementById('character-form');
            if (form && !form._bound) {
                form.addEventListener('submit', (ev) => {
                    ev.preventDefault();
                    const st = parseInt(document.getElementById('character-strength').value) || 5;
                    const en = parseInt(document.getElementById('character-endurance').value) || 5;
                    this.characterStrength = Math.min(Math.max(st, 1), 20);
                    this.characterEndurance = Math.min(Math.max(en, 1), 20);
                    this.saveCharacterAttributesToStorage();
                    this.updateCharacterAttributesDisplay();
                    this.renderCalculator();
                    this.hideCharacterModal();
                    this.showStatus('角色属性已保存', 'success');
                });
                const resetBtn = document.getElementById('reset-character');
                if (resetBtn) resetBtn.addEventListener('click', () => {
                    document.getElementById('character-strength').value = 5;
                    document.getElementById('character-endurance').value = 5;
                });
                form._bound = true;
            }
        }

        hideCharacterModal() {
            const m = document.getElementById('character-modal');
            if (m) { m.style.display = 'none'; document.body.style.overflow = 'auto'; }
        }

        showStatus(msg, type) {
            const el = document.getElementById('data-status');
            if (!el) return;
            el.textContent = msg; el.className = 'data-status';
            if (type === 'success') el.classList.add('success');
            if (type === 'error') el.classList.add('error');
            if (type === 'warning') el.classList.add('warning');
            setTimeout(() => { if (el.textContent === msg) { el.textContent = ''; el.className = 'data-status'; } }, 3000);
        }
    }

    window.UnifiedCalculator = UnifiedCalculator;
}
