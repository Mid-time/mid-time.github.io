// ================================
// 统一筛选系统 - 独立管理物品和技艺的筛选状态
// 防止重复声明（如已存在则不覆盖）
// ================================
if (typeof UnifiedFilterSystem === 'undefined') {
    class UnifiedFilterSystem {
        constructor() {
            this.itemFilters = this.createFilterSet();
            this.specialtyFilters = this.createFilterSet();
            this.currentMode = 'items';
        }

        createFilterSet() {
            return {
                selectedTags: new Set(),
                selectedRarity: new Set(),
                selectedSkill: new Set(),
                selectedNeed: new Set(),
                nameFilter: '',
                minCost: null,
                maxCost: null,
                minWeight: null,
                maxWeight: null,
                minLevel: null,
                maxLevel: null,
                mainTypeFilter: '',
                subTypeFilter: '',
                sortBy: 'id-asc'
            };
        }

        getCurrentFilters() {
            return this.currentMode === 'items' ? this.itemFilters : this.specialtyFilters;
        }

        setMode(mode) {
            this.currentMode = mode;
        }

        clearCurrentFilters() {
            const f = this.getCurrentFilters();
            Object.assign(f, this.createFilterSet());
        }

        // applyFiltersToData 返回过滤后的数组（不改变原始数据），支持 returnAvailableTags 以用于 UI
        applyFiltersToData(data, mode = null, returnAvailableTags = false) {
            const filters = mode ? (mode === 'items' ? this.itemFilters : this.specialtyFilters) : this.getCurrentFilters();
            const availableTags = { tags: new Set(), rarity: new Set(), skill: new Set(), need: new Set() };
            const filtered = data.filter(item => {
                // 类型筛选
                const mt = item.maintype || '';
                const st = item.subtype || '';
                if (filters.mainTypeFilter && mt !== filters.mainTypeFilter) return false;
                if (filters.subTypeFilter && st !== filters.subTypeFilter) return false;

                // 等级筛选 for specialties
                if ((mode === 'specialties') || (mode === null && this.currentMode === 'specialties')) {
                    const lv = item.level || 1;
                    if (filters.minLevel !== null && lv < filters.minLevel) return false;
                    if (filters.maxLevel !== null && lv > filters.maxLevel) return false;
                }

                // 名称/描述/ID 搜索
                if (filters.nameFilter) {
                    const term = filters.nameFilter.toLowerCase();
                    const nameMatch = item.name && item.name.toLowerCase().includes(term);
                    let descMatch = false;
                    if (item.description) {
                        if (Array.isArray(item.description)) {
                            descMatch = item.description.some(d => d && d.toLowerCase().includes(term));
                        } else {
                            descMatch = item.description.toLowerCase().includes(term);
                        }
                    }
                    const flavorMatch = item.flavortext && item.flavortext.toLowerCase().includes(term);
                    const idMatch = (item.id && item.id.toString().includes(term));
                    if (!nameMatch && !descMatch && !flavorMatch && !idMatch) return false;
                }

                // 成本筛选
                let itemCost = this.getCurrentCost(item, mode);
                if (itemCost === null) itemCost = 0;
                if (filters.minCost !== null && itemCost < filters.minCost) return false;
                if (filters.maxCost !== null && itemCost > filters.maxCost) return false;

                // 重量筛选（items）
                if ((mode === 'items') || (mode === null && this.currentMode === 'items')) {
                    if (filters.minWeight !== null && (item.weight || 0) < filters.minWeight) return false;
                    if (filters.maxWeight !== null && (item.weight || 0) > filters.maxWeight) return false;
                }

                // 标签筛选
                const tags = item.tags || item.tag || [];
                if (filters.selectedTags.size > 0) {
                    const hasAll = Array.from(filters.selectedTags).every(t => tags.includes(t));
                    if (!hasAll) return false;
                }

                if (filters.selectedRarity.size > 0 && !filters.selectedRarity.has(item.rarity)) return false;

                if ((mode === 'items' || (mode === null && this.currentMode === 'items')) &&
                    filters.selectedSkill.size > 0 && !filters.selectedSkill.has(item.skill)) return false;

                if (filters.selectedNeed.size > 0) {
                    const hasNeed = Array.from(filters.selectedNeed).every(n => item.need && item.need.includes(n));
                    if (!hasNeed) return false;
                }

                // 收集可用标签
                if (returnAvailableTags) {
                    (tags || []).forEach(t => t && t !== '' && availableTags.tags.add(t));
                    if (item.rarity) availableTags.rarity.add(item.rarity);
                    if ((mode === 'items' || (mode === null && this.currentMode === 'items')) && item.skill && item.skill !== '' && item.skill !== '无') availableTags.skill.add(item.skill);
                    if (item.need && Array.isArray(item.need)) item.need.forEach(n => n && n !== '' && availableTags.need.add(n));
                }

                return true;
            });

            if (returnAvailableTags) return { filteredData: filtered, availableTags };
            return filtered;
        }

        getCurrentCost(item, mode = null) {
            if (!item || !item.cost) return 0;
            if ((mode === 'specialties' || (mode === null && this.currentMode === 'specialties')) && item.currentLevel && Array.isArray(item.cost)) {
                const idx = item.currentLevel - 1;
                if (idx >= 0 && idx < item.cost.length) return item.cost[idx];
            }
            if (Array.isArray(item.cost)) return item.cost[0] || 0;
            return item.cost;
        }

        sortData(data, mode = null) {
            const filters = mode ? (mode === 'items' ? this.itemFilters : this.specialtyFilters) : this.getCurrentFilters();
            const sortBy = filters.sortBy || 'id-asc';
            return [...data].sort((a, b) => {
                switch (sortBy) {
                    case 'id-asc': return (a.id || 0) - (b.id || 0);
                    case 'id-desc': return (b.id || 0) - (a.id || 0);
                    case 'name-asc': return (a.name || '').localeCompare(b.name || '');
                    case 'name-desc': return (b.name || '').localeCompare(a.name || '');
                    case 'cost-asc': return this.getCurrentCost(a, mode) - this.getCurrentCost(b, mode);
                    case 'cost-desc': return this.getCurrentCost(b, mode) - this.getCurrentCost(a, mode);
                    case 'weight-asc': return (a.weight || 0) - (b.weight || 0);
                    case 'weight-desc': return (b.weight || 0) - (a.weight || 0);
                    case 'level-asc': return (a.level || 0) - (b.level || 0);
                    case 'level-desc': return (b.level || 0) - (a.level || 0);
                    default: return (a.id || 0) - (b.id || 0);
                }
            });
        }
    }

    window.UnifiedFilterSystem = UnifiedFilterSystem;
}
