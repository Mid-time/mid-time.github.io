// 大萧条时代 - 游戏核心逻辑
const Game = {
    // 游戏状态
    difficulty: null,
    currentDay: 1,
    currentSeason: 'spring',
    isDaytime: true,
    
    // 玩家状态
    cash: 100.0,
    health: 100,
    hunger: 100,
    
    // 游戏状态
    isGameOver: false,
    isPaused: false,
    lastRentDay: 0,
    
    // 初始化游戏
    initialize: function(loadFromSave = true) {
        // 尝试加载存档
        if (loadFromSave) {
            const savedGame = Save.loadGame();
            if (savedGame) {
                this.loadGameState(savedGame);
                console.log('游戏加载成功');
            } else {
                console.log('无存档，显示难度选择');
                UI.showDifficultyScreen();
                return;
            }
        }
        
        // 初始化UI
        UI.initialize();
        
        // 更新UI
        UI.updateUI();
        
        // 隐藏加载界面
        UI.hideLoading();
        
        console.log('游戏初始化完成');
    },
    
    // 加载游戏状态
    loadGameState: function(savedState) {
        // 加载难度
        if (savedState.difficulty) {
            Difficulty.initialize(savedState.difficulty);
            this.difficulty = savedState.difficulty;
        }
        
        // 加载游戏状态
        this.currentDay = savedState.currentDay || 1;
        this.currentSeason = savedState.currentSeason || 'spring';
        this.isDaytime = savedState.isDaytime !== undefined ? savedState.isDaytime : true;
        
        // 加载玩家状态
        this.cash = savedState.cash || 100.0;
        this.health = savedState.health || 100;
        this.hunger = savedState.hunger || 100;
        
        // 加载股票状态
        if (savedState.stocks) {
            Stocks.stocks = savedState.stocks;
        }
        if (savedState.stockHistory) {
            Stocks.stockHistory = savedState.stockHistory;
        }
        if (savedState.ownedStocks) {
            Stocks.ownedStocks = savedState.ownedStocks;
        }
        
        // 加载事件状态
        if (savedState.activeEvents) {
            Events.activeEvents = savedState.activeEvents;
        }
        
        // 加载房租状态
        this.lastRentDay = savedState.lastRentDay || 0;
    },
    
    // 选择难度
    selectDifficulty: function(difficulty) {
        if (!Difficulty.initialize(difficulty)) {
            console.error('难度初始化失败');
            return;
        }
        
        this.difficulty = difficulty;
        
        // 初始化新游戏
        Save.initNewGame(difficulty);
        
        // 隐藏难度选择界面
        UI.hideDifficultyScreen();
        
        // 重新初始化游戏
        this.initialize(false);
    },
    
    // 切换时间（白天/黑夜）
    toggleTime: function() {
        if (this.isGameOver || this.isPaused) return;
        
        // 切换白天黑夜
        this.isDaytime = !this.isDaytime;
        
        // 如果是新的一天开始
        if (this.isDaytime) {
            this.startNewDay();
        } else {
            this.startNight();
        }
        
        // 更新UI
        UI.updateUI();
        
        // 保存游戏
        Save.saveGame();
    },
    
    // 开始新的一天
    startNewDay: function() {
        // 增加天数
        this.currentDay++;
        
        // 更新季节（每28天一个季节）
        const seasonIndex = Math.floor((this.currentDay - 1) / 28) % 4;
        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        this.currentSeason = seasons[seasonIndex];
        
        // 更新股票价格
        Stocks.updateStockPrices();
        
        // 检查房租（每月第一天）
        if (Difficulty.isRentEnabled()) {
            const daysInMonth = 28;
            if ((this.currentDay - 1) % daysInMonth === 0) {
                Events.triggerEvent('personal_rent_due');
            }
        }
        
        // 检查事件
        Events.checkAndTriggerEvents();
        
        // 检查胜利条件
        if (Difficulty.checkVictory(this.currentDay)) {
            this.victory();
            return;
        }
        
        console.log(`第${this.currentDay}天开始，季节：${this.currentSeason}`);
    },
    
    // 开始夜晚
    startNight: function() {
        // 更新玩家状态
        this.updatePlayerStatus();
        
        // 检查游戏结束
        if (this.health <= 0) {
            this.gameOver('健康值归零');
            return;
        }
        
        console.log('夜晚开始');
    },
    
    // 更新玩家状态
    updatePlayerStatus: function() {
        // 减少饥饿值
        const hungerMultiplier = Difficulty.getHungerMultiplier();
        this.hunger = Math.max(0, this.hunger - (10 * hungerMultiplier));
        
        // 25%概率减少健康值
        if (Math.random() < 0.25) {
            const healthMultiplier = Difficulty.getHealthMultiplier();
            const healthLoss = Math.floor(Math.random() * 10) + 1;
            this.health = Math.max(0, this.health - (healthLoss * healthMultiplier));
            
            console.log(`健康值减少 ${healthLoss}`);
        }
        
        // 如果饥饿为0，额外减少健康值
        if (this.hunger === 0) {
            const extraHealthLoss = Math.floor(Math.random() * 16) + 5;
            this.health = Math.max(0, this.health - extraHealthLoss);
            
            console.log(`饥饿值为0，额外减少健康值 ${extraHealthLoss}`);
        }
        
        // 更新UI
        UI.updateUI();
    },
    
    // 进食
    eat: function() {
        const cost = 10;
        
        if (this.cash < cost) {
            UI.showNotification('现金不足，无法进食', 'error');
            return;
        }
        
        // 扣除现金
        this.cash -= cost;
        
        // 恢复饥饿值
        const hungerGain = 20;
        this.hunger = Math.min(100, this.hunger + hungerGain);
        
        // 更新UI
        UI.updateUI();
        
        // 保存游戏
        Save.saveGame();
        
        UI.showNotification(`进食消耗${cost}现金，恢复${hungerGain}饱腹度`, 'success');
    },
    
    // 治疗
    heal: function() {
        // 检查是否可以治疗
        if (this.health >= 80) {
            UI.showNotification('健康值高于80时无法治疗', 'warning');
            return;
        }
        
        // 计算治疗费用
        const healthNeeded = 100 - this.health;
        const cost = healthNeeded * 2; // 比例费用
        
        if (this.cash < cost) {
            UI.showNotification(`现金不足，需要${cost}现金`, 'error');
            return;
        }
        
        // 扣除现金并恢复健康
        this.cash -= cost;
        this.health = 100;
        
        // 更新UI
        UI.updateUI();
        
        // 保存游戏
        Save.saveGame();
        
        UI.showNotification(`治疗消耗${cost}现金，健康值恢复满`, 'success');
    },
    
    // 游戏结束
    gameOver: function(reason) {
        this.isGameOver = true;
        
        // 显示游戏结束弹窗
        setTimeout(() => {
            UI.showGameOver(reason);
        }, 500);
        
        console.log(`游戏结束: ${reason}`);
    },
    
    // 胜利
    victory: function() {
        this.isGameOver = true;
        
        // 显示胜利弹窗
        setTimeout(() => {
            UI.showVictory();
        }, 500);
        
        console.log('游戏胜利！');
    },
    
    // 重新开始游戏
    restart: function() {
        // 清除存档
        Save.clearSave();
        
        // 隐藏弹窗
        UI.hideGameOver();
        UI.hideVictory();
        
        // 重置游戏状态
        this.isGameOver = false;
        
        // 显示难度选择界面
        UI.showDifficultyScreen();
    },
    
    // 暂停游戏
    pause: function() {
        this.isPaused = true;
        UI.showNotification('游戏已暂停', 'info');
    },
    
    // 继续游戏
    resume: function() {
        this.isPaused = false;
        UI.showNotification('游戏继续', 'info');
    },
    
    // 获取游戏统计
    getStats: function() {
        return {
            difficulty: this.difficulty,
            day: this.currentDay,
            season: this.currentSeason,
            cash: this.cash,
            health: this.health,
            hunger: this.hunger,
            isDaytime: this.isDaytime,
            totalAssets: Stocks.getTotalAssets(),
            ownedStocks: Object.keys(Stocks.ownedStocks).filter(key => Stocks.ownedStocks[key] > 0).length,
            activeStocks: Stocks.stocks.filter(s => !s.isCrashed).length,
            crashedStocks: Stocks.stocks.filter(s => s.isCrashed).length,
            eventStats: Events.getEventStats()
        };
    },
    
    // 导出游戏状态
    exportGame: function() {
        return Save.exportSave();
    },
    
    // 导入游戏状态
    importGame: function(importString) {
        if (Save.importSave(importString)) {
            // 重新加载游戏
            location.reload();
            return true;
        }
        return false;
    }
};

// 暴露全局对象（用于调试）
window.Game = Game;
window.Stocks = Stocks;
window.Events = Events;
window.UI = UI;
window.Save = Save;
window.Difficulty = Difficulty;