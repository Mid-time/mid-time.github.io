// 大萧条时代 - 难度系统
const Difficulty = {
    // 难度参数
    params: {
        easy: {
            name: '简单模式',
            startSeason: 'spring',
            targetDays: 28,
            cashMultiplier: 1.0,
            healthMultiplier: 0.8,
            hungerMultiplier: 0.8,
            stockVolatility: 0.7,
            eventProbability: 0.8,
            rentEnabled: false,
            rentAmount: 0,
            rentIncrease: 0,
            description: '适合新手学习游戏机制'
        },
        normal: {
            name: '正常模式',
            startSeason: null, // 随机
            targetDays: 336,
            cashMultiplier: 1.0,
            healthMultiplier: 1.0,
            hungerMultiplier: 1.0,
            stockVolatility: 1.0,
            eventProbability: 1.0,
            rentEnabled: true,
            rentBase: 1000,
            rentIncrease: 50,
            description: '标准挑战，体验完整游戏'
        }
    },
    
    // 当前难度
    current: null,
    
    // 初始化难度
    initialize: function(difficulty) {
        if (!this.params[difficulty]) {
            console.error('无效的难度:', difficulty);
            return false;
        }
        
        this.current = difficulty;
        console.log(`已选择难度: ${this.params[difficulty].name}`);
        return true;
    },
    
    // 获取难度参数
    getParam: function(param) {
        if (!this.current) return null;
        return this.params[this.current][param];
    },
    
    // 获取目标天数
    getTargetDays: function() {
        return this.getParam('targetDays');
    },
    
    // 是否启用房租
    isRentEnabled: function() {
        return this.getParam('rentEnabled');
    },
    
    // 计算房租金额
    calculateRent: function(day) {
        if (!this.isRentEnabled()) return 0;
        
        const baseRent = this.getParam('rentBase');
        const rentIncrease = this.getParam('rentIncrease');
        const monthsPassed = Math.floor((day - 1) / 28);
        
        return baseRent + (rentIncrease * monthsPassed);
    },
    
    // 获取事件概率乘数
    getEventProbability: function() {
        return this.getParam('eventProbability');
    },
    
    // 获取股票波动率乘数
    getStockVolatility: function() {
        return this.getParam('stockVolatility');
    },
    
    // 获取健康消耗乘数
    getHealthMultiplier: function() {
        return this.getParam('healthMultiplier');
    },
    
    // 获取饥饿消耗乘数
    getHungerMultiplier: function() {
        return this.getParam('hungerMultiplier');
    },
    
    // 获取现金倍率（用于事件奖励/惩罚）
    getCashMultiplier: function() {
        return this.getParam('cashMultiplier');
    },
    
    // 获取起始季节
    getStartSeason: function() {
        const startSeason = this.getParam('startSeason');
        if (startSeason === null) {
            // 随机季节
            const seasons = ['spring', 'summer', 'autumn', 'winter'];
            return seasons[Math.floor(Math.random() * seasons.length)];
        }
        return startSeason;
    },
    
    // 获取难度描述
    getDescription: function(difficulty) {
        if (!difficulty) difficulty = this.current;
        return this.params[difficulty]?.description || '未知难度';
    },
    
    // 获取难度名称
    getName: function(difficulty) {
        if (!difficulty) difficulty = this.current;
        return this.params[difficulty]?.name || '未知';
    },
    
    // 检查是否胜利
    checkVictory: function(currentDay) {
        const targetDays = this.getTargetDays();
        return currentDay >= targetDays;
    },
    
    // 获取所有难度选项
    getAllDifficulties: function() {
        return Object.keys(this.params).map(key => ({
            id: key,
            name: this.params[key].name,
            description: this.params[key].description
        }));
    },
    
    // 应用难度到游戏状态
    applyDifficulty: function(gameState) {
        if (!gameState || !this.current) return gameState;
        
        const params = this.params[this.current];
        
        // 调整初始值
        if (!gameState.cash) gameState.cash = 100 * params.cashMultiplier;
        if (!gameState.health) gameState.health = 100;
        if (!gameState.hunger) gameState.hunger = 100;
        
        // 设置起始季节
        if (!gameState.currentSeason) {
            gameState.currentSeason = params.startSeason || 
                                    ['spring', 'summer', 'autumn', 'winter'][Math.floor(Math.random() * 4)];
        }
        
        return gameState;
    },
    
    // 获取当前难度配置
    getCurrentConfig: function() {
        if (!this.current) return null;
        return { ...this.params[this.current] };
    }
};