// 桌面端特有功能
class DesktopApp {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.dragCharacter = null;
        this.activeCharacterPanel = null;
        this.batchMode = false;
        this.selectedCharacters = new Set();
        this.longPressTimer = null;
        this.dragThreshold = 10;
        this.isMovingFromPanel = false;
        
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
        this.newCharacterBtn = document.getElementById('new-character-btn');
        this.newTeamBtn = document.getElementById('new-team-btn');
        this.clearAllBtn = document.getElementById('clear-all-btn');
        this.addDicePoolBtn = document.getElementById('add-dice-pool');
        this.batchModeBtn = document.getElementById('batch-mode-btn');
        this.batchCancelBtn = document.getElementById('batch-cancel-btn');
        this.batchMoveBtn = document.getElementById('batch-move-btn');
        this.batchDeleteBtn = document.getElementById('batch-delete-btn');
        this.confirmBatchMoveBtn = document.getElementById('confirm-batch-move-btn');
        
        // 其他元素
        this.closeModalBtns = document.querySelectorAll('.close-modal, .cancel-btn');
        this.roundInput = document.getElementById('round-input');
        this.dicePoolsContainer = document.getElementById('dice-pools');
        this.actionBarCharacters = document.getElementById('action-bar-characters');
        this.batchControls = document.getElementById('batch-controls');
        this.batchSelectionCount = document.getElementById('batch-selection-count');
        this.targetTeamSelect = document.getElementById('target-team-select');
        
        // 队伍容器
        this.teamsContainer = document.querySelector('.teams-container');
    }

    attachEventListeners() {
        // 按钮事件
        this.newCharacterBtn.addEventListener('click', () => this.showCharacterModal());
        this.newTeamBtn.addEventListener('click', () => this.showTeamModal());
        this.clearAllBtn.addEventListener('click', () => this.clearAllData());
        this.addDicePoolBtn.addEventListener('click', () => this.addDicePool());
        
        // 批量操作事件
        this.batchModeBtn.addEventListener('click', () => this.toggleBatchMode());
        this.batchCancelBtn.addEventListener('click', () => this.cancelBatchMode());
        this.batchMoveBtn.addEventListener('click', () => this.showBatchMoveModal());
        this.batchDeleteBtn.addEventListener('click', () => this.batchDeleteCharacters());
        this.confirmBatchMoveBtn.addEventListener('click', () => this.performBatchMove());
        
        // 模态框事件
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        
        this.characterForm.addEventListener('submit', (e) => this.handleCharacterSubmit(e));
        this.teamForm.addEventListener('submit', (e) => this.handleTeamSubmit(e));
        
        // 回合输入事件
        this.roundInput.addEventListener('change', () => this.saveToLocalStorage());
        
        // 队伍标题点击事件（编辑队伍）
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('team-title')) {
                const teamId = e.target.getAttribute('data-team-id');
                if (teamId !== 'team1' && teamId !== 'team2') {
                    this.editTeam(teamId);
                }
            }
        });
    }

    // 角色相关方法
    showCharacterModal(character = null) {
        this.editingCharacter = character;
        document.getElementById('character-modal-title').textContent = character ? '编辑角色' : '新建角色';
        
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
            this.dataManager.createCharacter(formData, 'team1');
        }
        
        this.characterModal.style.display = 'none';
        this.renderAllViews();
        this.saveToLocalStorage();
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

    // 批量操作
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        
        if (this.batchMode) {
            document.body.classList.add('batch-mode');
            this.batchControls.classList.add('active');
            this.batchModeBtn.textContent = '退出批量操作';
            this.updateBatchSelectionCount();
        } else {
            this.cancelBatchMode();
        }
    }

    cancelBatchMode() {
        this.batchMode = false;
        document.body.classList.remove('batch-mode');
        this.batchControls.classList.remove('active');
        this.batchModeBtn.textContent = '批量操作';
        this.selectedCharacters.clear();
        this.updateBatchSelectionCount();
        
        document.querySelectorAll('.character-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    toggleCharacterSelection(characterId) {
        if (this.selectedCharacters.has(characterId)) {
            this.selectedCharacters.delete(characterId);
        } else {
            this.selectedCharacters.add(characterId);
        }
        
        const checkbox = document.querySelector(`.character-checkbox[data-character-id="${characterId}"]`);
        if (checkbox) {
            checkbox.checked = this.selectedCharacters.has(characterId);
        }
        
        this.updateBatchSelectionCount();
    }

    updateBatchSelectionCount() {
        this.batchSelectionCount.textContent = `已选择 ${this.selectedCharacters.size} 个角色`;
    }

    showBatchMoveModal() {
        if (this.selectedCharacters.size === 0) {
            alert('请先选择要移动的角色');
            return;
        }
        
        this.targetTeamSelect.innerHTML = '';
        this.dataManager.data.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            this.targetTeamSelect.appendChild(option);
        });
        
        this.batchMoveModal.style.display = 'flex';
    }

    performBatchMove() {
        const targetTeamId = this.targetTeamSelect.value;
        
        this.selectedCharacters.forEach(characterId => {
            this.dataManager.moveCharacter(characterId, targetTeamId);
        });
        
        this.renderAllViews();
        this.cancelBatchMode();
        this.batchMoveModal.style.display = 'none';
        
        const targetTeam = this.dataManager.data.teams.find(t => t.id === targetTeamId);
        alert(`已将 ${this.selectedCharacters.size} 个角色移动到 ${targetTeam.name}`);
    }

    batchDeleteCharacters() {
        if (this.selectedCharacters.size === 0) {
            alert('请先选择要删除的角色');
            return;
        }
        
        if (confirm(`确定要删除选中的 ${this.selectedCharacters.size} 个角色吗？`)) {
            this.selectedCharacters.forEach(characterId => {
                this.dataManager.deleteCharacter(characterId);
            });
            
            this.renderAllViews();
            this.cancelBatchMode();
        }
    }

    // 渲染方法
    renderAllViews() {
        this.renderTeamView();
        this.updateActionBar();
    }

    renderTeamView() {
        // 清空队伍容器，保留默认队伍
        document.querySelectorAll('.team').forEach(team => {
            if (team.id !== 'team1' && team.id !== 'team2') {
                team.remove();
            }
        });

        // 渲染所有队伍
        this.dataManager.data.teams.forEach(team => {
            let teamElement = document.getElementById(team.id);
            
            if (!teamElement) {
                teamElement = this.createTeamElement(team);
                this.teamsContainer.appendChild(teamElement);
            }
            
            this.renderTeamCharacters(team);
        });
    }

    createTeamElement(team) {
        const teamElement = document.createElement('div');
        teamElement.className = 'team';
        teamElement.id = team.id;
        
        let actionsHTML = '';
        if (team.id !== 'team1' && team.id !== 'team2') {
            actionsHTML = `
                <div class="team-actions">
                    <button class="edit-team-btn" data-team-id="${team.id}">✏️</button>
                    <button class="delete-team-btn" data-team-id="${team.id}">🗑️</button>
                </div>
            `;
        }
        
        teamElement.innerHTML = `
            <div class="team-header">
                <div class="team-title" data-team-id="${team.id}">${team.name}</div>
                ${actionsHTML}
            </div>
            <div class="character-list" id="${team.id}-characters">
                <div class="empty-state">点击下方按钮添加角色</div>
            </div>
        `;

        // 添加编辑和删除事件
        if (team.id !== 'team1' && team.id !== 'team2') {
            const editBtn = teamElement.querySelector('.edit-team-btn');
            const deleteBtn = teamElement.querySelector('.delete-team-btn');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTeam(team.id);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTeam(team.id);
            });
        }

        return teamElement;
    }

    renderTeamCharacters(team) {
        const characterList = document.getElementById(`${team.id}-characters`);
        characterList.innerHTML = '';

        if (team.characters.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = '点击下方按钮添加角色';
            characterList.appendChild(emptyState);
            return;
        }

        team.characters.forEach(character => {
            const characterElement = this.createCharacterElement(character);
            characterList.appendChild(characterElement);
        });
    }

    createCharacterElement(character) {
        const characterElement = document.createElement('div');
        characterElement.className = 'character';
        characterElement.id = character.id;
        characterElement.setAttribute('data-character-id', character.id);

        // 计算百分比
        const totalHp = (character.hpMax || 0) + (character.stamina || 0);
        const hpPercent = totalHp > 0 ? Math.min(100, (character.hp / totalHp) * 100) : 0;
        const staminaPercent = totalHp > 0 ? Math.min(100, ((character.stamina || 0) / totalHp) * 100) : 0;
        const mpPercent = character.mpMax > 0 ? Math.min(100, (character.mp / character.mpMax) * 100) : 0;
        const sanityPercent = character.sanityMax > 0 ? Math.min(100, (character.sanity / character.sanityMax) * 100) : 0;

        // 显示血量数字
        const hpDisplay = character.stamina > 0 ? 
            `${character.hp}<span class="stamina-plus">+${character.stamina}</span>` : 
            `${character.hp}`;

        characterElement.innerHTML = `
            <input type="checkbox" class="character-checkbox" data-character-id="${character.id}">
            <div class="character-top-row">
                <div class="character-speed">${character.speed}</div>
                <div class="character-reason">${character.reason}</div>
            </div>
            <div class="character-name">${character.name}</div>
            <div class="character-middle-row">
                <div class="character-sanity">${character.sanity}</div>
                <div class="character-hp"><span class="hp-stamina-value">${hpDisplay}</span></div>
                <div class="character-mp">${character.mp}</div>
            </div>
            <div class="character-bars">
                <div class="hp-stamina-container">
                    <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
                    <div class="stamina-bar-fill" style="width: ${staminaPercent}%; left: ${hpPercent}%"></div>
                </div>
                <div class="dual-bars">
                    <div class="dual-bar-container">
                        <div class="stat-bar-fill sanity-bar" style="width: ${sanityPercent}%"></div>
                    </div>
                    <div class="dual-bar-container">
                        <div class="stat-bar-fill mp-bar" style="width: ${mpPercent}%"></div>
                    </div>
                </div>
            </div>
            <div class="character-effect">${character.effect}</div>
        `;

        // 添加事件监听
        characterElement.addEventListener('click', (e) => {
            if (!e.target.closest('.character-actions-panel') && !e.target.matches('.character-checkbox')) {
                if (this.batchMode) {
                    this.toggleCharacterSelection(character.id);
                } else {
                    this.showCharacterActions(character.id, characterElement);
                }
            }
        });

        // 添加拖动事件
        this.attachDragEvents(characterElement, character.id);

        return characterElement;
    }

    // 行动栏
    updateActionBar() {
        const allCharacters = this.dataManager.getAllCharactersSorted();
        this.actionBarCharacters.innerHTML = '';

        if (allCharacters.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = '暂无角色';
            this.actionBarCharacters.appendChild(emptyState);
            return;
        }

        allCharacters.forEach(character => {
            const actionCharacter = document.createElement('div');
            actionCharacter.className = 'action-character';
            
            if (character.speed < 10) {
                actionCharacter.classList.add('slow-speed');
            }
            
            const teamClass = character.teamId === 'team1' ? 'team1-indicator' : 'team2-indicator';
            
            actionCharacter.innerHTML = `
                <div class="action-character-header">
                    <div class="action-character-speed">${character.speed}</div>
                    <div class="action-character-team ${teamClass}">${character.teamName}</div>
                </div>
                <div class="action-character-name">${character.name}</div>
            `;

            actionCharacter.addEventListener('click', () => {
                this.showCharacterModal(character);
            });

            this.actionBarCharacters.appendChild(actionCharacter);
        });
    }

    // 角色操作面板
    showCharacterActions(characterId, characterElement) {
        this.hideActiveCharacterPanel();
        
        const actionsPanel = document.createElement('div');
        actionsPanel.className = 'character-actions-panel';
        actionsPanel.innerHTML = `
            <button class="edit-character-btn" title="编辑角色">✏️</button>
            <button class="move-character-btn" title="移动角色">⇄</button>
            <button class="delete-character-btn" title="删除角色">🗑️</button>
            <button class="close-panel-btn" title="收起">▲</button>
        `;

        const rect = characterElement.getBoundingClientRect();
        actionsPanel.style.position = 'absolute';
        actionsPanel.style.top = `${rect.bottom + window.scrollY}px`;
        actionsPanel.style.left = `${rect.left + window.scrollX}px`;

        document.body.appendChild(actionsPanel);

        // 添加事件监听
        actionsPanel.querySelector('.edit-character-btn').addEventListener('click', () => {
            const character = this.dataManager.data.characters.find(c => c.id === characterId);
            if (character) {
                this.showCharacterModal(character);
            }
            this.hideActiveCharacterPanel();
        });

        actionsPanel.querySelector('.move-character-btn').addEventListener('click', () => {
            this.isMovingFromPanel = true;
            this.startDrag(characterId, characterElement, { 
                clientX: rect.left + rect.width/2, 
                clientY: rect.top + rect.height/2 
            });
            this.hideActiveCharacterPanel();
        });

        actionsPanel.querySelector('.delete-character-btn').addEventListener('click', () => {
            this.deleteCharacter(characterId);
            this.hideActiveCharacterPanel();
        });

        actionsPanel.querySelector('.close-panel-btn').addEventListener('click', () => {
            this.hideActiveCharacterPanel();
        });

        // 点击外部关闭面板
        document.addEventListener('click', this.hideActiveCharacterPanelOnClick.bind(this), true);

        this.activeCharacterPanel = actionsPanel;
        actionsPanel.style.display = 'flex';
    }

    hideActiveCharacterPanel() {
        if (this.activeCharacterPanel) {
            this.activeCharacterPanel.remove();
            this.activeCharacterPanel = null;
            document.removeEventListener('click', this.hideActiveCharacterPanelOnClick, true);
        }
    }

    hideActiveCharacterPanelOnClick(e) {
        if (this.activeCharacterPanel && 
            !this.activeCharacterPanel.contains(e.target) && 
            !e.target.closest('.character')) {
            this.hideActiveCharacterPanel();
        }
    }

    // 拖动功能
    attachDragEvents(characterElement, characterId) {
        if ('ontouchstart' in window) {
            characterElement.addEventListener('touchstart', (e) => this.handleTouchStart(e, characterId, characterElement));
            characterElement.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            characterElement.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        } else {
            characterElement.addEventListener('mousedown', (e) => this.handleMouseDown(e, characterId, characterElement));
        }
    }

    handleTouchStart(e, characterId, characterElement) {
        if (this.batchMode) return;
        
        this.longPressTimer = setTimeout(() => {
            this.startDrag(characterId, characterElement, e.touches[0]);
        }, 800);
        
        e.preventDefault();
    }

    handleTouchMove(e) {
        if (this.longPressTimer && this.dragCharacter) {
            this.updateDragPosition(e.touches[0]);
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.dragCharacter) {
            this.endDrag();
            e.preventDefault();
        }
    }

    handleMouseDown(e, characterId, characterElement) {
        if (this.batchMode) return;
        
        const startX = e.clientX;
        const startY = e.clientY;
        
        const handleMouseMove = (moveEvent) => {
            const deltaX = Math.abs(moveEvent.clientX - startX);
            const deltaY = Math.abs(moveEvent.clientY - startY);
            
            if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                characterElement.removeEventListener('click', characterElement.clickHandler);
                this.startDrag(characterId, characterElement, moveEvent);
                document.removeEventListener('mousemove', handleMouseMove);
            }
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mouseup', handleMouseUp);
        
        e.preventDefault();
    }

    startDrag(characterId, characterElement, event) {
        this.dragCharacter = {
            id: characterId,
            element: characterElement,
            originalTeam: this.findTeamByCharacterId(characterId),
            startX: event.clientX || event.touches[0].clientX,
            startY: event.clientY || event.touches[0].clientY
        };
        
        characterElement.classList.add('dragging');
        this.updateDragPosition(event);
        
        if ('ontouchstart' in window) {
            document.addEventListener('touchmove', this.handleTouchMoveDocument.bind(this));
            document.addEventListener('touchend', this.handleTouchEndDocument.bind(this));
        } else {
            document.addEventListener('mousemove', this.handleMouseMoveDocument.bind(this));
            document.addEventListener('mouseup', this.handleMouseUpDocument.bind(this));
        }
    }

    handleTouchMoveDocument(e) {
        if (this.dragCharacter) {
            this.updateDragPosition(e.touches[0]);
            e.preventDefault();
        }
    }

    handleTouchEndDocument(e) {
        if (this.dragCharacter) {
            this.endDrag();
            e.preventDefault();
        }
        document.removeEventListener('touchmove', this.handleTouchMoveDocument);
        document.removeEventListener('touchend', this.handleTouchEndDocument);
    }

    handleMouseMoveDocument(e) {
        if (this.dragCharacter) {
            this.updateDragPosition(e);
        }
    }

    handleMouseUpDocument(e) {
        if (this.dragCharacter) {
            this.endDrag();
        }
        document.removeEventListener('mousemove', this.handleMouseMoveDocument);
        document.removeEventListener('mouseup', this.handleMouseUpDocument);
    }

    updateDragPosition(event) {
        if (!this.dragCharacter) return;
        
        const characterElement = this.dragCharacter.element;
        const x = event.clientX || event.touches[0].clientX;
        const y = event.clientY || event.touches[0].clientY;
        
        characterElement.style.position = 'fixed';
        characterElement.style.zIndex = '10000';
        characterElement.style.left = `${x - characterElement.offsetWidth / 2}px`;
        characterElement.style.top = `${y - characterElement.offsetHeight / 2}px`;
        
        const teams = document.querySelectorAll('.team');
        let dropTarget = null;
        
        teams.forEach(team => {
            const rect = team.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                dropTarget = team;
                team.classList.add('drop-target');
            } else {
                team.classList.remove('drop-target');
            }
        });
        
        this.dragCharacter.dropTarget = dropTarget;
    }

    endDrag() {
        if (!this.dragCharacter) return;
        
        const characterElement = this.dragCharacter.element;
        const characterId = this.dragCharacter.id;
        const dropTarget = this.dragCharacter.dropTarget;
        
        characterElement.classList.remove('dragging');
        characterElement.style.position = '';
        characterElement.style.zIndex = '';
        characterElement.style.left = '';
        characterElement.style.top = '';
        
        document.querySelectorAll('.team').forEach(team => {
            team.classList.remove('drop-target');
        });
        
        if (dropTarget && dropTarget.id !== this.dragCharacter.originalTeam) {
            this.dataManager.moveCharacter(characterId, dropTarget.id);
            this.renderAllViews();
            this.saveToLocalStorage();
        }
        
        this.dragCharacter = null;
        this.isMovingFromPanel = false;
    }

    findTeamByCharacterId(characterId) {
        for (const team of this.dataManager.data.teams) {
            if (team.characters.some(c => c.id === characterId)) {
                return team.id;
            }
        }
        return null;
    }

    // 骰池功能
    addDicePool() {
        const dicePool = this.dataManager.createDicePool();
        this.renderDicePool(dicePool);
        this.saveToLocalStorage();
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

        // 其他输入事件...
        this.setupDicePoolInputEvents(poolElement, dicePool);

        const removeBtn = poolElement.querySelector('.delete-dice-pool');
        removeBtn.addEventListener('click', () => {
            this.dataManager.deleteDicePool(dicePool.id);
            poolElement.remove();
            this.saveToLocalStorage();
        });
    }

    setupDicePoolInputEvents(poolElement, dicePool) {
        // 设置各种输入框的事件监听
        // 这里简化处理，实际实现需要根据骰池类型设置不同的输入框
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

    closeModals() {
        this.characterModal.style.display = 'none';
        this.teamModal.style.display = 'none';
        this.batchMoveModal.style.display = 'none';
    }

    clearAllData() {
        if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
            this.dataManager.clearAllData();
            this.roundInput.value = 1;
            this.selectedCharacters.clear();
            this.batchMode = false;
            
            this.renderAllViews();
            this.dicePoolsContainer.innerHTML = '';
            this.cancelBatchMode();
            
            localStorage.removeItem('battleRoundViewData');
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
        }
    }
}

// 初始化桌面应用
document.addEventListener('DOMContentLoaded', () => {
    const dataManager = new DataManager();
    window.desktopApp = new DesktopApp(dataManager);
    window.desktopApp.loadFromLocalStorage();
});