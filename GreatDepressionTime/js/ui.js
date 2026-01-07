// 大萧条时代 - 用户界面管理
const UI = {
    // 初始化UI
    initialize: function() {
        this.setupEventListeners();
        this.updateUI();
        this.updateStockList();
    },
    
    // 设置事件监听器
    setupEventListeners: function() {
        // 导航栏按钮
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // 规则菜单
        document.querySelectorAll('.rules-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                const rule = e.currentTarget.dataset.rule;
                this.switchRule(rule);
            });
        });
        
        // 时间切换按钮
        document.getElementById('time-toggle').addEventListener('click', () => {
            Game.toggleTime();
        });
        
        // 交易数量输入
        document.getElementById('trade-quantity').addEventListener('input', () => {
            Stocks.updateTradeTotal();
        });
        
        // 进食按钮
        document.getElementById('eat-btn').addEventListener('click', () => {
            Game.eat();
        });
        
        // 治疗按钮
        document.getElementById('heal-btn').addEventListener('click', () => {
            Game.heal();
        });
        
        // 关闭事件弹窗按钮
        document.querySelector('.event-modal .confirm-btn').addEventListener('click', () => {
            this.closeEventModal();
        });
    },
    
    // 切换标签页
    switchTab: function(tabId) {
        // 移除所有active类
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 激活选中标签页
        document.getElementById(`${tabId}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    },
    
    // 切换规则章节
    switchRule: function(ruleId) {
        // 移除所有active类
        document.querySelectorAll('.rules-menu li').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.rule-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // 激活选中规则
        document.querySelector(`[data-rule="${ruleId}"]`).classList.add('active');
        document.getElementById(`${ruleId}-rule`).classList.add('active');
    },
    
    // 更新UI
    updateUI: function() {
        // 更新日期显示
        const dateElement = document.getElementById('current-date');
        dateElement.textContent = `第${Game.currentDay}天`;
        
        // 更新季节显示
        const seasonElement = document.getElementById('current-season');
        const seasonIcon = document.getElementById('season-icon');
        const seasonNames = {
            spring: '春季',
            summer: '夏季',
            autumn: '秋季',
            winter: '冬季'
        };
        
        seasonElement.textContent = seasonNames[Game.currentSeason];
        seasonElement.className = `season-${Game.currentSeason}`;
        
        // 更新季节图标
        const seasonIcons = {
            spring: 'fas fa-seedling',
            summer: 'fas fa-sun',
            autumn: 'fas fa-leaf',
            winter: 'fas fa-snowflake'
        };
        seasonIcon.className = seasonIcons[Game.currentSeason];
        
        // 更新现金显示
        const cashElement = document.getElementById('cash-amount');
        cashElement.textContent = Game.cash.toFixed(2);
        
        // 更新健康条
        const healthBar = document.getElementById('health-bar');
        const healthValue = document.getElementById('health-value');
        healthBar.style.width = `${Game.health}%`;
        healthValue.textContent = Game.health;
        
        // 更新饥饿条
        const hungerBar = document.getElementById('hunger-bar');
        const hungerValue = document.getElementById('hunger-value');
        hungerBar.style.width = `${Game.hunger}%`;
        hungerValue.textContent = Game.hunger;
        
        // 更新时间切换按钮
        const timeToggle = document.getElementById('time-toggle');
        const timeIcon = document.getElementById('time-icon');
        const timeText = document.getElementById('time-text');
        
        if (Game.isDaytime) {
            timeIcon.className = 'fas fa-sun';
            timeText.textContent = '进入黑夜';
        } else {
            timeIcon.className = 'fas fa-moon';
            timeText.textContent = '进入白天';
        }
        
        // 更新治疗按钮状态
        const healBtn = document.getElementById('heal-btn');
        healBtn.disabled = Game.health >= 80;
        
        // 更新进食按钮文本
        const eatBtn = document.getElementById('eat-btn');
        eatBtn.querySelector('span').textContent = `进食(10)`;
        
        // 更新主题
        this.updateTheme();
    },
    
    // 更新主题
    updateTheme: function() {
        if (Game.isDaytime) {
            document.body.classList.remove('night-theme');
            document.body.classList.add('day-theme');
        } else {
            document.body.classList.remove('day-theme');
            document.body.classList.add('night-theme');
        }
    },
    
    // 更新股票列表
    updateStockList: function() {
        Stocks.updateStockList();
    },
    
    // 显示加载界面
    showLoading: function() {
        document.getElementById('loading-screen').classList.add('active');
    },
    
    // 隐藏加载界面
    hideLoading: function() {
        document.getElementById('loading-screen').classList.remove('active');
    },
    
    // 显示难度选择界面
    showDifficultyScreen: function() {
        document.getElementById('difficulty-screen').classList.add('active');
        document.getElementById('game-container').style.display = 'none';
    },
    
    // 隐藏难度选择界面
    hideDifficultyScreen: function() {
        document.getElementById('difficulty-screen').classList.remove('active');
        document.getElementById('game-container').style.display = 'flex';
    },
    
    // 显示游戏结束弹窗
    showGameOver: function(reason) {
        const modal = document.getElementById('game-over-modal');
        const reasonElement = document.getElementById('game-over-reason');
        const daysElement = document.getElementById('final-days');
        const cashElement = document.getElementById('final-cash');
        const stocksElement = document.getElementById('final-stocks');
        
        reasonElement.textContent = reason;
        daysElement.textContent = Game.currentDay;
        cashElement.textContent = Game.cash.toFixed(2);
        
        // 计算持有的股票数量
        let stockCount = 0;
        for (const stockName in Stocks.ownedStocks) {
            if (Stocks.ownedStocks[stockName] > 0) {
                stockCount++;
            }
        }
        stocksElement.textContent = stockCount;
        
        modal.classList.add('active');
    },
    
    // 隐藏游戏结束弹窗
    hideGameOver: function() {
        document.getElementById('game-over-modal').classList.remove('active');
    },
    
    // 显示胜利弹窗
    showVictory: function() {
        const modal = document.getElementById('victory-modal');
        const messageElement = document.getElementById('victory-message');
        const daysElement = document.getElementById('victory-days');
        const cashElement = document.getElementById('victory-cash');
        const healthElement = document.getElementById('victory-health');
        
        const difficultyName = Difficulty.getName();
        messageElement.textContent = `恭喜你在${difficultyName}中存活了${Game.currentDay}天！`;
        daysElement.textContent = Game.currentDay;
        cashElement.textContent = Game.cash.toFixed(2);
        healthElement.textContent = Game.health;
        
        modal.classList.add('active');
    },
    
    // 隐藏胜利弹窗
    hideVictory: function() {
        document.getElementById('victory-modal').classList.remove('active');
    },
    
    // 显示事件弹窗
    showEventModal: function() {
        document.getElementById('event-modal').classList.add('active');
    },
    
    // 关闭事件弹窗
    closeEventModal: function() {
        document.getElementById('event-modal').classList.remove('active');
    },
    
    // 检查横屏状态
    checkOrientation: function() {
        const warning = document.getElementById('orientation-warning');
        
        // 检查是否移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // 检查是否横屏
            const isLandscape = window.innerWidth > window.innerHeight;
            
            if (!isLandscape) {
                warning.classList.add('active');
            } else {
                warning.classList.remove('active');
            }
        } else {
            warning.classList.remove('active');
        }
    },
    
    // 显示通知
    showNotification: function(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 3秒后隐藏并移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },
    
    // 更新股票详情
    updateStockDetails: function(stock) {
        Stocks.updateStockDetails(stock);
    },
    
    // 更新图表
    updateChart: function(stock) {
        Stocks.updateChart(stock);
    },
    
    // 添加CSS样式
    addStyles: function() {
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-info {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .notification-success {
                background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%);
            }
            
            .notification-warning {
                background: linear-gradient(135deg, #ff9500 0%, #ffcc00 100%);
            }
            
            .notification-error {
                background: linear-gradient(135deg, #ff3b30 0%, #ff2d55 100%);
            }
            
            .event-effect-item {
                padding: 4px 8px;
                margin: 2px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }
            
            .stock-crashed-header {
                margin-top: 20px;
                padding: 10px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .stock-crashed-header h4 {
                color: #ff3b30;
                margin: 0;
            }
            
            .stock-item.crashed {
                opacity: 0.6;
                border-left-color: #ff3b30 !important;
            }
        `;
        document.head.appendChild(style);
    }
};

// 初始化UI样式
UI.addStyles();