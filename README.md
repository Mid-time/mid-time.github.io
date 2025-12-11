# 灯塔
你好，我是Midtime，欢迎来到海岸旁的居所，愿潮汐能拂去您尘世浮华

## 瞭望台
深洋藏匿着恐惧与迷途，也倒映着失路者的残影

### 观测：神秘回响（TRPG）
- 物品购买计算器 [Go](https://mid-time.github.io/EchoOfMysteria/EchoItemCalculator)
- 战斗视图 [Go](https://mid-time.github.io/EchoOfMysteria/EchoBattleView)
- 战斗视图（移动端优化） [Go](https://mid-time.github.io/EchoOfMysteria/EchoBattleViewMobile)
- 规则书 v0.8.1 [Download](https://mid-time.github.io/EchoOfMysteria/EchoOfMysteriaRulebook.docx)
- 角色卡 v0.8.1
[Download](https://mid-time.github.io/EchoOfMysteria/EchoOfMysteriaCharacterSheet.xlsx)

### 观测：桌游
- 恶魔骰 [Go](https://mid-time.github.io/CheatDice)


### 观测：其他可能性
- 随机抽奖系统（只是模型） [Go](https://mid-time.github.io/LotterySystem)

### 观测：发光已不再
- 本来是一个益智小游戏，可是最后没实现 [Go](https://mid-time.github.io/MimicChest)
- 一个角色生成器，同样，没有实现 [Go](https://mid-time.github.io/dungeontest)

## 沙滩
贝壳里，封存着潮汐诉说的故事
- 新世界游戏：我抽个盲盒怎么就卷入大逃杀了（更新至第19章）*此小说暂且没有发表于网络*

## 联系我

- QQ: 3310764938
- Bilibili：Midtime [Go](https://b23.tv/82h1xgc)

---

*当你在迷雾中航行时，愿我的光芒为你指引方向*


目前存在以下问题：
修正没有显示HP,HPR,MP,MPR,SP,SPD的修正（体力，体力恢复，魔力，魔力恢复，清醒，清醒阈值），请增加显示空间，并且这些内容也是修正选择中的内容，需要显示
修正的文本不对，例如抽出了1速度+20%，应当生成一个1-20的随机数，然后显示1.速度+{此随机数}%，注意百分号是单位，部分没有百分号的修正文本需要注意显示的内容
不用显示当前周数，只用显示本周是否已经创建过角色！
点击显示开发者工具时，产生一个inputbox要求输入口令（口令密码为Midtime）才能使用，避免玩家使用开发者工具刷属性
删去重新生成角色属性选项和修正选项的按钮
属性总和显示 {不包括幸运总和} / {包括幸运总和} 同时调整位置不要占用太多篇幅
少年包含16岁
生成角色后如果本周已经生成过角色，点击本周已生成过角色按钮后会再次进入选择角色属性和修正的画面