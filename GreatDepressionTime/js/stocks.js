// 大萧条时代 - 股票系统
const Stocks = {
    // 股票数据
    stocks: [],
    ownedStocks: {},
    stockHistory: {},
    selectedStock: null,
    
    // 股票类型配置
    stockTypes: {
        tech: {
            name: '科技',
            color: '#ff2d55',
            volatility: 1.5,
            growthRate: 1.2,
            crashChance: 0.05,
            description: '高风险高回报，波动剧烈'
        },
        medical: {
            name: '医疗',
            color: '#4cd964',
            volatility: 0.8,
            growthRate: 1.1,
            crashChance: 0.02,
            description: '相对稳定，抗跌性强'
        },
        energy: {
            name: '能源',
            color: '#ff9500',
            volatility: 1.0,
            growthRate: 1.0,
            crashChance: 0.03,
            description: '受季节和政策影响大'
        },
        industrial: {
            name: '工业',
            color: '#5ac8fa',
            volatility: 0.9,
            growthRate: 0.9,
            crashChance: 0.01,
            description: '稳定增长，波动较小'
        },
        consumer: {
            name: '消费',
            color: '#af52de',
            volatility: 0.7,
            growthRate: 0.8,
            crashChance: 0.01,
            description: '日常生活相关，抗风险'
        }
    },
    
    // 初始化股票
    initializeStocks: function() {
        this.stocks = [];
        this.ownedStocks = {};
        this.stockHistory = {};
        
        // 生成初始股票数量（5-8）
        const initialCount = Math.floor(Math.random() * 4) + 5;
        
        for (let i = 0; i < initialCount; i++) {
            this.addStock();
        }
        
        console.log(`初始化 ${initialCount} 只股票`);
        this.updateStockList();
    },
    
    // 添加新股票
    addStock: function() {
        // 生成股票名称
        const name = this.generateStockName();
        
        // 随机选择类型
        const typeKeys = Object.keys(this.stockTypes);
        const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        
        // 生成初始价格（5-20）
        const basePrice = 5 + Math.random() * 15;
        
        // 创建股票对象
        const stock = {
            id: this.stocks.length + 1,
            name: name,
            type: type,
            currentPrice: basePrice,
            previousPrice: basePrice,
            minPrice: 3 + (Game.currentDay / 100), // 最低价随时间增加
            volatility: this.stockTypes[type].volatility * Difficulty.getStockVolatility(),
            growthRate: this.stockTypes[type].growthRate,
            crashChance: this.stockTypes[type].crashChance,
            isCrashed: false
        };
        
        this.stocks.push(stock);
        this.stockHistory[name] = [stock.currentPrice];
        this.ownedStocks[name] = 0;
        
        return stock;
    },
    
    // 生成股票名称
    generateStockName: function() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const stockCount = this.stocks.length;
        
        if (stockCount < 26) {
            return letters[stockCount];
        } else {
            const firstLetter = Math.floor(stockCount / 26) - 1;
            const secondLetter = stockCount % 26;
            return letters[firstLetter] + letters[secondLetter];
        }
    },
    
    // 更新股票价格
    updateStockPrices: function() {
        const seasonMultiplier = this.getSeasonMultiplier();
        
        this.stocks.forEach(stock => {
            if (stock.isCrashed) return;
            
            // 保存前一天价格
            stock.previousPrice = stock.currentPrice;
            
            // 基础波动（-10% 到 +15%）
            const baseChange = (Math.random() * 25 - 10) / 100;
            
            // 类型波动
            const typeVolatility = stock.volatility * baseChange;
            
            // 季节影响
            const seasonEffect = seasonMultiplier[stock.type] || 1;
            
            // 计算新价格
            let newPrice = stock.currentPrice * (1 + typeVolatility) * seasonEffect;
            
            // 最低价格保护
            newPrice = Math.max(newPrice, stock.minPrice);
            
            // 检查是否崩盘
            if (newPrice <= stock.minPrice || Math.random() < stock.crashChance) {
                this.crashStock(stock);
                return;
            }
            
            stock.currentPrice = parseFloat(newPrice.toFixed(2));
            
            // 添加到历史记录
            if (!this.stockHistory[stock.name]) {
                this.stockHistory[stock.name] = [];
            }
            this.stockHistory[stock.name].push(stock.currentPrice);
            
            // 保留最近14个价格点
            if (this.stockHistory[stock.name].length > 14) {
                this.stockHistory[stock.name].shift();
            }
        });
        
        // 检查是否需要添加新股票
        if (this.stocks.filter(s => !s.isCrashed).length < 6) {
            this.addStock();
        }
        
        this.updateStockList();
        if (this.selectedStock) {
            this.selectStock(this.selectedStock);
        }
    },
    
    // 获取季节乘数
    getSeasonMultiplier: function() {
        const season = Game.currentSeason;
        
        const multipliers = {
            spring: {
                tech: 1.1,
                medical: 1.0,
                energy: 0.95,
                industrial: 1.05,
                consumer: 1.0
            },
            summer: {
                tech: 1.0,
                medical: 0.95,
                energy: 1.15,
                industrial: 1.0,
                consumer: 1.1
            },
            autumn: {
                tech: 1.05,
                medical: 1.1,
                energy: 1.0,
                industrial: 1.1,
                consumer: 1.05
            },
            winter: {
                tech: 0.95,
                medical: 1.15,
                energy: 1.05,
                industrial: 0.95,
                consumer: 0.9
            }
        };
        
        return multipliers[season] || multipliers.spring;
    },
    
    // 股票崩盘
    crashStock: function(stock) {
        stock.isCrashed = true;
        stock.currentPrice = 0;
        
        // 清空玩家持有的该股票
        this.ownedStocks[stock.name] = 0;
        
        console.log(`股票 ${stock.name} 已崩盘`);
        
        // 触发崩盘事件
        Events.triggerEvent('market_crash', { stockName: stock.name });
    },
    
    // 选择股票
    selectStock: function(stockName) {
        const stock = this.stocks.find(s => s.name === stockName);
        if (!stock) return;
        
        this.selectedStock = stockName;
        this.updateStockDetails(stock);
        this.updateChart(stock);
    },
    
    // 更新股票详情显示
    updateStockDetails: function(stock) {
        document.getElementById('selected-stock-name').textContent = `${stock.name} - ${this.stockTypes[stock.type].name}`;
        document.getElementById('stock-type').textContent = `类型: ${this.stockTypes[stock.type].name}`;
        document.getElementById('stock-volatility').textContent = `波动率: ${stock.volatility.toFixed(2)}`;
        document.getElementById('current-price').textContent = stock.isCrashed ? '已崩盘' : stock.currentPrice.toFixed(2);
        document.getElementById('owned-shares').textContent = this.ownedStocks[stock.name] || 0;
        
        const positionValue = (this.ownedStocks[stock.name] || 0) * stock.currentPrice;
        document.getElementById('position-value').textContent = positionValue.toFixed(2);
        
        // 更新交易按钮状态
        const canBuy = Game.cash >= stock.currentPrice;
        const canSell = (this.ownedStocks[stock.name] || 0) > 0;
        
        document.getElementById('buy-btn').disabled = !canBuy || stock.isCrashed;
        document.getElementById('sell-btn').disabled = !canSell;
        
        // 更新交易总额
        this.updateTradeTotal();
    },
    
    // 更新交易总额
    updateTradeTotal: function() {
        if (!this.selectedStock) return;
        
        const stock = this.stocks.find(s => s.name === this.selectedStock);
        if (!stock || stock.isCrashed) return;
        
        const quantity = parseInt(document.getElementById('trade-quantity').value) || 1;
        const total = quantity * stock.currentPrice;
        
        document.getElementById('trade-total').textContent = total.toFixed(2);
    },
    
    // 调整交易数量
    adjustQuantity: function(change) {
        const input = document.getElementById('trade-quantity');
        let value = parseInt(input.value) || 1;
        value += change;
        
        if (value < 1) value = 1;
        if (value > 9999) value = 9999;
        
        input.value = value;
        this.updateTradeTotal();
    },
    
    // 买入股票
    buyStock: function() {
        if (!this.selectedStock) {
            alert('请先选择一只股票');
            return;
        }
        
        const stock = this.stocks.find(s => s.name === this.selectedStock);
        if (!stock || stock.isCrashed) {
            alert('该股票已崩盘，无法交易');
            return;
        }
        
        const quantity = parseInt(document.getElementById('trade-quantity').value) || 1;
        const totalCost = quantity * stock.currentPrice;
        
        if (totalCost > Game.cash) {
            alert('现金不足');
            return;
        }
        
        // 执行交易
        Game.cash -= totalCost;
        this.ownedStocks[stock.name] = (this.ownedStocks[stock.name] || 0) + quantity;
        
        // 更新UI
        Game.updateUI();
        this.updateStockDetails(stock);
        
        console.log(`买入 ${quantity} 股 ${stock.name}，花费 ${totalCost}`);
    },
    
    // 卖出股票
    sellStock: function() {
        if (!this.selectedStock) {
            alert('请先选择一只股票');
            return;
        }
        
        const stock = this.stocks.find(s => s.name === this.selectedStock);
        if (!stock) return;
        
        const quantity = parseInt(document.getElementById('trade-quantity').value) || 1;
        const ownedQuantity = this.ownedStocks[stock.name] || 0;
        
        if (quantity > ownedQuantity) {
            alert('持有数量不足');
            return;
        }
        
        const totalValue = quantity * stock.currentPrice;
        
        // 执行交易
        Game.cash += totalValue;
        this.ownedStocks[stock.name] = ownedQuantity - quantity;
        
        // 更新UI
        Game.updateUI();
        this.updateStockDetails(stock);
        
        console.log(`卖出 ${quantity} 股 ${stock.name}，获得 ${totalValue}`);
    },
    
    // 更新股票列表显示
    updateStockList: function() {
        const stockList = document.getElementById('stocks-list');
        if (!stockList) return;
        
        stockList.innerHTML = '';
        
        const activeStocks = this.stocks.filter(stock => !stock.isCrashed);
        const crashedStocks = this.stocks.filter(stock => stock.isCrashed);
        
        // 更新股票计数
        document.getElementById('stock-count').textContent = activeStocks.length;
        document.getElementById('max-stocks').textContent = this.stocks.length;
        
        // 显示活跃股票
        activeStocks.forEach(stock => {
            const change = ((stock.currentPrice - stock.previousPrice) / stock.previousPrice) * 100;
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const changeSymbol = change >= 0 ? '+' : '';
            
            const stockItem = document.createElement('div');
            stockItem.className = `stock-item ${this.selectedStock === stock.name ? 'selected' : ''}`;
            stockItem.onclick = () => this.selectStock(stock.name);
            
            stockItem.innerHTML = `
                <div class="stock-item-header">
                    <span class="stock-name">${stock.name}</span>
                    <span class="stock-price ${changeClass}">${stock.currentPrice.toFixed(2)}</span>
                </div>
                <div class="stock-details">
                    类型: ${this.stockTypes[stock.type].name} | 
                    涨跌: <span class="${changeClass}">${changeSymbol}${change.toFixed(2)}%</span>
                </div>
            `;
            
            stockList.appendChild(stockItem);
        });
        
        // 显示崩盘股票（如果有）
        if (crashedStocks.length > 0) {
            const crashedHeader = document.createElement('div');
            crashedHeader.className = 'stock-crashed-header';
            crashedHeader.innerHTML = '<h4>已崩盘股票</h4>';
            stockList.appendChild(crashedHeader);
            
            crashedStocks.forEach(stock => {
                const stockItem = document.createElement('div');
                stockItem.className = 'stock-item crashed';
                stockItem.innerHTML = `
                    <div class="stock-item-header">
                        <span class="stock-name">${stock.name}</span>
                        <span class="stock-price">已崩盘</span>
                    </div>
                    <div class="stock-details">
                        类型: ${this.stockTypes[stock.type].name}
                    </div>
                `;
                stockList.appendChild(stockItem);
            });
        }
    },
    
    // 更新图表
    updateChart: function(stock) {
        const canvas = document.getElementById('stock-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const history = this.stockHistory[stock.name] || [];
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (history.length < 2) {
            // 绘制无数据提示
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暂无历史数据', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // 计算价格范围
        const minPrice = Math.min(...history);
        const maxPrice = Math.max(...history);
        const priceRange = maxPrice - minPrice || 1;
        
        // 图表尺寸
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        
        // 绘制网格
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // 水平网格线
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight * (5 - i) / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            
            // 价格标签
            const price = minPrice + (priceRange * i / 5);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(price.toFixed(2), padding - 5, y + 4);
        }
        
        // 垂直网格线（时间点）
        for (let i = 0; i < history.length; i++) {
            const x = padding + (chartWidth * i / (history.length - 1));
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, canvas.height - padding);
            ctx.stroke();
            
            // 时间标签（简化显示）
            if (i === 0 || i === history.length - 1 || i % 3 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`第${i + 1}点`, x, canvas.height - padding + 20);
            }
        }
        
        // 绘制折线
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = stock.isCrashed ? '#ff3b30' : 
                         (history[history.length - 1] >= history[0] ? '#4cd964' : '#ff3b30');
        
        history.forEach((price, index) => {
            const x = padding + (chartWidth * index / (history.length - 1));
            const y = canvas.height - padding - ((price - minPrice) / priceRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 绘制数据点
        history.forEach((price, index) => {
            const x = padding + (chartWidth * index / (history.length - 1));
            const y = canvas.height - padding - ((price - minPrice) / priceRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = stock.isCrashed ? '#ff3b30' : 
                           (index === 0 ? '#5ac8fa' : 
                           (price >= history[Math.max(0, index - 1)] ? '#4cd964' : '#ff3b30'));
            ctx.fill();
        });
        
        // 添加图表交互
        canvas.onmousemove = (e) => this.handleChartHover(e, stock, history, minPrice, maxPrice, padding, chartWidth, chartHeight);
        canvas.onmouseleave = () => {
            document.getElementById('chart-tooltip').style.opacity = '0';
        };
    },
    
    // 处理图表悬停
    handleChartHover: function(e, stock, history, minPrice, maxPrice, padding, chartWidth, chartHeight) {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否在图表区域内
        if (x < padding || x > canvas.width - padding || y < padding || y > canvas.height - padding) {
            document.getElementById('chart-tooltip').style.opacity = '0';
            return;
        }
        
        // 计算最近的数据点
        const dataIndex = Math.round(((x - padding) / chartWidth) * (history.length - 1));
        const dataIndexClamped = Math.max(0, Math.min(history.length - 1, dataIndex));
        const price = history[dataIndexClamped];
        
        // 计算涨跌幅（与前一天比较）
        let changePercent = 0;
        if (dataIndexClamped > 0) {
            changePercent = ((price - history[dataIndexClamped - 1]) / history[dataIndexClamped - 1]) * 100;
        }
        
        // 更新工具提示
        const tooltip = document.getElementById('chart-tooltip');
        tooltip.innerHTML = `
            时间点: ${dataIndexClamped + 1}<br>
            价格: ${price.toFixed(2)}<br>
            涨跌: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
        `;
        
        // 定位工具提示
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y - 10}px`;
        tooltip.style.opacity = '1';
    },
    
    // 获取总资产（现金 + 股票价值）
    getTotalAssets: function() {
        let stockValue = 0;
        
        this.stocks.forEach(stock => {
            if (!stock.isCrashed) {
                const owned = this.ownedStocks[stock.name] || 0;
                stockValue += owned * stock.currentPrice;
            }
        });
        
        return Game.cash + stockValue;
    },
    
    // 应用事件影响
    applyEventEffect: function(eventType, effect) {
        this.stocks.forEach(stock => {
            if (stock.isCrashed) return;
            
            switch (eventType) {
                case 'market_crash':
                    // 市场崩盘，所有股票下跌
                    stock.currentPrice *= (1 - (Math.random() * 0.4 + 0.2));
                    break;
                    
                case 'market_boom':
                    // 牛市，所有股票上涨
                    stock.currentPrice *= (1 + (Math.random() * 0.3 + 0.15));
                    break;
                    
                case 'company_scandal':
                    // 公司丑闻，随机1-3只股票受影响
                    if (Math.random() < 0.3) {
                        stock.currentPrice *= (1 - (Math.random() * 0.6 + 0.3));
                    }
                    break;
                    
                case 'policy_change':
                    // 政策变化，特定类型股票受影响
                    if (stock.type === effect.affectedType) {
                        stock.currentPrice *= effect.multiplier;
                    }
                    break;
            }
            
            // 更新历史记录
            if (!this.stockHistory[stock.name]) {
                this.stockHistory[stock.name] = [];
            }
            this.stockHistory[stock.name].push(stock.currentPrice);
            
            if (this.stockHistory[stock.name].length > 14) {
                this.stockHistory[stock.name].shift();
            }
        });
        
        this.updateStockList();
        if (this.selectedStock) {
            this.selectStock(this.selectedStock);
        }
    }
};