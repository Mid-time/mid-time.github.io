// 常量定义
const ATTRIBUTE_NAMES = ["力量", "体质", "耐性", "速度", "魅力", "智慧", "灵感", "决心", "幸运"];

// 修正数据
const ABILITIES_DATA = [];

// 初始化修正数据
function initAbilitiesData() {
    const abilitiesText = `1.MP存储 -20% / +20%
2.速度 -20% / +20%
3.物理护甲 -1 / +1
4.物理抵抗 -10% / +10%
5.法术护甲 -1 / +1
6.法术抵抗 -10% / +10%
7.精神护甲 -1 / +1
8.精神抵抗 -10% / +10%
9.体格 -1 / +1
10.威能 -1 / +1
11.理智 -1 / +1
12.寿命 -25% / +25%
13.属性修正 -6 / +6
14.属性成长 -100% / +100%
15.负重 -25% / +25%
16.阻挡 -5 / +5
17.收入 -20% / +20%
18.支出 -20% / +20%
19.物理对抗威力 -1 / +1
20.法术对抗威力 -1 / +1
21.精神对抗威力 -1 / +1
22.物理伤害 -25% / +25%
23.法术伤害 -25% / +25%
24.精神伤害 -25% / +25%
25.命中率 -20% / +20%
26.会心伤害 -50% / +50%
27.暴击率 -20% / +20%
28.暴击伤害 -50% / +50%
29.闪避率 -20% / +20%
30.反击伤害 -50% / +50%
31.受效果强度 -1 / +1
32.受效果持续 -2 / +2
33.施效率 -20% / +20%
34.施效果强度 -1 / +1
35.施效果持续 -2 / +2
36.抗性修正 -6 / +6
37.抗性成长 -100% / +100%
38.豁免 -10 / +10
39.扭曲 -5 / +5
40.失常倾向（善良/中立/敌对） -10% / +10%
41.失常修正（善良/中立/敌对） -6 / +6
42.失常成长 -100% / +100%
43.扭曲恢复 -100% / +100%
44.技巧回转 -100% / +100%
45.技能点修正 -25% / +25%
46.特质点修正 -25% / +25%
47.等级 -2 / +2
48.经验成长 -100% / +100%
49.天赋点（战斗/交涉/技术） -1 / +1
50.通用天赋点 -1 / +1
51.物品浪费 -100% / +100%
52.装备损耗 -100% / +100%
53.神秘亵渎 -20% / +20%
54.知识污染 -20% / +20%
55.轮回能力 -20% / +20%
56.基因变异 -20% / +20%
57.神秘等级 -1 / +1
58.因果律 -10% / +10%
59.穿越者
60.其他血统`;
    
    const lines = abilitiesText.split('\n');
    for (let line of lines) {
        // 处理特殊修正（59和60）
        if (line.startsWith('59.') || line.startsWith('60.')) {
            const parts = line.split('.');
            ABILITIES_DATA.push({
                id: parts[0],
                name: parts[1].trim(),
                hasValues: false
            });
        } else {
            // 处理有数值的修正
            const match = line.match(/(\d+)\.(.+?)\s+(-?\d+[^/]*)\s*\/\s*([+-]\d+[^/]*)/);
            if (match) {
                const [, id, name, negative, positive] = match;
                
                // 解析数值范围
                let minValue, maxValue, unit;
                const hasPercent = negative.includes('%') || positive.includes('%');
                
                if (hasPercent) {
                    // 百分比修正
                    const negNum = parseInt(negative.replace('%', '').replace('-', ''));
                    const posNum = parseInt(positive.replace('%', '').replace('+', ''));
                    minValue = -negNum;
                    maxValue = posNum;
                    unit = '%';
                } else {
                    // 整数修正
                    const negNum = parseInt(negative.replace('-', ''));
                    const posNum = parseInt(positive.replace('+', ''));
                    minValue = -negNum;
                    maxValue = posNum;
                    unit = '';
                }
                
                ABILITIES_DATA.push({
                    id,
                    name: name.trim(),
                    negative: negative.trim(),
                    positive: positive.trim(),
                    minValue,
                    maxValue,
                    unit,
                    hasValues: true
                });
            }
        }
    }
}

// 额外属性中文名称映射
const EXTRA_STAT_NAMES = {
    "HP": "体力",
    "HPr": "体力恢复",
    "MP": "魔力",
    "MPr": "魔力恢复",
    "SP": "清醒",
    "SPd": "清醒阈值"
};

// 属性评级
const ATTRIBUTE_RATINGS = {
    0: { name: "孱弱", class: "text-red-400" },
    1: { name: "孱弱", class: "text-red-400" },
    2: { name: "孱弱", class: "text-red-400" },
    3: { name: "孱弱", class: "text-red-400" },
    4: { name: "凡人", class: "text-green-400" },
    5: { name: "凡人", class: "text-green-400" },
    6: { name: "凡人", class: "text-green-400" },
    7: { name: "突出", class: "text-blue-400" },
    8: { name: "突出", class: "text-blue-400" },
    9: { name: "突出", class: "text-blue-400" },
    10: { name: "突出", class: "text-blue-400" },
    11: { name: "天才", class: "text-yellow-400" },
    12: { name: "天才", class: "text-yellow-400" }
};

// 初始化修正数据
initAbilitiesData();