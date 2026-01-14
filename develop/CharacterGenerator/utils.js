// 工具函数

// 生成单个躯体
function generateBody() {
    const gender = Math.random() > 0.5 ? "男" : "女";
    const age = Math.floor(Math.random() * 31) + 10; // 10-40岁
    const isYouth = age <= 16; // 少年包含16岁
    const lifespan = Math.floor(Math.random() * 21) + 50; // 50-70年
    
    const attributes = [];
    let total = 0;
    let totalWithoutLuck = 0;
    
    // 生成九大属性
    for (let i = 0; i < 9; i++) {
        let a = Math.floor(Math.random() * 44); // 0-43
        
        // 根据原Python代码逻辑
        if (a === 43) {
            a = 48;
        } else if (a >= 41) {
            a = 44;
        }
        
        a = Math.floor(a / 4);
        total += a;
        
        // 计算不含幸运的总和
        if (i !== 8) { // 幸运是第9个属性，索引为8
            totalWithoutLuck += a;
        }
        
        attributes.push({
            name: ATTRIBUTE_NAMES[i],
            value: a
        });
    }
    
    return {
        gender,
        age,
        isYouth,
        lifespan,
        attributes,
        totalAttributes: total,
        totalAttributesWithoutLuck: totalWithoutLuck
    };
}

// 生成三个躯体选项
function generateBodyOptions() {
    const options = [];
    for (let i = 0; i < 3; i++) {
        options.push(generateBody());
    }
    return options;
}

// 生成修正随机值
function generateAbilityValue(ability, isAdvantage) {
    if (!ability.hasValues) {
        return {
            value: isAdvantage ? "优势" : "劣势",
            unit: ""
        };
    }
    
    // 生成随机值
    let randomValue;
    if (isAdvantage) {
        // 优势：生成1到maxValue的正随机数
        randomValue = Math.floor(Math.random() * ability.maxValue) + 1;
    } else {
        // 劣势：生成minValue到-1的负随机数
        randomValue = Math.floor(Math.random() * (-ability.minValue)) + ability.minValue;
    }
    
    return {
        value: randomValue,
        unit: ability.unit
    };
}

// 生成单个修正集合
function generateAbilities() {
    const advantages = [];
    const disadvantages = [];
    
    // 优势修正数量：3个randint(0,1)相加
    const advantageCount = Math.floor(Math.random() * 2) + 
                          Math.floor(Math.random() * 2) + 
                          Math.floor(Math.random() * 2);
    
    // 劣势修正数量：3个randint(0,1)相加
    const disadvantageCount = Math.floor(Math.random() * 2) + 
                             Math.floor(Math.random() * 2) + 
                             Math.floor(Math.random() * 2);
    
    // 生成优势修正
    const usedAdvantageIds = new Set();
    for (let i = 0; i < advantageCount; i++) {
        // 随机选择修正，确保不重复
        let ability;
        let attempts = 0;
        do {
            ability = ABILITIES_DATA[Math.floor(Math.random() * ABILITIES_DATA.length)];
            attempts++;
        } while (usedAdvantageIds.has(ability.id) && attempts < 10);
        
        usedAdvantageIds.add(ability.id);
        
        const abilityValue = generateAbilityValue(ability, true);
        advantages.push({
            name: ability.name,
            value: abilityValue.value,
            unit: abilityValue.unit
        });
    }
    
    // 生成劣势修正
    const usedDisadvantageIds = new Set();
    for (let i = 0; i < disadvantageCount; i++) {
        // 随机选择修正，确保不重复
        let ability;
        let attempts = 0;
        do {
            ability = ABILITIES_DATA[Math.floor(Math.random() * ABILITIES_DATA.length)];
            attempts++;
        } while (usedDisadvantageIds.has(ability.id) && attempts < 10);
        
        usedDisadvantageIds.add(ability.id);
        
        const abilityValue = generateAbilityValue(ability, false);
        disadvantages.push({
            name: ability.name,
            value: abilityValue.value,
            unit: abilityValue.unit
        });
    }
    
    // 生成额外属性修正
    const extraStats = generateExtraStats();
    
    return {
        advantages,
        disadvantages,
        extraStats
    };
}

// 生成额外属性修正
function generateExtraStats() {
    const stats = [
        { name: "HP", chineseName: "体力", unit: "%" },
        { name: "HPr", chineseName: "体力恢复", unit: "%" },
        { name: "MP", chineseName: "魔力", unit: "%" },
        { name: "MPr", chineseName: "魔力恢复", unit: "%" },
        { name: "SP", chineseName: "清醒", unit: "%" },
        { name: "SPd", chineseName: "清醒阈值", unit: "%" }
    ];
    
    return stats.map((stat, index) => {
        let value;
        if (index < 5) {
            // 前五个：randint(70,130)%
            value = Math.floor(Math.random() * 61) + 70; // 70-130
        } else {
            // 最后一个：randint(-10,10)%
            value = Math.floor(Math.random() * 21) - 10; // -10到10
        }
        
        return {
            name: stat.name,
            chineseName: stat.chineseName,
            value: value,
            unit: stat.unit
        };
    });
}

// 生成三个修正选项
function generateAbilityOptions() {
    const options = [];
    for (let i = 0; i < 3; i++) {
        options.push(generateAbilities());
    }
    return options;
}

// 格式化修正值显示
function formatAbilityValue(value, unit) {
    if (typeof value === 'string') {
        return value;
    }
    
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}${unit}`;
}

// 获取额外属性中文名称
function getExtraStatChineseName(name) {
    return EXTRA_STAT_NAMES[name] || name;
}

// 获取属性分类
function getAttributeClass(value) {
    if (value <= 3) return 'text-red-400';
    if (value <= 6) return 'text-green-400';
    if (value <= 10) return 'text-blue-400';
    return 'text-yellow-400';
}

// 获取属性评级
function getAttributeRating(value) {
    if (value <= 3) return '孱弱';
    if (value <= 6) return '凡人';
    if (value <= 10) return '突出';
    return '天才';
}

// 获取属性评级颜色
function getAttributeRatingClass(value) {
    if (value <= 3) return 'text-red-400';
    if (value <= 6) return 'text-green-400';
    if (value <= 10) return 'text-blue-400';
    return 'text-yellow-400';
}

// 下载角色信息
function downloadCharacter(character) {
    let content = "《神秘回响》角色信息\n";
    content += "=".repeat(40) + "\n\n";
    
    // 基本信息
    content += "基本信息:\n";
    content += `性别: ${character.body.gender}\n`;
    content += `年龄: ${character.body.age}岁\n`;
    if (character.body.isYouth) {
        content += "标签: 少年\n";
    }
    content += `寿命: ${character.body.lifespan}年\n`;
    content += `创建周数: ${character.metadata.weekCreated}\n\n`;
    
    // 属性
    content += "属性:\n";
    character.body.attributes.forEach((attr, index) => {
        const rating = getAttributeRating(attr.value);
        content += `${ATTRIBUTE_NAMES[index]}: ${attr.value} (${rating})\n`;
    });
    content += `属性总和: ${character.body.totalAttributesWithoutLuck} / ${character.body.totalAttributes} (不含幸运/含幸运)\n\n`;
    
    // 优势修正
    content += "优势修正:\n";
    if (character.abilities.advantages.length === 0) {
        content += "  无\n";
    } else {
        character.abilities.advantages.forEach(adv => {
            content += `  ${adv.name}: ${formatAbilityValue(adv.value, adv.unit)}\n`;
        });
    }
    content += "\n";
    
    // 劣势修正
    content += "劣势修正:\n";
    if (character.abilities.disadvantages.length === 0) {
        content += "  无\n";
    } else {
        character.abilities.disadvantages.forEach(dis => {
            content += `  ${dis.name}: ${formatAbilityValue(dis.value, dis.unit)}\n`;
        });
    }
    content += "\n";
    
    // 属性修正
    content += "属性修正:\n";
    character.abilities.extraStats.forEach(stat => {
        const chineseName = getExtraStatChineseName(stat.name);
        content += `  ${chineseName}: ${stat.value}${stat.unit}\n`;
    });
    
    // 创建文件
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `神秘回响角色_周${character.metadata.weekCreated}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}