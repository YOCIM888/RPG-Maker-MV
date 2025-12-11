//=============================================================================
// MiniMap.js
//=============================================================================
/*:
 * @plugindesc 在游戏中显示实时圆形小地图，用于位置追踪和事件标记
 * @author YOCIM
 *
 * @param Position
 * @desc 小地图在屏幕上的位置
 * @type select
 * @option 左上角
 * @value top-left
 * @option 右上角
 * @value top-right
 * @option 左下角
 * @value bottom-left
 * @option 右下角
 * @value bottom-right
 * @default top-right
 *
 * @param Radius
 * @desc 小地图圆形半径（像素）
 * @type number
 * @min 50
 * @max 150
 * @default 75
 *
 * @param Opacity
 * @desc 小地图背景透明度（0-255）
 * @type number
 * @min 0
 * @max 255
 * @default 180
 *
 * @param ShowFromStart
 * @desc 是否游戏开始时自动显示小地图
 * @type boolean
 * @on 显示
 * @off 隐藏
 * @default true
 *
 * @param ToggleKey
 * @desc 切换小地图显示的按键
 * @type select
 * @option M键
 * @value 77
 * @option Tab键
 * @value 9
 * @option F5键
 * @value 116
 * @default 77
 *
 * @param EventDotSize
 * @desc 事件标记点的大小（像素）
 * @type number
 * @min 4
 * @max 10
 * @default 6
 *
 * @param PlayerDotSize
 * @desc 玩家标记点的大小（像素）
 * @type number
 * @min 4
 * @max 10
 * @default 8
 *
 * @help
 * 使用说明：
 * 这个插件会在游戏画面中显示一个圆形小地图，实时追踪玩家位置和事件。
 * 可以通过插件参数调整小地图的位置、大小和透明度。
 * 按M键可以切换小地图的显示/隐藏状态。
 * 
 * 事件标记说明：
 * - 玩家：红色圆点
 * - 场所转移事件：蓝色圆点
 * - 普通事件：黄色圆点
 * 
 * 插件命令：
 * MiniMap show - 显示小地图
 * MiniMap hide - 隐藏小地图
 * MiniMap toggle - 切换小地图显示状态
 * MiniMap resize [radius] - 调整小地图大小(半径)
 */
(function() {
    'use strict';
    // 参数解析
    var parameters = PluginManager.parameters('MiniMap');
    var position = parameters['Position'] || 'top-right';
    var radius = Number(parameters['Radius'] || 75);
    var opacity = Number(parameters['Opacity'] || 180);
    var showFromStart = parameters['ShowFromStart'] !== 'false';
    var toggleKey = Number(parameters['ToggleKey'] || 77); // M键默认值
    var eventDotSize = Number(parameters['EventDotSize'] || 6);
    var playerDotSize = Number(parameters['PlayerDotSize'] || 8);
    
    // 存储小地图状态
    var _miniMapVisible = showFromStart;
    
    // 创建小地图精灵
    function Sprite_MiniMap() {
        this.initialize.apply(this, arguments);
    }
    
    Sprite_MiniMap.prototype = Object.create(Sprite.prototype);
    Sprite_MiniMap.prototype.constructor = Sprite_MiniMap;
    
    Sprite_MiniMap.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._mapWidth = 0;
        this._mapHeight = 0;
        this._tileWidth = 0;
        this._tileHeight = 0;
        this._playerMarker = null;
        this._eventMarkers = [];
        this._radius = radius;
        this.createBackground();
        this.createPlayerMarker();
        this.updatePosition();
        this.updateVisibility();
    };
    
    Sprite_MiniMap.prototype.createBackground = function() {
        this._background = new Sprite();
        var diameter = this._radius * 2;
        this._background.bitmap = new Bitmap(diameter, diameter);
        
        // 绘制圆形背景
        var context = this._background.bitmap._context;
        context.fillStyle = 'rgba(0, 0, 0, ' + (opacity / 255) + ')';
        context.beginPath();
        context.arc(this._radius, this._radius, this._radius, 0, Math.PI * 2);
        context.fill();
        
        // 绘制圆形边框
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(this._radius, this._radius, this._radius, 0, Math.PI * 2);
        context.stroke();
        
        this.addChild(this._background);
    };
    
    Sprite_MiniMap.prototype.createPlayerMarker = function() {
        // 创建玩家标记
        this._playerMarker = new Sprite();
        this._playerMarker.bitmap = new Bitmap(playerDotSize, playerDotSize);
        
        // 绘制圆形玩家标记
        var context = this._playerMarker.bitmap._context;
        context.fillStyle = 'red';
        context.beginPath();
        context.arc(playerDotSize/2, playerDotSize/2, playerDotSize/2, 0, Math.PI * 2);
        context.fill();
        
        this._playerMarker.anchor.x = 0.5;
        this._playerMarker.anchor.y = 0.5;
        this.addChild(this._playerMarker);
    };
    
    Sprite_MiniMap.prototype.createEventMarker = function(eventId, isTransfer) {
        // 创建事件标记
        var marker = new Sprite();
        var size = eventDotSize;
        marker.bitmap = new Bitmap(size, size);
        
        // 绘制事件标记
        var context = marker.bitmap._context;
        context.fillStyle = isTransfer ? 'blue' : 'yellow';
        context.beginPath();
        context.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        context.fill();
        
        marker.anchor.x = 0.5;
        marker.anchor.y = 0.5;
        marker.eventId = eventId;
        this.addChild(marker);
        this._eventMarkers.push(marker);
        
        return marker;
    };
    
    Sprite_MiniMap.prototype.clearEventMarkers = function() {
        // 清除所有事件标记
        for (var i = 0; i < this._eventMarkers.length; i++) {
            this.removeChild(this._eventMarkers[i]);
        }
        this._eventMarkers = [];
    };
    
    Sprite_MiniMap.prototype.updatePosition = function() {
        var padding = 10;
        var diameter = this._radius * 2;
        
        switch (position) {
            case 'top-left':
                this.x = padding;
                this.y = padding;
                break;
            case 'top-right':
                this.x = Graphics.boxWidth - diameter - padding;
                this.y = padding;
                break;
            case 'bottom-left':
                this.x = padding;
                this.y = Graphics.boxHeight - diameter - padding;
                break;
            case 'bottom-right':
                this.x = Graphics.boxWidth - diameter - padding;
                this.y = Graphics.boxHeight - diameter - padding;
                break;
        }
    };
    
    Sprite_MiniMap.prototype.updateMiniMap = function() {
        if (!$gamePlayer || !$gameMap) return;
        
        // 更新地图尺寸
        if (this._mapWidth !== $gameMap.width() || this._mapHeight !== $gameMap.height() || 
            this._tileWidth !== $gameMap.tileWidth() || this._tileHeight !== $gameMap.tileHeight()) {
            this._mapWidth = $gameMap.width();
            this._mapHeight = $gameMap.height();
            this._tileWidth = $gameMap.tileWidth();
            this._tileHeight = $gameMap.tileHeight();
        }
        
        // 计算缩放比例
        var scaleX = (this._radius * 2) / (this._mapWidth * this._tileWidth);
        var scaleY = (this._radius * 2) / (this._mapHeight * this._tileHeight);
        var scale = Math.min(scaleX, scaleY);
        
        // 更新玩家位置
        var playerX = ($gamePlayer.x * this._tileWidth + this._tileWidth / 2) * scale;
        var playerY = ($gamePlayer.y * this._tileHeight + this._tileHeight / 2) * scale;
        
        // 确保玩家标记在小地图圆形范围内
        var center = this._radius;
        var distance = Math.sqrt(Math.pow(playerX - center, 2) + Math.pow(playerY - center, 2));
        
        if (distance > this._radius - playerDotSize/2) {
            // 如果超出圆形范围，将其限制在圆形边缘
            var angle = Math.atan2(playerY - center, playerX - center);
            playerX = center + (this._radius - playerDotSize/2) * Math.cos(angle);
            playerY = center + (this._radius - playerDotSize/2) * Math.sin(angle);
        }
        
        this._playerMarker.x = playerX;
        this._playerMarker.y = playerY;
        
        // 更新事件标记
        this.updateEventMarkers(scale);
    };
    
    Sprite_MiniMap.prototype.updateEventMarkers = function(scale) {
        // 清除旧的事件标记
        this.clearEventMarkers();
        
        // 获取所有事件
        var events = $gameMap.events();
        var center = this._radius;
        
        for (var i = 1; i < events.length; i++) {
            var event = events[i];
            // 修复: 使用更可靠的方法检查事件是否有效
            if (!event || event._erased) continue;
            
            // 检查是否为场所转移事件
            var isTransfer = this.isTransferEvent(event);
            
            // 计算事件位置
            var eventX = (event.x * this._tileWidth + this._tileWidth / 2) * scale;
            var eventY = (event.y * this._tileHeight + this._tileHeight / 2) * scale;
            
            // 检查事件是否在圆形地图范围内
            var distance = Math.sqrt(Math.pow(eventX - center, 2) + Math.pow(eventY - center, 2));
            
            if (distance <= this._radius - eventDotSize/2) {
                // 在范围内，创建标记
                var marker = this.createEventMarker(event.eventId(), isTransfer);
                marker.x = eventX;
                marker.y = eventY;
            }
        }
    };
    
    Sprite_MiniMap.prototype.isTransferEvent = function(event) {
        // 检查事件是否为场所转移事件
        // 通过检查事件是否有转移相关的注释来判断
        var eventData = event.event();
        if (!eventData || !eventData.pages) return false;
        
        // 检查所有页面的注释
        for (var i = 0; i < eventData.pages.length; i++) {
            var page = eventData.pages[i];
            if (page.list) {
                for (var j = 0; j < page.list.length; j++) {
                    var command = page.list[j];
                    if (command.code === 201) { // 场所移动命令
                        return true;
                    }
                    // 检查注释
                    if (command.code === 108 || command.code === 408) {
                        if (command.parameters && command.parameters[0]) {
                            var comment = command.parameters[0].toLowerCase();
                            if (comment.includes("转移") || comment.includes("传送") || comment.includes("teleport")) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    };
    
    Sprite_MiniMap.prototype.updateVisibility = function() {
        this.visible = _miniMapVisible;
    };
    
    Sprite_MiniMap.prototype.resize = function(newRadius) {
        this._radius = newRadius;
        this.removeChild(this._background);
        this.createBackground();
        this.updatePosition();
    };
    
    // 覆盖更新方法
    Sprite_MiniMap.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (this.visible) {
            this.updateMiniMap();
        }
    };
    
    // 添加到场景中
    var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this.createMiniMap();
    };
    
    Scene_Map.prototype.createMiniMap = function() {
        this._miniMap = new Sprite_MiniMap();
        this.addChild(this._miniMap);
    };
    
    // 插件命令处理
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === 'MiniMap') {
            switch (args[0]) {
                case 'show':
                    _miniMapVisible = true;
                    if (SceneManager._scene._miniMap) {
                        SceneManager._scene._miniMap.updateVisibility();
                    }
                    break;
                case 'hide':
                    _miniMapVisible = false;
                    if (SceneManager._scene._miniMap) {
                        SceneManager._scene._miniMap.updateVisibility();
                    }
                    break;
                case 'toggle':
                    _miniMapVisible = !_miniMapVisible;
                    if (SceneManager._scene._miniMap) {
                        SceneManager._scene._miniMap.updateVisibility();
                    }
                    break;
                case 'resize':
                    if (args[1] && SceneManager._scene._miniMap) {
                        var newRadius = parseInt(args[1]);
                        if (!isNaN(newRadius) && newRadius >= 50 && newRadius <= 150) {
                            SceneManager._scene._miniMap.resize(newRadius);
                        }
                    }
                    break;
            }
        }
    };
    
    // 处理窗口大小改变
    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        if (this._miniMap) {
            this._miniMap.updatePosition();
        }
    };
    
    // 添加按键切换功能
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (Input.isTriggered(toggleKey)) {
            _miniMapVisible = !_miniMapVisible;
            if (this._miniMap) {
                this._miniMap.updateVisibility();
            }
        }
    };
})();