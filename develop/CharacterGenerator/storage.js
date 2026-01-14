// 本地存储管理
const STORAGE_KEY = 'eom_character_generator';

// 保存数据到localStorage
function saveToLocalStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 从localStorage加载数据
function loadFromLocalStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('加载localStorage数据失败:', e);
        }
    }
    return null;
}

// 清除localStorage
function clearLocalStorage() {
    localStorage.removeItem(STORAGE_KEY);
}

// 获取默认数据
function getDefaultData() {
    return {
        currentWeek: 1,
        lastCreatedWeek: 0,
        character: null
    };
}