//=============================================================================
// DateSeasonSystem_VisualEffects.js
//=============================================================================
/*:
 * @plugindesc 为日期季节系统添加视觉效果，包括色调变化和天气效果
 * @author YOCIM
 *
 * @param Enable Screen Tones
 * @desc 是否启用屏幕色调变化（true/false）
 * @default true
 *
 * @param Enable Weather Effects
 * @desc 是否启用天气效果（true/false）
 * @default true
 *
 * @param Enable Weather Notifications
 * @desc 是否启用天气提示（true/false）
 * @default true
 *
 * @param Notification Duration
 * @desc 天气提示显示时间（帧数）
 * @default 180
 *
 * @param Notification X
 * @desc 天气提示X坐标
 * @default 0
 *
 * @param Notification Y
 * @desc 天气提示Y坐标
 * @default 100
 *
 * @param Notification Width
 * @desc 天气提示宽度
 * @default Graphics.boxWidth
 *
 * @param Transition Speed
 * @desc 色调过渡速度（帧数）
 * @default 180
 *
 * @param Weather Change Steps
 * @desc 天气变化所需的步数
 * @default 180
 *
 * @help
 * 此插件需要与DateSeasonSystem.js配合使用
 * 提供根据季节和时间段变化的视觉效果
 */
(function() {
    // 读取插件参数
    var parameters = PluginManager.parameters('DateSeasonSystem_VisualEffects');
    var enableScreenTones = parameters['Enable Screen Tones'] !== 'false';
    var enableWeatherEffects = parameters['Enable Weather Effects'] !== 'false';
    var enableWeatherNotifications = parameters['Enable Weather Notifications'] !== 'false';
    var notificationDuration = Number(parameters['Notification Duration'] || 180);
    var notificationX = Number(parameters['Notification X'] || 0);
    var notificationY = Number(parameters['Notification Y'] || 100);
    var notificationWidth = Number(parameters['Notification Width'] || Graphics.boxWidth);
    var transitionSpeed = Number(parameters['Transition Speed'] || 180);
    var weatherChangeSteps = Number(parameters['Weather Change Steps'] || 180);
    // 天气名称映射
    var weatherNames = {
        'none': '晴朗',
        'rain': '下雨',
        'snow': '下雪',
        'fog': '起雾',
        'storm': '暴风雨',
        'leaves': '落叶'
    };
    // 存储视觉效果数据
    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._currentTone = [0, 0, 0, 0];
        this._targetTone = [0, 0, 0, 0];
        this._toneTransitionFrames = 0;
        this._toneTransitionCount = 0;
        this._currentWeather = 'none';
        this._targetWeather = 'none';
        this._weatherPower = 0;
        this._targetWeatherPower = 0;
        this._stepCount = 0;
        this._randomWeather = 'none';
        this._stormFogSprite = null;
        this._isIndoors = false;
        this._lastWeather = 'none';
    };
    // 创建天气提示窗口类
    function Window_WeatherNotice() {
        this.initialize.apply(this, arguments);
    }
    Window_WeatherNotice.prototype = Object.create(Window_Base.prototype);
    Window_WeatherNotice.prototype.constructor = Window_WeatherNotice;
    Window_WeatherNotice.prototype.initialize = function() {
        var width = notificationWidth;
        var height = this.fittingHeight(1);
        var x = notificationX;
        var y = notificationY;
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.opacity = 0;
        this.contentsOpacity = 0;
        this._showCount = 0;
        this._weatherType = 'none';
        this.refresh();
    };
    Window_WeatherNotice.prototype.standardFontSize = function() {
        return 28;
    };
    Window_WeatherNotice.prototype.refresh = function() {
        this.contents.clear();
        if (this._weatherType && this._weatherType !== 'none') {
            var text = "天气: " + weatherNames[this._weatherType];
            this.drawText(text, 0, 0, this.contents.width, 'center');
        }
    };
    Window_WeatherNotice.prototype.showWeather = function(weatherType) {
        this._weatherType = weatherType;
        this.refresh();
        this._showCount = notificationDuration;
        this.opacity = 255;
        this.contentsOpacity = 255;
    };
    Window_WeatherNotice.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (this._showCount > 0) {
            this._showCount--;
            if (this._showCount <= 60) {
                this.contentsOpacity = this._showCount * 4;
            }
            if (this._showCount === 0) {
                this.opacity = 0;
            }
        }
    };
    // 在场景地图中添加天气提示窗口
    var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        if (enableWeatherNotifications) {
            this.createWeatherNoticeWindow();
        }
    };
    Scene_Map.prototype.createWeatherNoticeWindow = function() {
        this._weatherNoticeWindow = new Window_WeatherNotice();
        this.addChild(this._weatherNoticeWindow);
    };
    // 更新目标天气
    Game_System.prototype.updateTargetWeather = function() {
        if (!enableWeatherEffects) return;
        // 检查当前地图是否为室内
        this.checkIndoorsStatus();
        var season = this.getSeason();
        var weather = seasonWeather[season];
        // 如果有随机天气，使用随机天气
        if (this._randomWeather && this._randomWeather !== 'none') {
            weather = this.getRandomWeatherData(this._randomWeather);
        }
        this._targetWeather = weather.type;
        this._targetWeatherPower = weather.power;
        // 如果是夜晚，减少天气强度
        if (this.getTimeSegment() >= 4) {
            this._targetWeatherPower = Math.max(5, this._targetWeatherPower / 2);
        }
        // 应用天气变化
        this.changeWeather(this._targetWeather, this._targetWeatherPower, transitionSpeed);
        // 显示天气提示
        if (enableWeatherNotifications && this._targetWeather !== this._lastWeather) {
            this.showWeatherNotice(this._targetWeather);
            this._lastWeather = this._targetWeather;
        }
        // 如果是风暴天气，应用特殊效果
        if (this._randomWeather === 'storm') {
            this.applyStormEffect();
        } else {
            this.removeStormEffect();
        }
    };
    // 显示天气提示
    Game_System.prototype.showWeatherNotice = function(weatherType) {
        if (SceneManager._scene && SceneManager._scene._weatherNoticeWindow) {
            SceneManager._scene._weatherNoticeWindow.showWeather(weatherType);
        }
    };
    // 其余代码保持不变...
    // 定义各季节和时间段的色调
    var seasonTones = {
        // 春季色调 - 偏绿，明亮
        0: {
            0: [ -20,  10, -10,   0], // 清晨
            1: [ -10,  15, -15,   0], // 上昼
            2: [   0,  10, -10,   0], // 中午
            3: [ -10,  15, -15,   0], // 下昼
            4: [  30,  20, -20,   0], // 黄昏
            5: [  50, -20, -30,  20], // 晚夜
            6: [  70, -40, -50,  40], // 午夜
            7: [  40, -10, -30,  10]  // 凌晨
        },
        // 夏季色调 - 偏黄，饱和度高
        1: {
            0: [ -10,  20, -20,   0], // 清晨
            1: [   0,  30, -20,   0], // 上昼
            2: [  10,  40, -20,   0], // 中午
            3: [   0,  30, -20,   0], // 下昼
            4: [  40,  30, -10,   0], // 黄昏
            5: [  60, -10, -20,  10], // 晚夜
            6: [  80, -30, -40,  30], // 午夜
            7: [  50,   0, -20,   5]  // 凌晨
        },
        // 秋季色调 - 偏橙，温暖
        2: {
            0: [  10,  15, -15,   0], // 清晨
            1: [  20,  20, -15,   0], // 上昼
            2: [  30,  25, -10,   0], // 中午
            3: [  20,  20, -15,   0], // 下昼
            4: [  50,  30,   0,   0], // 黄昏
            5: [  70,   0, -10,  15], // 晚夜
            6: [  90, -20, -30,  25], // 午夜
            7: [  60,  10, -15,  10]  // 凌晨
        },
        // 冬季色调 - 偏蓝，冷色调
        3: {
            0: [ -30, -20,  10,  20], // 清晨
            1: [ -20, -15,  10,  10], // 上昼
            2: [ -10, -10,  10,   5], // 中午
            3: [ -20, -15,  10,  10], // 下昼
            4: [   0, -10,  20,   0], // 黄昏
            5: [  20, -30,  10,  30], // 晚夜
            6: [  40, -50,   0,  50], // 午夜
            7: [  10, -40,   5,  20]  // 凌晨
        }
    };
    // 定义各季节的天气效果
    var seasonWeather = {
        0: { type: 'none', power: 0 }, // 春季 - 无特殊天气
        1: { type: 'none', power: 0 }, // 夏季 - 无特殊天气
        2: { type: 'leaves', power: 20 }, // 秋季 - 落叶
        3: { type: 'snow', power: 30 } // 冬季 - 雪
    };
    // 定义随机天气及其概率
    var randomWeathers = [
        { type: 'none', power: 0, probability: 24 },    // 晴
        { type: 'rain', power: 30, probability: 24 },   // 雨
        { type: 'snow', power: 30, probability: 24 },   // 雪
        { type: 'fog', power: 40, probability: 24 },    // 阴
        { type: 'storm', power: 60, probability: 4 }    // 风暴
    ];
    // 更新目标色调
    Game_System.prototype.updateTargetTone = function() {
        if (!enableScreenTones) return;
        var season = this.getSeason();
        var timeSegment = this.getTimeSegment();
        // 获取目标色调
        this._targetTone = seasonTones[season][timeSegment];
        this._toneTransitionFrames = transitionSpeed;
        this._toneTransitionCount = 0;
        // 应用初始色调
        this.applyCurrentTone();
    };
    // 获取随机天气数据
    Game_System.prototype.getRandomWeatherData = function(weatherType) {
        for (var i = 0; i < randomWeathers.length; i++) {
            if (randomWeathers[i].type === weatherType) {
                return randomWeathers[i];
            }
        }
        return { type: 'none', power: 0 };
    };
    // 应用当前色调
    Game_System.prototype.applyCurrentTone = function() {
        if ($gameScreen) {
            $gameScreen.startTint(this._currentTone, 0);
        }
    };
    // 改变天气
    Game_System.prototype.changeWeather = function(type, power, duration) {
        if ($gameScreen) {
            $gameScreen.changeWeather(type, power, duration || 0);
        }
    };
    // 检查当前地图是否为室内
    Game_System.prototype.checkIndoorsStatus = function() {
        var mapId = $gameMap.mapId();
        // 这里可以根据地图ID或其他特征判断是否为室内
        // 简单实现：地图名称包含"室内"或"屋内"等关键词判断为室内
        var mapName = $dataMapInfos[mapId] ? $dataMapInfos[mapId].name : "";
        this._isIndoors = mapName.includes("室内") || mapName.includes("屋内") || 
                         mapName.includes("房子") || mapName.includes("屋");
    };
    // 应用风暴效果
    Game_System.prototype.applyStormEffect = function() {
        // 如果是室内，不应用风暴效果
        if (this._isIndoors) {
            this.removeStormEffect();
            return;
        }
        // 创建或获取风暴雾效果精灵
        if (!this._stormFogSprite && SceneManager._scene instanceof Scene_Map) {
            this._stormFogSprite = new Sprite();
            this._stormFogSprite.bitmap = new Bitmap(Graphics.width, Graphics.height);
            this._stormFogSprite.bitmap.fillAll("rgba(50, 50, 50, 0.7)");
            this._stormFogSprite.z = 10;
            SceneManager._scene.addChild(this._stormFogSprite);
        }
        // 更新风暴效果
        this.updateStormEffect();
    };
    // 移除风暴效果
    Game_System.prototype.removeStormEffect = function() {
        if (this._stormFogSprite) {
            SceneManager._scene.removeChild(this._stormFogSprite);
            this._stormFogSprite = null;
        }
    };
    // 更新风暴效果
    Game_System.prototype.updateStormEffect = function() {
        if (!this._stormFogSprite || !$gamePlayer) return;
        // 清除之前的位图
        this._stormFogSprite.bitmap.clear();
        // 绘制灰色背景
        this._stormFogSprite.bitmap.fillAll("rgba(50, 50, 50, 0.7)");
        // 计算玩家中心位置
        var centerX = $gamePlayer.screenX();
        var centerY = $gamePlayer.screenY();
        // 计算可见范围（1格方块的半径）
        var radius = 48; // 假设1格为48像素
        // 创建圆形渐变（从中心透明到边缘灰色）
        var gradient = this._stormFogSprite.bitmap.context.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(50, 50, 50, 0)');
        gradient.addColorStop(1, 'rgba(50, 50, 50, 0.7)');
        // 绘制可见区域
        this._stormFogSprite.bitmap.context.fillStyle = gradient;
        this._stormFogSprite.bitmap.context.fillRect(0, 0, Graphics.width, Graphics.height);
    };
    // 每帧更新色调过渡
    Game_System.prototype.updateToneTransition = function() {
        if (this._toneTransitionCount < this._toneTransitionFrames) {
            var ratio = this._toneTransitionCount / this._toneTransitionFrames;
            for (var i = 0; i < 4; i++) {
                this._currentTone[i] = Math.round(
                    this._currentTone[i] * (1 - ratio) + this._targetTone[i] * ratio
                );
            }
            this._toneTransitionCount++;
            this.applyCurrentTone();
        }
    };
    // 更新步数计数和随机天气
    var _Game_Player_increaseSteps = Game_Player.prototype.increaseSteps;
    Game_Player.prototype.increaseSteps = function() {
        _Game_Player_increaseSteps.call(this);
        if ($gameSystem) {
            $gameSystem._stepCount++;
            // 每180步尝试改变天气
            if ($gameSystem._stepCount >= weatherChangeSteps) {
                $gameSystem._stepCount = 0;
                $gameSystem.changeRandomWeather();
            }
            // 更新风暴效果（如果存在）
            if ($gameSystem._randomWeather === 'storm') {
                $gameSystem.updateStormEffect();
            }
        }
    };
    // 改变随机天气
    Game_System.prototype.changeRandomWeather = function() {
        // 生成随机数决定天气
        var randomValue = Math.random() * 100;
        var cumulativeProbability = 0;
        for (var i = 0; i < randomWeathers.length; i++) {
            cumulativeProbability += randomWeathers[i].probability;
            if (randomValue <= cumulativeProbability) {
                this._randomWeather = randomWeathers[i].type;
                break;
            }
        }
        // 更新天气效果
        this.updateTargetWeather();
        console.log("天气变为: " + this._randomWeather);
    };
    // 重写季节变化事件
    var _Game_System_triggerSeasonChange = Game_System.prototype.triggerSeasonChange;
    Game_System.prototype.triggerSeasonChange = function() {
        _Game_System_triggerSeasonChange.call(this);
        this.updateTargetTone();
        this.updateTargetWeather();
        console.log("季节变为: " + this.getSeasonName() + ", 应用新的视觉效果");
    };
    // 重写时间段变化事件
    var _Game_System_triggerTimeSegmentChange = Game_System.prototype.triggerTimeSegmentChange;
    Game_System.prototype.triggerTimeSegmentChange = function() {
        _Game_System_triggerTimeSegmentChange.call(this);
        this.updateTargetTone();
        this.updateTargetWeather();
        console.log("时间段变为: " + this.getTimeSegmentName() + ", 应用新的视觉效果");
    };
    // 在场景更新时处理色调过渡
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if ($gameSystem) {
            $gameSystem.updateToneTransition();
        }
    };
    // 初始化时应用当前色调和天气
    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        if ($gameSystem) {
            $gameSystem.updateTargetTone();
            $gameSystem.updateTargetWeather();
        }
    };
    // 保存和加载游戏数据
    var _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        if ($gameSystem) {
            $gameSystem._currentTone = contents.currentTone || [0, 0, 0, 0];
            $gameSystem._targetTone = contents.targetTone || [0, 0, 0, 0];
            $gameSystem._toneTransitionFrames = contents.toneTransitionFrames || 0;
            $gameSystem._toneTransitionCount = contents.toneTransitionCount || 0;
            $gameSystem._stepCount = contents.stepCount || 0;
            $gameSystem._randomWeather = contents.randomWeather || 'none';
            $gameSystem._lastWeather = contents.lastWeather || 'none';
            // 加载后立即应用当前色调
            $gameSystem.applyCurrentTone();
        }
    };
    var _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        var contents = _DataManager_makeSaveContents.call(this);
        if ($gameSystem) {
            contents.currentTone = $gameSystem._currentTone;
            contents.targetTone = $gameSystem._targetTone;
            contents.toneTransitionFrames = $gameSystem._toneTransitionFrames;
            contents.toneTransitionCount = $gameSystem._toneTransitionCount;
            contents.stepCount = $gameSystem._stepCount;
            contents.randomWeather = $gameSystem._randomWeather;
            contents.lastWeather = $gameSystem._lastWeather;
        }
        return contents;
    };
    // 初始化游戏时应用当前色调和天气
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'DateSeasonSystem' && args[0] === 'initVisuals') {
            if ($gameSystem) {
                $gameSystem.updateTargetTone();
                $gameSystem.updateTargetWeather();
            }
        }
    };
})();

