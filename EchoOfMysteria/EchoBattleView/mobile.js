// 移动端特有功能
class MobileApp {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.selectedCharacter = null;
        this.editingCharacter = null;
        this.editingTeam = null;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // 模态框
        this.characterModal = document.getElementById('character-modal');
        this.teamModal = document.getElementById('team-modal');
        this.batchMoveModal = document.getElementById('batch-move-modal');
        
        // 表单
        this.characterForm = document.getElementById('character-form');
        this.teamForm = document.getElementById('team-form');
        
        // 按钮
        this.clearAllBtn = document.getElementById('clear-all-btn');
        this.editCharacterBtn = document.getElementById('edit-character-btn');
        this.moveCharacterBtn = document.getElementById('move-character-btn');
        this.deleteCharacterBtn = document.getElementById('delete-character-btn');
        this.cancelActionBtn = document.getElementById('cancel-action-btn');
        this.confirmBatchMoveBtn = document.getElementById('confirm-batch-move-btn');
        
        // 其他元素
        this.closeModalBtns = document.querySelectorAll('.close-modal, .cancel-btn');
        this.roundInput = document.getElementById('round-input');
        this.dicePoolsContainer = document.getElementById('dice-pools');
        this.battleCharactersContainer = document.getElementById('battle-characters');
        this.teamGroupsContainer = document.getElementById('team-groups');
        this.navBtns = document.querySelectorAll('.nav-btn');
        this.viewContainers = document.querySelectorAll('.view-container');
        this.actionBar = document.getElementById('action-bar');
        this.targetTeamSelect = document.getElementById('target-team-select');
        this.newTeamBox = document.getElementById('new-team-box');
        this.newDicePoolBox = document.getElementById('new-dice-pool-box');
        
        // 初始化时立即渲染默认队伍
        this.renderTeamView();
    }

    attachEventListeners() {
        // 按钮事件
        this.clearAllBtn.addEventListener('click', () => this.clearAllData());
        this.editCharacterBtn.addEventListener('click', () => this.editSelectedCharacter());
        this.moveCharacterBtn.addEventListener('click', () => this.moveSelectedCharacter());
        this.deleteCharacterBtn.addEventListener('click', () => this.deleteSelectedCharacter());
        this.cancelActionBtn.addEventListener('click', () => this.hideActionBar());
        this.confirmBatchMoveBtn.addEventListener('click', () => this.performMove());
        
        // 导航事件
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const viewId = btn.getAttribute('data-view');
                this.switchView(viewId, btn);
            });
        });
        
        // 模态框事件
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        
        this.characterForm.addEventListener('submit', (e) => this.handleCharacterSubmit(e));
        this.teamForm.addEventListener('submit', (e) => this.handleTeamSubmit(e));
        
        // 其他事件
        this.roundInput.addEventListener('change', () => this.saveToLocalStorage());
        this.newTeamBox.addEventListener('click', () => this.showTeamModal());
        this.newDicePoolBox.addEventListener('click', () => this.addDicePool());
    }

    // 视图切换
    switchView(viewId, btn) {
        this.viewContainers.forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(viewId).classList.add('active');
        
        this.navBtns.forEach(navBtn => {
            navBtn.classList.remove('active');
        });
        btn.classList.add('active');
        
        this.hideActionBar();
    }

    // 角色相关方法
    showCharacterModal(teamId = 'team1', character = null) {
        this.editingCharacter = character;
        document.getElementById('character-modal-title').textContent = character ? '编辑角色' : '新建角色';
        document.getElementById('character-team-id').value = teamId;
        
        if (character) {
            document.getElementById('character-id').value = character.id;
            document.getElementById('character-name').value = character.name;
            document.getElementById('character-speed').value = character.speed;
            document.getElementById('character-reason').value = character.reason;
            document.getElementById('character-effect').value = character.effect;
            document.getElementById('character-stamina').value = character.stamina || 0;
            document.getElementById('character-hp').value = character.hp;
            document.getElementById('character-hp-max').value = character.hpMax;
            document.getElementById('character-mp').value = character.mp;
            document.getElementById('character-mp-max').value = character.mpMax;
            document.getElementById('character-sanity').value = character.sanity;
            document.getElementById('character-sanity-max').value = character.sanityMax;
            document.getElementById('character-description').value = character.description;
        } else {
            this.characterForm.reset();
        }
        
        this.characterModal.style.display = 'flex';
    }

    handleCharacterSubmit(e) {
        e.preventDefault();
        
        const teamId = document.getElementById('character-team-id').value;
        const formData = {
            name: document.getElementById('character-name').value,
            speed: document.getElementById('character-speed').value,
            reason: document.getElementById('character-reason').value,
            effect: document.getElementById('character-effect').value,
            stamina: document.getElementById('character-stamina').value,
            hp: document.getElementById('character-hp').value,
            hpMax: document.getElementById('character-hp-max').value,
            mp: document.getElementById('character-mp').value,
            mpMax: document.getElementById('character-mp-max').value,
            sanity: document.getElementById('character-sanity').value,
            sanityMax: document.getElementById('character-sanity-max').value,
            description: document.getElementById('character-description').value
        };

        if (this.editingCharacter) {
            this.dataManager.updateCharacter(this.editingCharacter.id, formData);
        } else {
            this.dataManager.createCharacter(formData, teamId);
        }
        
        this.characterModal.style.display = 'none';
        this.renderAllViews();
        this.saveToLocalStorage();
    }

    editSelectedCharacter() {
        if (this.selectedCharacter) {
            const character = this.dataManager.data.characters.find(c => c.id === this.selectedCharacter);
            if (character) {
                this.showCharacterModal(character.teamId, character);
            }
            this.hideActionBar();
        }
    }

    // 队伍相关方法
    showTeamModal(team = null) {
        this.editingTeam = team;
        document.getElementById('team-modal-title').textContent = team ? '编辑队伍' : '新建队伍';
        
        if (team) {
            document.getElementById('team-id').value = team.id;
            document.getElementById('team-name').value = team.name;
        } else {
            document.getElementById('team-name').value = '';
        }
        
        this.teamModal.style.display = 'flex';
    }

    handleTeamSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('team-name').value;
        
        if (this.editingTeam) {
            this.dataManager.updateTeam(this.editingTeam.id, name);
        } else {
            this.dataManager.createTeam(name);
        }
        
        this.teamModal.style.display = 'none';
        this.renderTeamView();
        this.saveToLocalStorage();
    }

    editTeam(teamId) {
        const team = this.dataManager.data.teams.find(t => t.id === teamId);
        if (team) {
            this.showTeamModal(team);
        }
    }

    deleteTeam(teamId) {
        const team = this.dataManager.data.teams.find(t => t.id === teamId);
        if (!team) return;

        if (confirm(`确定要删除队伍 ${team.name} 吗？此操作将同时删除队伍中的所有角色！`)) {
            // 先删除队伍中的所有角色
            team.characters.forEach(character => {
                this.dataManager.deleteCharacter(character.id);
            });

            this.dataManager.deleteTeam(teamId);
            this.renderTeamView();
            this.saveToLocalStorage();
        }
    }

    // 角色选择操作
    selectCharacter(characterId, element) {
        if (this.selectedCharacter === characterId) {
            this.selectedCharacter = null;
            element.classList.remove('selected');
            this.hideActionBar();
        } else {
            document.querySelectorAll('.battle-character.selected, .team-character.selected').forEach(el => {
                el.classList.remove('selected');
            });
            
            this.selectedCharacter = characterId;
            element.classList.add('selected');
            this.showActionBar();
        }
    }

    showActionBar() {
        this.actionBar.classList.add('active');
    }

    hideActionBar() {
        this.actionBar.classList.remove('active');
        this.selectedCharacter = null;
        
        document.querySelectorAll('.battle-character.selected, .team-character.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }

    moveSelectedCharacter() {
        if (this.selectedCharacter) {
            this.showMoveCharacterModal(this.selectedCharacter);
            this.hideActionBar();
        }
    }

    deleteSelectedCharacter() {
        if (this.selectedCharacter) {
            this.deleteCharacter(this.selectedCharacter);
            this.hideActionBar();
        }
    }

    showMoveCharacterModal(characterId) {
        this.targetTeamSelect.innerHTML = '';
        this.dataManager.data.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            this.targetTeamSelect.appendChild(option);
        });
        
        this.targetTeamSelect.setAttribute('data-character-id', characterId);
        this.batchMoveModal.style.display = 'flex';
    }

    performMove() {
        const targetTeamId = this.targetTeamSelect.value;
        const characterId = this.targetTeamSelect.getAttribute('data-character-id');
        
        if (this.dataManager.moveCharacter(characterId, targetTeamId)) {
            this.renderAllViews();
            this.batchMoveModal.style.display = 'none';
        } else {
            alert('目标队伍不存在');
        }
    }

    // 渲染方法
    renderAllViews() {
        this.renderBattleView();
        this.renderTeamView();
        this.renderDicePools();
    }

    renderBattleView() {
        const allCharacters = this.dataManager.getAllCharactersSorted();
        this.battleCharactersContainer.innerHTML = '';

        if (allCharacters.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = '暂无角色';
            this.battleCharactersContainer.appendChild(emptyState);
            return;
        }

        allCharacters.forEach(character => {
            const characterElement = this.createBattleCharacterElement(character);
            this.battleCharactersContainer.appendChild(characterElement);
        });
    }

    createBattleCharacterElement(character) {
        const characterElement = document.createElement('div');
        characterElement.className = 'battle-character';
        if (this.selectedCharacter === character.id) {
            characterElement.classList.add('selected');
        }

        // 计算百分比
        const totalHp = (character.hpMax || 0) + (character.stamina || 0);
        const hpPercent = totalHp > 0 ? Math.min(100, (character.hp / totalHp) * 100) : 0;
        const staminaPercent = totalHp > 0 ? Math.min(100, ((character.stamina || 0) / totalHp) * 100) : 0;
        const mpPercent = character.mpMax > 0 ? Math.min(100, (character.mp / character.mpMax) * 100) : 0;
        const sanityPercent = character.sanityMax > 0 ? Math.min(100, (character.sanity / character.sanityMax) * 100) : 0;

        const hpDisplay = character.stamina > 0 ? 
            `${character.hp}<span class="stamina-part">+${character.stamina}</span>` : 
            `${character.hp}`;

        const teamClass = character.teamId === 'team1' ? 'team1' : 'team2';

        characterElement.innerHTML = `
            <div class="battle-character-info">
                <div class="battle-speed">${character.speed}</div>
                <div class="battle-team ${teamClass}">${character.teamName}</div>
                <div class="battle-hp">${hpDisplay}</div>
                <div class="battle-reason">${character.reason}</div>
                <div class="battle-name">${character.name}</div>
                <div class="battle-effect">${character.effect || '无状态效果'}</div>
            </div>
            <div class="battle-bars">
                <div class="hp-stamina-container">
                    <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
                    <div class="stamina-bar-fill" style="width: ${staminaPercent}%; left: ${hpPercent}%"></div>
                </div>
                <div class="dual-bars">
                    <div class="dual-bar-container">
                        <div class="dual-bar-value sanity-value">${character.sanity}</div>
                        <div class="dual-bar-fill">
                            <div class="stat-bar-fill sanity-bar" style="width: ${sanityPercent}%"></div>
                        </div>
                    </div>
                    <div class="dual-bar-container">
                        <div class="dual-bar-value mp-value">${character.mp}</div>
                        <div class="dual-bar-fill">
                            <div class="stat-bar-fill mp-bar" style="width: ${mpPercent}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        characterElement.addEventListener('click', () => {
            this.selectCharacter(character.id, characterElement);
        });

        return characterElement;
    }

    renderTeamView() {
        this.teamGroupsContainer.innerHTML = '';
        
        // 确保默认队伍始终显示
        this.dataManager.data.teams.forEach(team => {
            const teamGroup = this.createTeamGroupElement(team);
            this.teamGroupsContainer.appendChild(teamGroup);
        });
    }

    createTeamGroupElement(team) {
        const teamGroup = document.createElement('div');
        teamGroup.className = 'team-group';
        
        const teamHeader = document.createElement('div');
        teamHeader.className = 'team-header';
        
        let actionsHTML = '';
        if (team.id !== 'team1' && team.id !== 'team2') {
            actionsHTML = `
                <div class="team-actions">
                    <button class="team-action-btn edit-team-btn" data-team-id="${team.id}">✏️</button>
                    <button class="team-action-btn delete-team-btn" data-team-id="${team.id}">🗑️</button>
                </div>
            `;
        }
        
        teamHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="team-toggle">${team.expanded ? '▼' : '▶'}</span>
                <span>${team.name}</span>
            </div>
            ${actionsHTML}
        `;

        const toggleBtn = teamHeader.querySelector('.team-toggle');
        toggleBtn.addEventListener('click', () => {
            team.expanded = !team.expanded;
            this.renderTeamView();
        });

        if (team.id !== 'team1' && team.id !== 'team2') {
            const editBtn = teamHeader.querySelector('.edit-team-btn');
            const deleteBtn = teamHeader.querySelector('.delete-team-btn');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTeam(team.id);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTeam(team.id);
            });
        }
        
        teamGroup.appendChild(teamHeader);
        
        if (team.expanded) {
            const teamContent = document.createElement('div');
            teamContent.className = 'team-content';
            
            if (team.characters.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.textContent = '暂无角色';
                teamContent.appendChild(emptyState);
            } else {
                team.characters.forEach(character => {
                    const characterElement = this.createTeamCharacterElement(character);
                    teamContent.appendChild(characterElement);
                });
            }
            
            const addCharacterBox = document.createElement('div');
            addCharacterBox.className = 'dashed-box';
            addCharacterBox.textContent = '+ 新建角色';
            addCharacterBox.addEventListener('click', () => {
                this.showCharacterModal(team.id);
            });
            
            teamContent.appendChild(addCharacterBox);
            teamGroup.appendChild(teamContent);
        }
        
        return teamGroup;
    }

    createTeamCharacterElement(character) {
        const characterElement = document.createElement('div');
        characterElement.className = 'team-character';
        if (this.selectedCharacter === character.id) {
            characterElement.classList.add('selected');
        }
        
        const hpDisplay = character.stamina > 0 ? 
            `${character.hp}<span class="stamina-part">+${character.stamina}</span>/${character.hpMax}` : 
            `${character.hp}/${character.hpMax}`;
        
        characterElement.innerHTML = `
            <div class="team-character-info">
                <div class="team-stat-item">
                    <div class="team-stat-label">速度</div>
                    <div class="team-stat-value team-speed">${character.speed}</div>
                </div>
                <div class="team-name">${character.name}</div>
                <div class="team-stat-item">
                    <div class="team-stat-label">体力</div>
                    <div class="team-stat-value team-hp-value">${hpDisplay}</div>
                </div>
                <div class="team-stat-item">
                    <div class="team-stat-label">混乱</div>
                    <div class="team-stat-value team-sanity-value">${character.sanity}/${character.sanityMax}</div>
                </div>
                <div class="team-stat-item">
                    <div class="team-stat-label">魔力</div>
                    <div class="team-stat-value team-mp-value">${character.mp}/${character.mpMax}</div>
                </div>
                <div class="team-stat-item">
                    <div class="team-stat-label">理智</div>
                    <div class="team-stat-value team-reason-value">${character.reason}</div>
                </div>
            </div>
            <div class="team-character-effect">${character.effect || '无状态效果'}</div>
        `;
        
        characterElement.addEventListener('click', () => {
            this.selectCharacter(character.id, characterElement);
        });
        
        return characterElement;
    }

    // 骰池功能
    addDicePool() {
        const dicePool = this.dataManager.createDicePool();
        this.renderDicePool(dicePool);
        this.saveToLocalStorage();
    }

    renderDicePools() {
        this.dicePoolsContainer.innerHTML = '';
        this.dataManager.data.dicePools.forEach(pool => {
            this.renderDicePool(pool);
        });
    }

    renderDicePool(dicePool, noteValue = '') {
        const poolElement = this.createDicePoolElement(dicePool, noteValue);
        this.dicePoolsContainer.appendChild(poolElement);
    }

    createDicePoolElement(dicePool, noteValue = '') {
        const poolElement = document.createElement('div');
        poolElement.className = 'dice-pool-item';
        poolElement.setAttribute('data-pool-id', dicePool.id);

        if (noteValue) {
            dicePool.note = noteValue;
        }

        let headerHTML = `
            <div class="dice-pool-header">
                <div class="dice-type-selector">
                    <select class="dice-type">
                        <option value="normal" ${dicePool.type === 'normal' ? 'selected' : ''}>常规骰池</option>
                        <option value="sanity" ${dicePool.type === 'sanity' ? 'selected' : ''}>理智骰池</option>
                        <option value="expression" ${dicePool.type === 'expression' ? 'selected' : ''}>解析骰池</option>
                        <option value="judgment" ${dicePool.type === 'judgment' ? 'selected' : ''}>判断骰池</option>
                    </select>
                </div>
                <div class="dice-note">
                    <input type="text" class="dice-note-input" placeholder="骰池备注" value="${dicePool.note || ''}">
                </div>
                <button class="delete-dice-pool" title="删除骰池">🗑️</button>
            </div>
        `;

        let controlsHTML = '';
        
        if (dicePool.type === 'sanity') {
            controlsHTML = `
                <div class="dice-pool-controls">
                    <div class="dice-control-row">
                        <div class="sanity-effect-selector">
                            <select class="sanity-effect">
                                <option value="positive" ${dicePool.effect === 'positive' ? 'selected' : ''}>正面</option>
                                <option value="negative" ${dicePool.effect === 'negative' ? 'selected' : ''}>负面</option>
                            </select>
                        </div>
                        <span>生成</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-count" value="${dicePool.count || 1}" min="1">
                        </div>
                        <span>个从</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-min" value="${dicePool.min || 1}">
                        </div>
                        <span>到</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-max" value="${dicePool.max || 20}">
                        </div>
                        <span>的随机数，理智</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-sanity" value="${dicePool.sanity || 0}" min="-50" max="50">
                        </div>
                    </div>
                    <div class="dice-control-row">
                        <button class="generate-dice">生成</button>
                    </div>
                </div>
            `;
        } else if (dicePool.type === 'expression') {
            controlsHTML = `
                <div class="dice-pool-controls">
                    <div class="dice-control-row">
                        <span>生成</span>
                        <div class="dice-input small">
                            <input type="number" class="expression-count" value="${dicePool.expressionCount || 1}" min="1">
                        </div>
                        <span>#</span>
                        <div class="expression-input">
                            <input type="text" class="dice-expression" value="${dicePool.expression || '1d6'}" placeholder="例如: 2d6+1">
                        </div>
                    </div>
                    <div class="dice-control-row">
                        <button class="generate-dice">生成</button>
                    </div>
                </div>
            `;
        } else if (dicePool.type === 'judgment') {
            controlsHTML = `
                <div class="dice-pool-controls">
                    <div class="dice-control-row">
                        <span>生成</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-count" value="${dicePool.count || 1}" min="1">
                        </div>
                        <span>个从</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-min" value="${dicePool.min || 1}">
                        </div>
                        <span>到</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-max" value="${dicePool.max || 20}">
                        </div>
                        <span>的随机数，与</span>
                        <div class="dice-input small">
                            <input type="number" class="compare-value" value="${dicePool.compareValue || 10}">
                        </div>
                        <span>比较</span>
                    </div>
                    <div class="dice-control-row">
                        <button class="generate-dice">生成</button>
                    </div>
                </div>
            `;
        } else {
            controlsHTML = `
                <div class="dice-pool-controls">
                    <div class="dice-control-row">
                        <span>生成</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-count" value="${dicePool.count || 1}" min="1">
                        </div>
                        <span>个从</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-min" value="${dicePool.min || 1}">
                        </div>
                        <span>到</span>
                        <div class="dice-input small">
                            <input type="number" class="dice-max" value="${dicePool.max || 20}">
                        </div>
                        <span>的随机数</span>
                    </div>
                    <div class="dice-control-row">
                        <button class="generate-dice">生成</button>
                    </div>
                </div>
            `;
        }

        poolElement.innerHTML = headerHTML + controlsHTML + '<div class="dice-results"></div>';
        this.setupDicePoolEvents(poolElement, dicePool);
        
        return poolElement;
    }

    setupDicePoolEvents(poolElement, dicePool) {
        const typeSelector = poolElement.querySelector('.dice-type');
        typeSelector.value = dicePool.type;
        
        typeSelector.addEventListener('change', () => {
            this.dataManager.updateDicePool(dicePool.id, { type: typeSelector.value });
            
            const currentPosition = Array.from(this.dicePoolsContainer.children).indexOf(poolElement);
            const currentNote = poolElement.querySelector('.dice-note-input').value;
            
            poolElement.remove();
            
            if (currentPosition >= 0 && currentPosition < this.dicePoolsContainer.children.length) {
                const nextElement = this.dicePoolsContainer.children[currentPosition];
                this.dicePoolsContainer.insertBefore(
                    this.createDicePoolElement(this.dataManager.data.dicePools.find(p => p.id === dicePool.id), currentNote), 
                    nextElement
                );
            } else {
                this.renderDicePool(this.dataManager.data.dicePools.find(p => p.id === dicePool.id), currentNote);
            }
            
            this.saveToLocalStorage();
        });

        const generateBtn = poolElement.querySelector('.generate-dice');
        generateBtn.addEventListener('click', () => {
            this.generateDicePoolResults(dicePool.id);
            generateBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                generateBtn.style.transform = '';
            }, 100);
        });

        const noteInput = poolElement.querySelector('.dice-note-input');
        noteInput.addEventListener('change', () => {
            this.dataManager.updateDicePool(dicePool.id, { note: noteInput.value });
            this.saveToLocalStorage();
        });

        // 常规骰池事件
        if (dicePool.type === 'normal' || dicePool.type === 'sanity' || dicePool.type === 'judgment') {
            const countInput = poolElement.querySelector('.dice-count');
            countInput.addEventListener('change', () => {
                this.dataManager.updateDicePool(dicePool.id, { count: parseInt(countInput.value) || 1 });
                this.saveToLocalStorage();
            });
            
            const minInput = poolElement.querySelector('.dice-min');
            minInput.addEventListener('change', () => {
                this.dataManager.updateDicePool(dicePool.id, { min: parseInt(minInput.value) || 1 });
                this.saveToLocalStorage();
            });
            
            const maxInput = poolElement.querySelector('.dice-max');
            maxInput.addEventListener('change', () => {
                this.dataManager.updateDicePool(dicePool.id, { max: parseInt(maxInput.value) || 20 });
                this.saveToLocalStorage();
            });
        }
        
        // 理智骰池专用事件
        if (dicePool.type === 'sanity') {
            const sanityInput = poolElement.querySelector('.dice-sanity');
            sanityInput.addEventListener('change', () => {
                this.dataManager.updateDicePool(dicePool.id, { sanity: parseInt(sanityInput.value) || 0 });
                this.saveToLocalStorage();
            });
            
            const effectSelector = poolElement.querySelector('.sanity-effect');
            effectSelector.value = dicePool.effect || 'positive';
            effectSelector.addEventListener('change', () => {
                this.dataManager.updateDicePool(dicePool.id, { effect: effectSelector.value });
                this.saveToLocalStorage();
            });
        }
        
        // 解析骰池专用事件
        if (dicePool.type === 'expression') {
            const countInput = poolElement.querySelector('.expression-count');
            countInput.addEventListener('change', () => {
                this.dataManager.updateDicePool(dicePool.id, { expressionCount: parseInt(countInput.value) || 1 });
                this.saveToLocalStorage();
            });
            
            const expressionInput = poolElement.querySelector('.dice-expression');
            expressionInput.addEventListener('change', () => {
                this.dataManager.updateDicePool(dicePool.id, { expression: expressionInput.value || '1d6' });
                this.saveToLocalStorage();
            });
        }
        
        // 判断骰池专用事件
        if (dicePool.type === 'judgment') {
            const compareInput = poolElement.querySelector('.compare-value');
            compareInput.addEventListener('change', () => {
                this.dataManager.updateDicePool(dicePool.id, { compareValue: parseInt(compareInput.value) || 10 });
                this.saveToLocalStorage();
            });
        }

        const removeBtn = poolElement.querySelector('.delete-dice-pool');
        removeBtn.addEventListener('click', () => {
            this.dataManager.deleteDicePool(dicePool.id);
            poolElement.remove();
            this.saveToLocalStorage();
        });
    }

    generateDicePoolResults(poolId) {
        const dicePool = this.dataManager.data.dicePools.find(p => p.id === poolId);
        if (!dicePool) return;

        const poolElement = document.querySelector(`[data-pool-id="${poolId}"]`);
        if (!poolElement) return;

        const resultsElement = poolElement.querySelector('.dice-results');
        resultsElement.innerHTML = '';

        let results = [];
        try {
            switch (dicePool.type) {
                case 'sanity':
                    results = DiceUtils.generateSanityDicePoolResults(dicePool);
                    break;
                case 'expression':
                    results = DiceUtils.generateExpressionDicePoolResults(dicePool);
                    break;
                case 'judgment':
                    results = DiceUtils.generateJudgmentDicePoolResults(dicePool);
                    break;
                default:
                    results = DiceUtils.generateDicePoolResults(dicePool);
            }

            results.forEach(result => {
                const resultElement = document.createElement('div');
                resultElement.className = `dice-result ${DiceUtils.getDiceResultClass(result, dicePool)}`;
                resultElement.innerHTML = `<span>${result}</span>`;
                resultsElement.appendChild(resultElement);
            });
        } catch (error) {
            const resultElement = document.createElement('div');
            resultElement.className = 'dice-result';
            resultElement.style.color = 'var(--danger-color)';
            resultElement.innerHTML = `<span>错误: ${error.message}</span>`;
            resultsElement.appendChild(resultElement);
        }
    }

    // 工具方法
    deleteCharacter(characterId) {
        const character = this.dataManager.data.characters.find(c => c.id === characterId);
        if (!character) return;

        if (confirm(`确定要删除角色 ${character.name} 吗？`)) {
            this.dataManager.deleteCharacter(characterId);
            this.renderAllViews();
            this.saveToLocalStorage();
        }
    }

    closeModals() {
        this.characterModal.style.display = 'none';
        this.teamModal.style.display = 'none';
        this.batchMoveModal.style.display = 'none';
    }

    clearAllData() {
        if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
            this.dataManager.clearAllData();
            this.roundInput.value = 1;
            this.selectedCharacter = null;
            
            this.renderAllViews();
            this.hideActionBar();
            
            localStorage.removeItem('battleRoundViewData');
        } else {
            // 如果用户取消，重新渲染当前视图以确保数据一致
            this.renderAllViews();
        }
    }

    saveToLocalStorage() {
        this.dataManager.data.round = this.roundInput.value;
        this.dataManager.saveToLocalStorage();
    }

    loadFromLocalStorage() {
        if (this.dataManager.loadFromLocalStorage()) {
            this.roundInput.value = this.dataManager.data.round;
            this.renderAllViews();
            
            this.dicePoolsContainer.innerHTML = '';
            this.dataManager.data.dicePools.forEach(pool => {
                this.renderDicePool(pool);
            });
        } else {
            // 如果没有本地存储数据，确保默认队伍显示
            this.renderTeamView();
        }
    }
}

// 初始化移动应用
document.addEventListener('DOMContentLoaded', () => {
    const dataManager = new DataManager();
    window.mobileApp = new MobileApp(dataManager);
    window.mobileApp.loadFromLocalStorage();
});