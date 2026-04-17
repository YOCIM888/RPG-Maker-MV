# DateSeasonSystem.js

> 一个为 RPG Maker MV 设计的基于步数的日期与季节系统。通过移动步数推进一天中的时间段，每 8 个时间段为一天，按 365 天真实年历划分四季。

## 作者
YOCIM

## 版本
1.0.0

## 功能概述
- **时间段推进**：一天分为 8 个时间段（清晨、上昼、中午、下昼、黄昏、晚夜、午夜、凌晨），每移动指定步数（默认 15 步）推进一个时间段。
- **日期系统**：每 8 个时间段（即从凌晨再次回到凌晨）日期 +1，最大 365 天，超出则重置为第 1 天。
- **四季系统**：按 365 天分配四季：
  - 春季：第 1 ~ 91 天
  - 夏季：第 92 ~ 182 天
  - 秋季：第 183 ~ 273 天
  - 冬季：第 274 ~ 365 天
- **可配置步数阈值**：允许动态修改每推进一个时间段所需步数。
- **实时显示窗口**（可选）：在地图上显示当前日期、季节和时段。
- **保存/加载支持**：所有数据（日期、时段、步数累计等）均可正常存档读档。
- **事件钩子**：季节变化或时段变化时可触发自定义逻辑（如播放音效、改变地图色调）。

## 安装方法
1. 将 `DateSeasonSystem.js` 复制到项目的 `js/plugins` 文件夹中。
2. 在 RPG Maker MV 编辑器中选择「插件管理」，添加本插件。
3. 根据需要调整插件参数（见下方参数表）。
4. 保存项目并开始游戏。

## 插件参数
| 参数名 | 说明 | 默认值 |
|--------|------|--------|
| `Starting Day` | 游戏开始时的初始日期（1~365） | `1` |
| `Starting Time Segment` | 游戏开始时的初始时段索引（0~7）<br>0=清晨，1=上昼，2=中午，3=下昼，4=黄昏，5=晚夜，6=午夜，7=凌晨 | `0` |
| `Default Steps Per Segment` | 每推进一个时段所需的默认步数 | `15` |
| `Show Date Window` | 是否在地图上显示日期窗口（`true`/`false`） | `true` |
| `Window X Position` | 日期窗口的 X 坐标（像素） | `10` |
| `Window Y Position` | 日期窗口的 Y 坐标（像素） | `10` |
| `Window Width` | 日期窗口的宽度（像素） | `200` |
| `Window Height` | 日期窗口的高度（像素） | `100` |
| `Font Size` | 日期窗口的字体大小（像素） | `20` |

## 插件指令（事件中的「插件指令」）
```
DateSeasonSystem setSteps <步数>
```
**示例**：`DateSeasonSystem setSteps 20`  
将每推进一个时段所需的步数改为 20 步。  
*注意：步数至少为 1。*

## 脚本调用（通过「脚本」事件命令或其它插件）

### 获取信息
```js
$gameSystem.getDay();               // 返回当前日期 (1~365)
$gameSystem.getSeason();            // 返回季节索引 (0=春,1=夏,2=秋,3=冬)
$gameSystem.getSeasonName();        // 返回季节名称字符串 (如 "春季")
$gameSystem.getTimeSegment();       // 返回时段索引 (0~7)
$gameSystem.getTimeSegmentName();   // 返回时段名称字符串 (如 "清晨")
$gameSystem.getStepsPerSegment();   // 返回当前每推进一个时段所需的步数
```

### 设置数值
```js
$gameSystem.setDay(100);            // 直接设置日期为第 100 天（自动检查季节变化）
$gameSystem.setTimeSegment(3);      // 直接设置时段索引为 3（下昼）
$gameSystem.setStepsPerSegment(25); // 设置步数阈值为 25
```

### 季节/时段变化钩子
插件内部预留了两个函数，您可以在自己的脚本中覆盖它们以实现自定义效果：
```js
// 季节变化时自动调用（例如：改变地图色调）
$gameSystem.triggerSeasonChange = function() {
    // 你的代码，比如 $gameMap.changeTone(0, 0, 0, 64);
    console.log("季节变为：" + this.getSeasonName());
};

// 时段变化时自动调用（例如：改变环境光）
$gameSystem.triggerTimeSegmentChange = function() {
    // 你的代码
    console.log("时段变为：" + this.getTimeSegmentName());
};
```

## 使用示例
### 示例 1：创建时间控制器事件
在地图上放置一个并行处理事件，每帧检查时段变化并播放对应音效：
```
◆插件指令：DateSeasonSystem setSteps 15
◆脚本：$gameSystem.triggerTimeSegmentChange = function() {
    let t = this.getTimeSegmentName();
    if (t === '清晨') $gameSystem.playSe('morning');
    else if (t === '晚夜') $gameSystem.playSe('night');
}
```

### 示例 2：根据季节显示不同地图
使用公共事件，当季节变化时自动切换地图图块或色调：
```
◆脚本：$gameSystem.triggerSeasonChange = function() {
    switch(this.getSeason()) {
        case 0: $gameScreen.setTone(0,0,0,0); break;  // 春
        case 1: $gameScreen.setTone(20,0,-20,0); break; // 夏
        case 2: $gameScreen.setTone(10,10,-10,0); break; // 秋
        case 3: $gameScreen.setTone(-30,-30,0,68); break; // 冬
    }
}
```

## 注意事项
1. **步数累计基于玩家移动**：使用传送或事件直接改变位置不会增加步数，也不会推进时间。
2. **日期重置规则**：日期超过 365 后会重置为第 1 天（年初），同时季节也会相应重置。
3. **窗口刷新性能**：日期窗口默认每 30 帧刷新一次，不会造成明显性能负担。
4. **兼容性**：若与其他修改 `Game_Player.increaseSteps` 或 `Game_System` 初始化/存读档的插件共用，请调整插件顺序，确保本插件在下方（优先级较高）。
5. **没有提供设置季节的直接方法**：您可以通过 `setDay` 间接改变季节，或直接修改 `$gameSystem._currentDay` 并手动更新 `_lastSeason`。

## 更新日志
### 1.0.0 (初始版本)
- 实现步数驱动的时段推进和日期增加
- 支持 365 天 / 4 季节
- 提供可选 UI 窗口
- 完整保存/加载支持

## 许可证
本插件采用 MIT 许可证。您可以自由使用、修改和分发，但需保留作者署名。

## 支持与反馈
如有问题或建议，请联系作者 YOCIM（可通过 RPG Maker 社区或 GitHub 提交 issue）。
