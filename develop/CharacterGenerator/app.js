const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
    setup() {
        // 状态管理
        const currentWeek = ref(1);
        const lastCreatedWeek = ref(0);
        const bodyOptions = ref([]);
        const abilityOptions = ref([]);
        const selectedBodyIndex = ref(null);
        const selectedAbilityIndex = ref(null);
        const character = ref(null);
        const showDeveloperTools = ref(false);
        
        // 计算属性
        const characterCreated = computed(() => {
            return character.value !== null;
        });
        
        const canCreateNewCharacter = computed(() => {
            return currentWeek.value > lastCreatedWeek.value;
        });
        
        // 选择躯体选项
        const selectBodyOption = (index) => {
            selectedBodyIndex.value = index;
        };
        
        // 选择修正选项
        const selectAbilityOption = (index) => {
            selectedAbilityIndex.value = index;
        };
        
        // 创建角色
        const createCharacter = () => {
            if (selectedBodyIndex.value === null || selectedAbilityIndex.value === null) {
                alert("请先选择躯体和修正");
                return;
            }
            
            // 检查是否可以创建新角色
            if (!canCreateNewCharacter.value) {
                alert("本周已创建过角色，无法再次创建");
                return;
            }
            
            // 保存角色数据
            character.value = {
                metadata: {
                    weekCreated: currentWeek.value,
                    createdDate: new Date().toISOString(),
                    version: "v0.8.2"
                },
                body: bodyOptions.value[selectedBodyIndex.value],
                abilities: abilityOptions.value[selectedAbilityIndex.value]
            };
            
            // 更新最后创建周数
            lastCreatedWeek.value = currentWeek.value;
            
            // 保存到localStorage
            saveData();
        };
        
        // 创建新角色（如果满足条件）
        const startNewCharacter = () => {
            if (!canCreateNewCharacter.value) {
                alert("本周已创建过角色，无法再次创建。请等待新的一周。");
                return;
            }
            
            // 重置状态
            character.value = null;
            selectedBodyIndex.value = null;
            selectedAbilityIndex.value = null;
            
            // 生成新的选项
            bodyOptions.value = generateBodyOptions();
            abilityOptions.value = generateAbilityOptions();
        };
        
        // 返回创建页面（不检查周数限制）
        const backToCreation = () => {
            // 重置选择但不生成新选项（用户可以重新选择已生成的选项）
            selectedBodyIndex.value = null;
            selectedAbilityIndex.value = null;
            character.value = null;
        };
        
        // 下载角色信息
        const downloadCharacter = () => {
            if (!character.value) return;
            utils.downloadCharacter(character.value);
        };
        
        // 模拟新周
        const forceNewWeek = () => {
            currentWeek.value += 1;
            saveData();
            alert(`已模拟到周${currentWeek.value}`);
        };
        
        // 清除localStorage
        const clearLocalStorage = () => {
            storage.clearLocalStorage();
            currentWeek.value = 1;
            lastCreatedWeek.value = 0;
            character.value = null;
            bodyOptions.value = generateBodyOptions();
            abilityOptions.value = generateAbilityOptions();
            alert('已清除本地存储');
        };
        
        // 生成测试角色
        const generateDebugCharacter = () => {
            // 直接创建一个角色（绕过周数限制）
            character.value = {
                metadata: {
                    weekCreated: currentWeek.value,
                    createdDate: new Date().toISOString(),
                    version: "v0.8.2"
                },
                body: generateBody(),
                abilities: generateAbilities()
            };
            
            lastCreatedWeek.value = currentWeek.value;
            saveData();
            alert('测试角色已生成');
        };
        
        // 显示密码提示
        const showPasswordPrompt = () => {
            if (showDeveloperTools.value) {
                showDeveloperTools.value = false;
                return;
            }
            
            const password = prompt("请输入开发者工具密码:");
            if (password === "Midtime") {
                showDeveloperTools.value = true;
            } else if (password !== null) {
                alert("密码错误！");
            }
        };
        
        // 切换开发者工具显示
        const toggleDeveloperTools = () => {
            showDeveloperTools.value = !showDeveloperTools.value;
        };
        
        // 保存数据
        const saveData = () => {
            const data = {
                currentWeek: currentWeek.value,
                lastCreatedWeek: lastCreatedWeek.value,
                character: character.value
            };
            storage.saveToLocalStorage(data);
        };
        
        // 加载数据
        const loadData = () => {
            const data = storage.loadFromLocalStorage() || storage.getDefaultData();
            currentWeek.value = data.currentWeek || 1;
            lastCreatedWeek.value = data.lastCreatedWeek || 0;
            character.value = data.character || null;
        };
        
        // 初始化
        const init = () => {
            loadData();
            
            // 如果没有角色数据，生成选项
            if (!character.value) {
                bodyOptions.value = generateBodyOptions();
                abilityOptions.value = generateAbilityOptions();
            } else {
                // 如果有角色数据，从角色数据中提取选项（用于重新选择）
                bodyOptions.value = [character.value.body, generateBody(), generateBody()];
                abilityOptions.value = [character.value.abilities, generateAbilities(), generateAbilities()];
            }
        };
        
        // 页面加载时初始化
        onMounted(() => {
            init();
        });
        
        return {
            // 数据
            attributeNames: ATTRIBUTE_NAMES,
            currentWeek,
            lastCreatedWeek,
            bodyOptions,
            selectedBodyIndex,
            abilityOptions,
            selectedAbilityIndex,
            character,
            showDeveloperTools,
            
            // 计算属性
            characterCreated,
            canCreateNewCharacter,
            
            // 方法
            selectBodyOption,
            selectAbilityOption,
            createCharacter,
            startNewCharacter,
            backToCreation,
            downloadCharacter,
            getAttributeClass: utils.getAttributeClass,
            getAttributeRating: utils.getAttributeRating,
            getAttributeRatingClass: utils.getAttributeRatingClass,
            formatAbilityValue: utils.formatAbilityValue,
            getExtraStatChineseName: utils.getExtraStatChineseName,
            forceNewWeek,
            clearLocalStorage,
            generateDebugCharacter,
            showPasswordPrompt,
            toggleDeveloperTools
        };
    }
}).mount('#app');