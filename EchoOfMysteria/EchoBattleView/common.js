// 全局数据存储
class BattleData {
    constructor() {
        this.teams = [
            { id: 'team1', name: '友方', characters: [], expanded: true },
            { id: 'team2', name: '敌方', characters: [], expanded: true }
        ];
        this.characters = [];
        this.nextCharacterId = 1;
        this.nextTeamId = 3;
        this.dicePools = [];
        this.round = 1;
    }
}

// 数据管理器
class DataManager {
    constructor() {
        this.data = new BattleData();
    }

    // 创建角色
    createCharacter(characterData, teamId) {
        const character = {
            id: `character-${this.data.nextCharacterId++}`,
            name: characterData.name || '实体',
            speed: parseInt(characterData.speed) || 0,
            reason: parseInt(characterData.reason) || 0,
            effect: characterData.effect || '',
            stamina: parseInt(characterData.stamina) || 0,
            hp: parseInt(characterData.hp) || 0,
            hpMax: parseInt(characterData.hpMax) || 0,
            mp: parseInt(characterData.mp) || 0,
            mpMax: parseInt(characterData.mpMax) || 0,
            sanity: parseInt(characterData.sanity) || 0,
            sanityMax: parseInt(characterData.sanityMax) || 0,
            description: characterData.description || '',
            teamId: teamId,
            lastEdit: Date.now()
        };

        this.data.characters.push(character);

        // 将角色添加到对应队伍
        const team = this.data.teams.find(t => t.id === teamId);
        if (team) {
            team.characters.push(character);
        }

        return character;
    }

    // 更新角色
    updateCharacter(characterId, characterData) {
        const characterIndex = this.data.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) return null;

        const character = this.data.characters[characterIndex];
        
        // 更新属性
        Object.assign(character, {
            name: characterData.name || '实体',
            speed: parseInt(characterData.speed) || 0,
            reason: parseInt(characterData.reason) || 0,
            effect: characterData.effect || '',
            stamina: parseInt(characterData.stamina) || 0,
            hp: parseInt(characterData.hp) || 0,
            hpMax: parseInt(characterData.hpMax) || 0,
            mp: parseInt(characterData.mp) || 0,
            mpMax: parseInt(characterData.mpMax) || 0,
            sanity: parseInt(characterData.sanity) || 0,
            sanityMax: parseInt(characterData.sanityMax) || 0,
            description: characterData.description || '',
            lastEdit: Date.now()
        });

        // 更新队伍中的角色引用
        this.data.teams.forEach(team => {
            const teamCharIndex = team.characters.findIndex(c => c.id === characterId);
            if (teamCharIndex !== -1) {
                team.characters[teamCharIndex] = character;
            }
        });

        return character;
    }

    // 删除角色
    deleteCharacter(characterId) {
        // 从所有队伍中移除角色
        this.data.teams.forEach(team => {
            const index = team.characters.findIndex(c => c.id === characterId);
            if (index !== -1) {
                team.characters.splice(index, 1);
            }
        });

        // 从角色数组中移除
        const characterIndex = this.data.characters.findIndex(c => c.id === characterId);
        if (characterIndex !== -1) {
            this.data.characters.splice(characterIndex, 1);
        }
    }

    // 移动角色
    moveCharacter(characterId, targetTeamId) {
        const character = this.data.characters.find(c => c.id === characterId);
        if (!character) return false;

        // 从原队伍中移除
        this.data.teams.forEach(team => {
            const index = team.characters.findIndex(c => c.id === characterId);
            if (index !== -1) {
                team.characters.splice(index, 1);
            }
        });

        // 添加到目标队伍
        const targetTeam = this.data.teams.find(t => t.id === targetTeamId);
        if (targetTeam) {
            targetTeam.characters.push(character);
            character.teamId = targetTeamId;
            return true;
        }

        return false;
    }

    // 创建队伍
    createTeam(name) {
        const team = {
            id: `team${this.data.nextTeamId++}`,
            name: name || '队伍3',
            characters: [],
            expanded: true
        };

        this.data.teams.push(team);
        return team;
    }

    // 更新队伍
    updateTeam(teamId, name) {
        const teamIndex = this.data.teams.findIndex(t => t.id === teamId);
        if (teamIndex === -1) return null;

        this.data.teams[teamIndex].name = name;
        return this.data.teams[teamIndex];
    }

    // 删除队伍
    deleteTeam(teamId) {
        const teamIndex = this.data.teams.findIndex(t => t.id === teamId);
        if (teamIndex === -1) return false;

        // 不能删除默认队伍
        if (teamId === 'team1' || teamId === 'team2') return false;

        this.data.teams.splice(teamIndex, 1);
        return true;
    }

    // 创建骰池
    createDicePool(poolData = {}) {
        const dicePool = {
            id: `dice-pool-${Date.now()}`,
            type: poolData.type || 'normal',
            count: poolData.count || 1,
            min: poolData.min || 1,
            max: poolData.max || 20,
            sanity: poolData.sanity || 0,
            effect: poolData.effect || 'positive',
            expressionCount: poolData.expressionCount || 1,
            expression: poolData.expression || '1d6',
            compareValue: poolData.compareValue || 10,
            note: poolData.note || ''
        };

        this.data.dicePools.push(dicePool);
        return dicePool;
    }

    // 更新骰池
    updateDicePool(poolId, poolData) {
        const poolIndex = this.data.dicePools.findIndex(p => p.id === poolId);
        if (poolIndex === -1) return null;

        Object.assign(this.data.dicePools[poolIndex], poolData);
        return this.data.dicePools[poolIndex];
    }

    // 删除骰池
    deleteDicePool(poolId) {
        const poolIndex = this.data.dicePools.findIndex(p => p.id === poolId);
        if (poolIndex === -1) return false;

        this.data.dicePools.splice(poolIndex, 1);
        return true;
    }

    // 获取所有角色按速度排序
    getAllCharactersSorted() {
        const allCharacters = [];
        this.data.teams.forEach(team => {
            team.characters.forEach(character => {
                const teamInfo = this.data.teams.find(t => t.characters.some(c => c.id === character.id));
                allCharacters.push({
                    ...character,
                    teamId: teamInfo ? teamInfo.id : 'unknown',
                    teamName: teamInfo ? teamInfo.name : '未知'
                });
            });
        });

        allCharacters.sort((a, b) => {
            if (b.speed !== a.speed) {
                return b.speed - a.speed;
            }
            return b.lastEdit - a.lastEdit;
        });

        return allCharacters;
    }

    // 清除所有数据
    clearAllData() {
        this.data = new BattleData();
    }

    // 保存到本地存储
    saveToLocalStorage() {
        const data = {
            teams: this.data.teams,
            characters: this.data.characters,
            nextCharacterId: this.data.nextCharacterId,
            nextTeamId: this.data.nextTeamId,
            dicePools: this.data.dicePools,
            round: this.data.round
        };
        localStorage.setItem('battleRoundViewData', JSON.stringify(data));
    }

    // 从本地存储加载
    loadFromLocalStorage() {
        const savedData = localStorage.getItem('battleRoundViewData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            this.data.teams = data.teams || [
                { id: 'team1', name: '友方', characters: [], expanded: true },
                { id: 'team2', name: '敌方', characters: [], expanded: true }
            ];
            this.data.characters = data.characters || [];
            this.data.nextCharacterId = data.nextCharacterId || 1;
            this.data.nextTeamId = data.nextTeamId || 3;
            this.data.dicePools = data.dicePools || [];
            this.data.round = data.round || 1;
            
            return true;
        }
        return false;
    }
}

// 骰子工具类
class DiceUtils {
    // 生成随机数
    static generateRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 解析骰子表达式
    static parseDiceExpression(expression) {
        // 移除所有空格
        expression = expression.replace(/\s/g, '');
        
        if (!expression) {
            throw new Error('表达式为空');
        }
        
        // 支持格式: XdY, XdY+Z, XdY-Z, dY, dY+Z, dY-Z
        const diceRegex = /^(\d+)?d(\d+)([+-]\d+)?$/i;
        const match = expression.match(diceRegex);
        
        if (!match) {
            throw new Error('无效的骰子表达式');
        }
        
        const count = match[1] ? parseInt(match[1]) : 1;
        const sides = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        
        // 验证参数
        if (count < 1 || count > 100) {
            throw new Error('骰子数量必须在1-100之间');
        }
        
        if (sides < 1 || sides > 1000) {
            throw new Error('骰子面数必须在1-1000之间');
        }
        
        // 计算骰子结果
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        
        // 应用修正值
        total += modifier;
        
        return total;
    }

    // 生成常规骰池结果
    static generateDicePoolResults(dicePool) {
        const results = [];
        for (let i = 0; i < dicePool.count; i++) {
            results.push(this.generateRandom(dicePool.min, dicePool.max));
        }
        return results;
    }

    // 生成理智骰池结果
    static generateSanityDicePoolResults(dicePool) {
        const results = [];
        for (let i = 0; i < dicePool.count; i++) {
            const sanityCheck = this.generateRandom(1, 100);
            const adjustedSanity = dicePool.effect === 'negative' ? -dicePool.sanity : dicePool.sanity;
            const sanityThreshold = adjustedSanity + 50;
            
            let randomNum;
            if (sanityCheck > sanityThreshold) {
                const midPoint = Math.floor((dicePool.min + dicePool.max) / 2);
                randomNum = this.generateRandom(dicePool.min, midPoint);
            } else {
                const midPoint = Math.floor((dicePool.min + dicePool.max + 1) / 2);
                randomNum = this.generateRandom(midPoint, dicePool.max);
            }
            
            results.push(randomNum);
        }
        return results;
    }

    // 生成解析骰池结果
    static generateExpressionDicePoolResults(dicePool) {
        const results = [];
        for (let i = 0; i < dicePool.expressionCount; i++) {
            try {
                results.push(this.parseDiceExpression(dicePool.expression));
            } catch (error) {
                throw error;
            }
        }
        return results;
    }

    // 生成判断骰池结果
    static generateJudgmentDicePoolResults(dicePool) {
        const results = [];
        for (let i = 0; i < dicePool.count; i++) {
            results.push(this.generateRandom(dicePool.min, dicePool.max));
        }
        return results;
    }

    // 获取骰子结果样式类
    static getDiceResultClass(result, dicePool) {
        if (dicePool.type === 'sanity') {
            const midPoint = Math.floor((dicePool.min + dicePool.max) / 2);
            return result > midPoint ? 'positive-result' : 'negative-result';
        } else if (dicePool.type === 'judgment') {
            if (result > dicePool.compareValue) {
                return 'greater-result';
            } else if (result < dicePool.compareValue) {
                return 'less-result';
            } else {
                return 'equal-result';
            }
        }
        return '';
    }
}

// 导出到全局作用域
window.BattleData = BattleData;
window.DataManager = DataManager;
window.DiceUtils = DiceUtils;