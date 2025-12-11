//=============================================================================
// DateSeasonSystem.js
//=============================================================================

/*:
 * @plugindesc 基于步数的日期和季节系统，可自定义步数改变时间段，每8个时间段推进一天，按365天一年计算季节。
 * @author YOCIM
 *
 * @param Starting Day
 * @desc 游戏开始的日期（默认：1）
 * @default 1
 *
 * @param Starting Time Segment
 * @desc 游戏开始的时间段（0-7）
 * @default 0
 *
 * @param Default Steps Per Segment
 * @desc 默认每多少步改变一个时间段
 * @default 15
 *
 * @param Show Date Window
 * @desc 是否显示日期窗口（true/false）
 * @default true
 *
 * @param Window X Position
 * @desc 日期窗口的X坐标
 * @default 10
 *
 * @param Window Y Position
 * @desc 日期窗口的Y坐标
 * @default 10
 *
 * @param Window Width
 * @desc 日期窗口的宽度
 * @default 200
 *
 * @param Window Height
 * @desc 日期窗口的高度
 * @default 100
 *
 * @param Font Size
 * @desc 日期窗口的字体大小
 * @default 20
 *
 * @help
 * 使用说明：
 * 1. 将本插件放入js/plugins文件夹
 * 2. 在RMMV插件管理中启用本插件
 * 
 * 系统说明：
 * - 时间分为8个时间段：清晨、上昼、中午、下昼、黄昏、晚夜、午夜、凌晨
 * - 每移动指定步数改变一个时间段（默认15步，可通过插件指令修改）
 * - 每8个时间段推进一天
 * - 一年365天，季节分配：春季(1-91天)、夏季(92-182天)、秋季(183-273天)、冬季(274-365天)
 * 
 * 插件指令：
 * - 设置步数阈值：DateSeasonSystem setSteps 20 （将步数阈值设为20步）
 * 
 * 脚本调用：
 * - 获取当前日期：$gameSystem.getDay();
 * - 获取当前季节：$gameSystem.getSeason();
 * - 获取季节名称：$gameSystem.getSeasonName();
 * - 获取当前时间段：$gameSystem.getTimeSegment();
 * - 获取时间段名称：$gameSystem.getTimeSegmentName();
 * - 直接设置日期：$gameSystem.setDay(15);
 * - 直接设置季节：$gameSystem.setSeason(2); // 0=春,1=夏,2=秋,3=冬
 * - 直接设置时间段：$gameSystem.setTimeSegment(3);
 * - 获取步数阈值：$gameSystem.getStepsPerSegment();
 * - 设置步数阈值：$gameSystem.setStepsPerSegment(20);
 */

(function() {
    // 读取插件参数
    var parameters = PluginManager.parameters('DateSeasonSystem');
    var startingDay = Number(parameters['Starting Day'] || 1);
    var startingTimeSegment = Number(parameters['Starting Time Segment'] || 0);
    var defaultStepsPerSegment = Number(parameters['Default Steps Per Segment'] || 15);
    var showDateWindow = parameters['Show Date Window'] === 'true';
    var windowX = Number(parameters['Window X Position'] || 10);
    var windowY = Number(parameters['Window Y Position'] || 10);
    var windowWidth = Number(parameters['Window Width'] || 200);
    var windowHeight = Number(parameters['Window Height'] || 100);
    var fontSize = Number(parameters['Font Size'] || 20);
    
    // 时间段名称
    var timeSegmentNames = ['清晨', '上昼', '中午', '下昼', '黄昏', '晚夜', '午夜', '凌晨'];
    
    // 季节名称
    var seasonNames = ['春季', '夏季', '秋季', '冬季'];
    
    // 存储日期、季节和时间段数据
    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._currentDay = startingDay;
        this._currentTimeSegment = startingTimeSegment;
        this._stepCount = 0;
        this._stepsPerSegment = defaultStepsPerSegment;
        this._lastSeason = this.getSeason();
        this._lastTimeSegment = this._currentTimeSegment;
    };
    
    // 获取步数阈值
    Game_System.prototype.getStepsPerSegment = function() {
        return this._stepsPerSegment || defaultStepsPerSegment;
    };
    
    // 设置步数阈值
    Game_System.prototype.setStepsPerSegment = function(steps) {
        if (steps >= 1) {
            this._stepsPerSegment = steps;
        }
    };
    
    // 获取当前日期
    Game_System.prototype.getDay = function() {
        return this._currentDay || startingDay;
    };
    
    // 获取当前季节索引
    Game_System.prototype.getSeason = function() {
        var day = this.getDay();
        if (day <= 91) return 0; // 春季
        if (day <= 182) return 1; // 夏季
        if (day <= 273) return 2; // 秋季
        return 3; // 冬季
    };
    
    // 获取季节名称
    Game_System.prototype.getSeasonName = function() {
        return seasonNames[this.getSeason()];
    };
    
    // 获取当前时间段
    Game_System.prototype.getTimeSegment = function() {
        return this._currentTimeSegment || startingTimeSegment;
    };
    
    // 获取时间段名称
    Game_System.prototype.getTimeSegmentName = function() {
        return timeSegmentNames[this.getTimeSegment()];
    };
    
    // 设置日期
    Game_System.prototype.setDay = function(day) {
        this._currentDay = day;
        this._lastSeason = this.getSeason(); // 更新最后季节记录
    };
    
    // 设置时间段
    Game_System.prototype.setTimeSegment = function(segment) {
        if (segment >= 0 && segment <= 7) {
            this._currentTimeSegment = segment;
            this._lastTimeSegment = segment; // 更新最后时间段记录
        }
    };
    
    // 更新步数计数
    Game_System.prototype.updateStepCount = function() {
        this._stepCount = (this._stepCount || 0) + 1;
        var stepsNeeded = this.getStepsPerSegment();
        
        // 每指定步数改变时间段
        if (this._stepCount >= stepsNeeded) {
            this._stepCount = 0;
            this._currentTimeSegment = (this._currentTimeSegment + 1) % 8;
            
            // 如果回到凌晨(时间段7→0)，则增加一天
            if (this._currentTimeSegment === 0) {
                this._currentDay = (this._currentDay || startingDay) + 1;
                
                // 如果超过365天，重置为第1天
                if (this._currentDay > 365) {
                    this._currentDay = 1;
                }
                
                // 检查季节是否变化
                var currentSeason = this.getSeason();
                if (currentSeason !== this._lastSeason) {
                    this._lastSeason = currentSeason;
                    // 触发季节变化事件
                    this.triggerSeasonChange();
                }
            }
            
            // 检查时间段是否变化
            if (this._currentTimeSegment !== this._lastTimeSegment) {
                this._lastTimeSegment = this._currentTimeSegment;
                // 触发时间段变化事件
                this.triggerTimeSegmentChange();
            }
        }
    };
    
    // 触发季节变化事件
    Game_System.prototype.triggerSeasonChange = function() {
        // 这里可以添加季节变化时的处理逻辑
        // 例如：改变地图色调、播放音效等
        console.log("季节变为: " + this.getSeasonName());
    };
    
    // 触发时间段变化事件
    Game_System.prototype.triggerTimeSegmentChange = function() {
        // 这里可以添加时间段变化时的处理逻辑
        // 例如：改变光照、播放音效等
        console.log("时间段变为: " + this.getTimeSegmentName());
    };
    
    // 重写Game_Player的increaseSteps方法以跟踪步数
    var _Game_Player_increaseSteps = Game_Player.prototype.increaseSteps;
    Game_Player.prototype.increaseSteps = function() {
        _Game_Player_increaseSteps.call(this);
        $gameSystem.updateStepCount();
    };
    
    // 处理插件指令
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'DateSeasonSystem') {
            if (args[0] === 'setSteps' && args[1]) {
                var steps = parseInt(args[1]);
                if (!isNaN(steps) && steps >= 1) {
                    $gameSystem.setStepsPerSegment(steps);
                }
            }
        }
    };
    
    // 创建日期显示窗口
    if (showDateWindow) {
        var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
        Scene_Map.prototype.createDisplayObjects = function() {
            _Scene_Map_createDisplayObjects.call(this);
            this.createDateWindow();
        };
        
        Scene_Map.prototype.createDateWindow = function() {
            this._dateWindow = new Window_Date();
            this.addChild(this._dateWindow);
        };
        
        // 日期窗口类
        function Window_Date() {
            this.initialize.apply(this, arguments);
        }
        
        Window_Date.prototype = Object.create(Window_Base.prototype);
        Window_Date.prototype.constructor = Window_Date;
        
        Window_Date.prototype.initialize = function() {
            Window_Base.prototype.initialize.call(this, windowX, windowY, windowWidth, windowHeight);
            this.refresh();
        };
        
        Window_Date.prototype.standardFontSize = function() {
            return fontSize;
        };
        
        Window_Date.prototype.refresh = function() {
            this.contents.clear();
            if (!this.contents) return;
            
            var day = $gameSystem.getDay();
            var season = $gameSystem.getSeasonName();
            var timeSegment = $gameSystem.getTimeSegmentName();
            
            // 设置文本样式
            this.contents.fontSize = this.standardFontSize();
            this.contents.textColor = '#ffffff';
            
            // 计算文本位置
            var lineHeight = this.lineHeight();
            var y = (this.height - lineHeight * 3) / 2 - lineHeight / 2;
            
            // 绘制日期
            this.drawText('第 ' + day + ' 天', 0, y, this.contents.width, 'center');
            
            // 绘制季节
            this.drawText(season, 0, y + lineHeight, this.contents.width, 'center');
            
            // 绘制时间段
            this.drawText(timeSegment, 0, y + lineHeight * 2, this.contents.width, 'center');
        };
        
        Window_Date.prototype.update = function() {
            Window_Base.prototype.update.call(this);
            // 每帧都刷新，确保内容实时更新
            if (Graphics.frameCount % 30 === 0) {
                this.refresh();
            }
        };
    }
    
    // 保存和加载游戏数据
    var _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        $gameSystem._currentDay = contents.currentDay || startingDay;
        $gameSystem._currentTimeSegment = contents.currentTimeSegment || startingTimeSegment;
        $gameSystem._stepCount = contents.stepCount || 0;
        $gameSystem._stepsPerSegment = contents.stepsPerSegment || defaultStepsPerSegment;
        $gameSystem._lastSeason = contents.lastSeason || $gameSystem.getSeason();
        $gameSystem._lastTimeSegment = contents.lastTimeSegment || startingTimeSegment;
    };
    
    var _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        var contents = _DataManager_makeSaveContents.call(this);
        contents.currentDay = $gameSystem.getDay();
        contents.currentTimeSegment = $gameSystem.getTimeSegment();
        contents.stepCount = $gameSystem._stepCount || 0;
        contents.stepsPerSegment = $gameSystem.getStepsPerSegment();
        contents.lastSeason = $gameSystem._lastSeason;
        contents.lastTimeSegment = $gameSystem._lastTimeSegment;
        return contents;
    };
})();