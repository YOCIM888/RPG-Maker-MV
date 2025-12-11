// 游戏时间系统
var GameTime = GameTime || {};

(function() {
    // 参数设置
    const MINUTES_PER_HOUR = 1; // 现实1分钟 = 游戏1小时
    const HOURS_PER_DAY = 24;   // 24小时 = 1天
    
    // 游戏数据
    GameTime._day = 1;
    GameTime._hour = 0;
    GameTime._minute = 0;
    GameTime._realTime = 0;
    GameTime._window = null;
    
    // 初始化
    GameTime.initialize = function() {
        this.createWindow();
        this.startTimer();
    };
    
    // 创建显示窗口
    GameTime.createWindow = function() {
        this._window = new Window_Base(0, 0, 200, 100);
        this._window.z = 10; // 确保在最上层
        SceneManager._scene.addWindow(this._window);
        this.refreshDisplay();
    };
    
    // 刷新显示
    GameTime.refreshDisplay = function() {
        if (!this._window) return;
        
        this._window.contents.clear();
        this._window.drawText(`Day ${this._day}`, 10, 10, 180);
        this._window.drawText(`${this.formatTime(this._hour)}:00`, 10, 40, 180);
    };
    
    // 格式化时间显示
    GameTime.formatTime = function(hour) {
        return hour.toString().padStart(2, '0');
    };
    
    // 开始计时器
    GameTime.startTimer = function() {
        this._realTime = 0;
    };
    
    // 更新 - 在场景的update中调用
    GameTime.update = function() {
        if (!this._window) return;
        
        this._realTime += 1/60; // 假设60FPS
        
        // 每现实1分钟增加1游戏小时
        if (this._realTime >= MINUTES_PER_HOUR * 60) {
            this._realTime = 0;
            this.incrementHour();
        }
    };
    
    // 增加小时
    GameTime.incrementHour = function() {
        this._hour++;
        
        // 如果超过24小时，增加一天
        if (this._hour >= HOURS_PER_DAY) {
            this._hour = 0;
            this._day++;
        }
        
        this.refreshDisplay();
    };
    
    // 获取当前天数
    GameTime.getDay = function() {
        return this._day;
    };
    
    // 获取当前小时
    GameTime.getHour = function() {
        return this._hour;
    };
    
    // 保存数据
    GameTime.saveData = function() {
        return {
            day: this._day,
            hour: this._hour,
            minute: this._minute
        };
    };
    
    // 加载数据
    GameTime.loadData = function(data) {
        if (data) {
            this._day = data.day || 1;
            this._hour = data.hour || 0;
            this._minute = data.minute || 0;
            this.refreshDisplay();
        }
    };
})();

// 挂钩到场景管理器
var _Scene_Map_create = Scene_Map.prototype.create;
Scene_Map.prototype.create = function() {
    _Scene_Map_create.call(this);
    GameTime.initialize();
};

var _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    GameTime.update();
};

// 保存和加载游戏数据
var _DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
    var contents = _DataManager_makeSaveContents.call(this);
    contents.gameTime = GameTime.saveData();
    return contents;
};

var _DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    GameTime.loadData(contents.gameTime);
};