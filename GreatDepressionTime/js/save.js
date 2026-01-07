// 大萧条时代 - 保存系统
const Save = {
    STORAGE_KEY: 'great_depression_time_save',
    
    // 保存游戏状态
    saveGame: function() {
        try {
            const gameState = {
                // 游戏状态
                difficulty: Game.difficulty,
                currentDay: Game.currentDay,
                currentSeason: Game.currentSeason,
                isDaytime: Game.isDaytime,
                
                // 玩家状态
                cash: Game.cash,
                health: Game.health,
                hunger: Game.hunger,
                
                // 股票状态
                stocks: Stocks.stocks,
                stockHistory: Stocks.stockHistory,
                ownedStocks: Stocks.ownedStocks,
                
                // 事件状态
                activeEvents: Events.activeEvents,
                
                // 房租状态
                lastRentDay: Game.lastRentDay,
                
                // 时间戳
                lastSaved: Date.now()
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gameState));
            console.log('游戏已保存');
            return true;
        } catch (error) {
            console.error('保存游戏失败:', error);
            return false;
        }
    },
    
    // 加载游戏状态
    loadGame: function() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return null;
            
            const gameState = JSON.parse(saved);
            
            // 检查保存是否过期（超过30天）
            const daysSinceSave = (Date.now() - gameState.lastSaved) / (1000 * 60 * 60 * 24);
            if (daysSinceSave > 30) {
                console.log('存档已过期，删除旧存档');
                this.clearSave();
                return null;
            }
            
            return gameState;
        } catch (error) {
            console.error('加载游戏失败:', error);
            this.clearSave();
            return null;
        }
    },
    
    // 清除保存
    clearSave: function() {
        localStorage.removeItem(this.STORAGE_KEY);
    },
    
    // 初始化新游戏
    initNewGame: function(difficulty) {
        this.clearSave();
        
        // 初始化游戏状态
        Game.difficulty = difficulty;
        Game.currentDay = 1;
        Game.currentSeason = difficulty === 'easy' ? 'spring' : 
                            ['spring', 'summer', 'autumn', 'winter'][Math.floor(Math.random() * 4)];
        Game.isDaytime = true;
        
        // 玩家初始状态
        Game.cash = 100.0;
        Game.health = 100;
        Game.hunger = 100;
        
        // 股票初始化
        Stocks.initializeStocks();
        
        // 事件初始化
        Events.activeEvents = [];
        
        // 房租状态
        Game.lastRentDay = 0;
        
        // 保存初始状态
        this.saveGame();
        
        return true;
    },
    
    // 导出存档
    exportSave: function() {
        const gameState = this.loadGame();
        if (!gameState) return null;
        
        // 生成导出字符串
        const exportData = {
            gameName: 'Great Depression Time',
            version: '1.0',
            data: gameState,
            exportTime: Date.now()
        };
        
        return btoa(JSON.stringify(exportData));
    },
    
    // 导入存档
    importSave: function(importString) {
        try {
            const importData = JSON.parse(atob(importString));
            
            if (!importData.gameName || importData.gameName !== 'Great Depression Time') {
                throw new Error('无效的存档文件');
            }
            
            // 验证存档数据
            const requiredFields = [
                'difficulty', 'currentDay', 'cash', 'health', 'hunger', 'stocks'
            ];
            
            for (const field of requiredFields) {
                if (!importData.data[field]) {
                    throw new Error(`存档缺少必要字段: ${field}`);
                }
            }
            
            // 保存导入的存档
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(importData.data));
            console.log('存档导入成功');
            return true;
        } catch (error) {
            console.error('导入存档失败:', error);
            return false;
        }
    },
    
    // 获取存档信息
    getSaveInfo: function() {
        const saved = this.loadGame();
        if (!saved) return null;
        
        return {
            difficulty: saved.difficulty,
            day: saved.currentDay,
            cash: saved.cash,
            health: saved.health,
            hunger: saved.hunger,
            stocks: saved.stocks ? saved.stocks.length : 0
        };
    },
    
    // 备份存档
    backupSave: function() {
        const backupKey = this.STORAGE_KEY + '_backup';
        const currentSave = localStorage.getItem(this.STORAGE_KEY);
        if (currentSave) {
            localStorage.setItem(backupKey, currentSave);
            console.log('存档已备份');
        }
    },
    
    // 恢复备份
    restoreBackup: function() {
        const backupKey = this.STORAGE_KEY + '_backup';
        const backupSave = localStorage.getItem(backupKey);
        if (backupSave) {
            localStorage.setItem(this.STORAGE_KEY, backupSave);
            console.log('存档已从备份恢复');
            return true;
        }
        return false;
    }
};