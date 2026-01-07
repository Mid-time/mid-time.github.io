// 大萧条时代 - 事件系统
const Events = {
    // 事件类型配置
    eventTypes: {
        // 个人事件
        personal_sickness: {
            name: '生病',
            type: 'personal',
            effect: 'bad',
            probability: 0.03,
            description: '你生病了，需要休息和治疗。',
            apply: function() {
                const healthLoss = Math.floor(Math.random() * 20) + 10;
                Game.health = Math.max(0, Game.health - healthLoss);
                return {
                    message: `你生病了，健康值下降${healthLoss}点。`,
                    effects: [
                        `健康值 -${healthLoss}`
                    ]
                };
            }
        },
        
        personal_windfall: {
            name: '意外之财',
            type: 'personal',
            effect: 'good',
            probability: 0.02,
            description: '你发现了一些被遗忘的存款。',
            apply: function() {
                const cashGain = Math.floor(Math.random() * 150) + 50;
                Game.cash += cashGain;
                return {
                    message: `你找到了${cashGain}现金！`,
                    effects: [
                        `现金 +${cashGain}`
                    ]
                };
            }
        },
        
        personal_rent_due: {
            name: '房租到期',
            type: 'personal',
            effect: 'bad',
            probability: 0.04,
            description: '房东来催收房租了。',
            apply: function() {
                if (!Difficulty.isRentEnabled()) {
                    return null; // 简单模式没有房租
                }
                
                const rentAmount = Difficulty.calculateRent(Game.currentDay);
                if (Game.cash >= rentAmount) {
                    Game.cash -= rentAmount;
                    return {
                        message: `支付了${rentAmount}房租。`,
                        effects: [
                            `现金 -${rentAmount}`
                        ]
                    };
                } else {
                    // 没钱支付房租，健康受损
                    const healthLoss = 30;
                    Game.health = Math.max(0, Game.health - healthLoss);
                    return {
                        message: `没钱支付房租，被房东赶出来，健康受损！`,
                        effects: [
                            `健康值 -${healthLoss}`,
                            '无家可归1天'
                        ]
                    };
                }
            }
        },
        
        // 市场事件
        market_crash: {
            name: '股市崩盘',
            type: 'market',
            effect: 'bad',
            probability: 0.015,
            description: '市场突然崩盘，股价暴跌。',
            apply: function() {
                const crashSeverity = 0.3 + Math.random() * 0.3; // 30-60%下跌
                Stocks.stocks.forEach(stock => {
                    if (!stock.isCrashed) {
                        stock.currentPrice *= (1 - crashSeverity);
                        stock.currentPrice = Math.max(stock.currentPrice, stock.minPrice);
                        
                        // 添加到历史记录
                        if (!Stocks.stockHistory[stock.name]) {
                            Stocks.stockHistory[stock.name] = [];
                        }
                        Stocks.stockHistory[stock.name].push(stock.currentPrice);
                        
                        if (Stocks.stockHistory[stock.name].length > 14) {
                            Stocks.stockHistory[stock.name].shift();
                        }
                    }
                });
                
                return {
                    message: '股市崩盘！所有股票价格暴跌。',
                    effects: [
                        `所有股票下跌 ${Math.round(crashSeverity * 100)}%`
                    ]
                };
            }
        },
        
        market_boom: {
            name: '牛市到来',
            type: 'market',
            effect: 'good',
            probability: 0.01,
            description: '市场迎来一波牛市。',
            apply: function() {
                const boomSeverity = 0.15 + Math.random() * 0.15; // 15-30%上涨
                Stocks.stocks.forEach(stock => {
                    if (!stock.isCrashed) {
                        stock.currentPrice *= (1 + boomSeverity);
                        
                        // 添加到历史记录
                        if (!Stocks.stockHistory[stock.name]) {
                            Stocks.stockHistory[stock.name] = [];
                        }
                        Stocks.stockHistory[stock.name].push(stock.currentPrice);
                        
                        if (Stocks.stockHistory[stock.name].length > 14) {
                            Stocks.stockHistory[stock.name].shift();
                        }
                    }
                });
                
                return {
                    message: '牛市到来！所有股票价格上涨。',
                    effects: [
                        `所有股票上涨 ${Math.round(boomSeverity * 100)}%`
                    ]
                };
            }
        },
        
        market_scandal: {
            name: '公司丑闻',
            type: 'market',
            effect: 'bad',
            probability: 0.02,
            description: '某公司爆出重大丑闻。',
            apply: function() {
                // 选择1-3只受影响股票
                const activeStocks = Stocks.stocks.filter(s => !s.isCrashed);
                if (activeStocks.length === 0) return null;
                
                const affectedCount = Math.min(3, Math.floor(Math.random() * 3) + 1);
                const affectedStocks = [];
                
                for (let i = 0; i < affectedCount; i++) {
                    const randomIndex = Math.floor(Math.random() * activeStocks.length);
                    const stock = activeStocks[randomIndex];
                    const crashChance = 0.3 + Math.random() * 0.3; // 30-60%下跌
                    
                    stock.currentPrice *= (1 - crashChance);
                    stock.currentPrice = Math.max(stock.currentPrice, stock.minPrice);
                    affectedStocks.push(stock.name);
                    
                    // 添加到历史记录
                    if (!Stocks.stockHistory[stock.name]) {
                        Stocks.stockHistory[stock.name] = [];
                    }
                    Stocks.stockHistory[stock.name].push(stock.currentPrice);
                    
                    if (Stocks.stockHistory[stock.name].length > 14) {
                        Stocks.stockHistory[stock.name].shift();
                    }
                }
                
                return {
                    message: `公司丑闻曝光，${affectedStocks.join(', ')}股价暴跌。`,
                    effects: [
                        `${affectedStocks.join(', ')} 下跌显著`
                    ]
                };
            }
        },
        
        // 社会事件
        social_policy: {
            name: '政策变化',
            type: 'social',
            effect: 'neutral',
            probability: 0.01,
            description: '政府出台新经济政策。',
            apply: function() {
                const policyTypes = ['利好科技', '利好医疗', '利好能源', '利好工业', '利好消费'];
                const selectedPolicy = policyTypes[Math.floor(Math.random() * policyTypes.length)];
                let affectedType = '';
                let multiplier = 1;
                
                switch(selectedPolicy) {
                    case '利好科技':
                        affectedType = 'tech';
                        multiplier = 1.25 + Math.random() * 0.25; // 25-50%上涨
                        break;
                    case '利好医疗':
                        affectedType = 'medical';
                        multiplier = 1.2 + Math.random() * 0.3; // 20-50%上涨
                        break;
                    case '利好能源':
                        affectedType = 'energy';
                        multiplier = 1.15 + Math.random() * 0.35; // 15-50%上涨
                        break;
                    case '利好工业':
                        affectedType = 'industrial';
                        multiplier = 1.1 + Math.random() * 0.4; // 10-50%上涨
                        break;
                    case '利好消费':
                        affectedType = 'consumer';
                        multiplier = 1.05 + Math.random() * 0.45; // 5-50%上涨
                        break;
                }
                
                // 应用政策影响
                Stocks.stocks.forEach(stock => {
                    if (!stock.isCrashed && stock.type === affectedType) {
                        stock.currentPrice *= multiplier;
                        
                        // 添加到历史记录
                        if (!Stocks.stockHistory[stock.name]) {
                            Stocks.stockHistory[stock.name] = [];
                        }
                        Stocks.stockHistory[stock.name].push(stock.currentPrice);
                        
                        if (Stocks.stockHistory[stock.name].length > 14) {
                            Stocks.stockHistory[stock.name].shift();
                        }
                    }
                });
                
                return {
                    message: `政府出台新政策：${selectedPolicy}。`,
                    effects: [
                        `${selectedPolicy}股票上涨`
                    ]
                };
            }
        },
        
        social_disaster: {
            name: '自然灾害',
            type: 'social',
            effect: 'bad',
            probability: 0.005,
            description: '发生自然灾害，影响经济。',
            apply: function() {
                // 随机影响2-5只股票
                const activeStocks = Stocks.stocks.filter(s => !s.isCrashed);
                if (activeStocks.length === 0) return null;
                
                const affectedCount = Math.min(5, Math.floor(Math.random() * 4) + 2);
                const affectedStocks = [];
                
                for (let i = 0; i < affectedCount; i++) {
                    const randomIndex = Math.floor(Math.random() * activeStocks.length);
                    const stock = activeStocks[randomIndex];
                    const crashChance = 0.2 + Math.random() * 0.4; // 20-60%下跌
                    
                    stock.currentPrice *= (1 - crashChance);
                    stock.currentPrice = Math.max(stock.currentPrice, stock.minPrice);
                    affectedStocks.push(stock.name);
                    
                    // 添加到历史记录
                    if (!Stocks.stockHistory[stock.name]) {
                        Stocks.stockHistory[stock.name] = [];
                    }
                    Stocks.stockHistory[stock.name].push(stock.currentPrice);
                    
                    if (Stocks.stockHistory[stock.name].length > 14) {
                        Stocks.stockHistory[stock.name].shift();
                    }
                }
                
                return {
                    message: '发生自然灾害，部分公司受影响。',
                    effects: [
                        `${affectedStocks.join(', ')} 等股票下跌`
                    ]
                };
            }
        },
        
        social_strike: {
            name: '工人罢工',
            type: 'social',
            effect: 'bad',
            probability: 0.008,
            description: '主要行业发生罢工事件。',
            apply: function() {
                // 主要影响工业类型股票
                Stocks.stocks.forEach(stock => {
                    if (!stock.isCrashed && stock.type === 'industrial') {
                        const strikeEffect = 0.25 + Math.random() * 0.25; // 25-50%下跌
                        stock.currentPrice *= (1 - strikeEffect);
                        stock.currentPrice = Math.max(stock.currentPrice, stock.minPrice);
                        
                        // 添加到历史记录
                        if (!Stocks.stockHistory[stock.name]) {
                            Stocks.stockHistory[stock.name] = [];
                        }
                        Stocks.stockHistory[stock.name].push(stock.currentPrice);
                        
                        if (Stocks.stockHistory[stock.name].length > 14) {
                            Stocks.stockHistory[stock.name].shift();
                        }
                    }
                });
                
                return {
                    message: '工人罢工影响工业生产。',
                    effects: [
                        '工业类股票下跌'
                    ]
                };
            }
        }
    },
    
    // 活跃事件列表
    activeEvents: [],
    
    // 检查并触发事件
    checkAndTriggerEvents: function() {
        const triggeredEvents = [];
        
        // 调整概率基于难度
        const probabilityMultiplier = Difficulty.getEventProbability();
        
        // 检查每个事件类型
        for (const [eventKey, eventConfig] of Object.entries(this.eventTypes)) {
            // 跳过不符合条件的事件
            if (eventKey === 'personal_rent_due' && !Difficulty.isRentEnabled()) {
                continue;
            }
            
            // 计算实际概率
            const actualProbability = eventConfig.probability * probabilityMultiplier;
            
            // 检查是否触发
            if (Math.random() < actualProbability) {
                const result = eventConfig.apply();
                if (result) {
                    triggeredEvents.push({
                        key: eventKey,
                        name: eventConfig.name,
                        type: eventConfig.type,
                        effect: eventConfig.effect,
                        description: eventConfig.description,
                        result: result
                    });
                }
            }
        }
        
        // 如果有触发事件，显示第一个
        if (triggeredEvents.length > 0) {
            this.activeEvents.push(...triggeredEvents);
            this.showEvent(triggeredEvents[0]);
            
            // 如果有多个事件，延迟显示其他事件
            for (let i = 1; i < triggeredEvents.length; i++) {
                setTimeout(() => {
                    this.showEvent(triggeredEvents[i]);
                }, i * 2000); // 每2秒显示一个事件
            }
        }
        
        return triggeredEvents;
    },
    
    // 显示事件弹窗
    showEvent: function(eventData) {
        const modalHeader = document.getElementById('event-modal-header');
        const eventIcon = document.getElementById('event-icon');
        const eventTitle = document.getElementById('event-title');
        const eventDescription = document.getElementById('event-description');
        const eventEffects = document.getElementById('event-effects');
        
        // 根据事件类型设置样式
        let iconClass = 'fas fa-bolt';
        let headerClass = '';
        
        switch(eventData.effect) {
            case 'good':
                iconClass = 'fas fa-star';
                headerClass = 'event-good';
                break;
            case 'bad':
                iconClass = 'fas fa-exclamation-triangle';
                headerClass = 'event-bad';
                break;
            case 'neutral':
                iconClass = 'fas fa-info-circle';
                headerClass = 'event-neutral';
                break;
        }
        
        // 更新事件内容
        eventIcon.innerHTML = `<i class="${iconClass}"></i>`;
        eventTitle.textContent = eventData.name;
        eventDescription.textContent = eventData.description;
        
        // 更新事件效果
        eventEffects.innerHTML = '';
        if (eventData.result && eventData.result.effects) {
            eventData.result.effects.forEach(effect => {
                const effectItem = document.createElement('div');
                effectItem.className = 'event-effect-item';
                effectItem.textContent = effect;
                eventEffects.appendChild(effectItem);
            });
        }
        
        // 更新事件显示区域
        const currentEvent = document.getElementById('current-event');
        currentEvent.innerHTML = `
            <strong>${eventData.name}</strong>: ${eventData.result.message}
        `;
        
        // 显示事件弹窗
        UI.showEventModal();
    },
    
    // 清除过期事件
    cleanupEvents: function() {
        // 目前所有事件都是立即生效，没有持续事件
        // 如果有持续事件，这里会清除过期的
    },
    
    // 获取当前活跃事件
    getActiveEvents: function() {
        return this.activeEvents;
    },
    
    // 触发特定事件（用于测试）
    triggerEvent: function(eventKey, params = {}) {
        const eventConfig = this.eventTypes[eventKey];
        if (!eventConfig) {
            console.error(`事件 ${eventKey} 不存在`);
            return null;
        }
        
        const result = eventConfig.apply(params);
        if (result) {
            const eventData = {
                key: eventKey,
                name: eventConfig.name,
                type: eventConfig.type,
                effect: eventConfig.effect,
                description: eventConfig.description,
                result: result
            };
            
            this.activeEvents.push(eventData);
            this.showEvent(eventData);
            
            return eventData;
        }
        
        return null;
    },
    
    // 获取事件统计
    getEventStats: function() {
        const stats = {
            total: this.activeEvents.length,
            byType: {},
            byEffect: {
                good: 0,
                bad: 0,
                neutral: 0
            }
        };
        
        this.activeEvents.forEach(event => {
            // 按类型统计
            stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
            
            // 按效果统计
            if (event.effect) {
                stats.byEffect[event.effect] = (stats.byEffect[event.effect] || 0) + 1;
            }
        });
        
        return stats;
    }
};