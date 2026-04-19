# DateSeasonSystem.js

> A step-based date and season system designed for RPG Maker MV. Time periods advance as the player moves, with 8 time segments making up one day, and four seasons distributed across a realistic 365-day annual calendar.

## Author
YOCIM

## Version
1.0.0

## Feature Overview
- **Time Segment Progression**: A day is divided into 8 segments (Dawn, Morning, Noon, Afternoon, Dusk, Evening, Midnight, Late Night). One segment advances every specified number of steps (default: 15 steps).
- **Date System**: The date increases by 1 every 8 segments (i.e., when cycling from Late Night back to Dawn). The maximum date is 365; exceeding it resets to day 1.
- **Season System**: Seasons are distributed across 365 days:
  - Spring: Day 1 ~ 91
  - Summer: Day 92 ~ 182
  - Autumn: Day 183 ~ 273
  - Winter: Day 274 ~ 365
- **Configurable Step Threshold**: The number of steps required to advance one time segment can be dynamically changed.
- **Real-time Display Window (Optional)**: Shows the current date, season, and time segment on the map.
- **Save/Load Support**: All data (date, segment, step accumulation, etc.) is fully preserved in save files.
- **Event Hooks**: Custom logic can be triggered when the season or time segment changes (e.g., playing sound effects, changing map tint).

## Installation
1. Copy `DateSeasonSystem.js` into your project's `js/plugins` folder.
2. In the RPG Maker MV editor, open the Plugin Manager and add this plugin.
3. Adjust the plugin parameters as needed (see the parameter table below).
4. Save your project and start the game.

## Plugin Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| `Starting Day` | Initial day when the game starts (1~365) | `1` |
| `Starting Time Segment` | Initial time segment index when the game starts (0~7)<br>0=Dawn, 1=Morning, 2=Noon, 3=Afternoon, 4=Dusk, 5=Evening, 6=Midnight, 7=Late Night | `0` |
| `Default Steps Per Segment` | Default number of steps required to advance one time segment | `15` |
| `Show Date Window` | Whether to display the date window on the map (`true`/`false`) | `true` |
| `Window X Position` | X coordinate of the date window (pixels) | `10` |
| `Window Y Position` | Y coordinate of the date window (pixels) | `10` |
| `Window Width` | Width of the date window (pixels) | `200` |
| `Window Height` | Height of the date window (pixels) | `100` |
| `Font Size` | Font size used in the date window (pixels) | `20` |

## Plugin Commands (used in "Plugin Command" event command)
```
DateSeasonSystem setSteps <steps>
```
**Example**: `DateSeasonSystem setSteps 20`  
Changes the number of steps required to advance a time segment to 20 steps.  
*Note: The step count must be at least 1.*

## Script Calls (via "Script" event command or other plugins)

### Retrieving Information
```js
$gameSystem.getDay();               // Returns the current day (1~365)
$gameSystem.getSeason();            // Returns the season index (0=Spring, 1=Summer, 2=Autumn, 3=Winter)
$gameSystem.getSeasonName();        // Returns the season name as a string (e.g., "Spring")
$gameSystem.getTimeSegment();       // Returns the time segment index (0~7)
$gameSystem.getTimeSegmentName();   // Returns the time segment name as a string (e.g., "Dawn")
$gameSystem.getStepsPerSegment();   // Returns the current steps required per segment
```

### Setting Values
```js
$gameSystem.setDay(100);            // Directly sets the date to day 100 (automatically checks for season changes)
$gameSystem.setTimeSegment(3);      // Directly sets the time segment index to 3 (Afternoon)
$gameSystem.setStepsPerSegment(25); // Sets the step threshold to 25
```

### Season / Time Segment Change Hooks
The plugin reserves two functions internally. You can override them in your own scripts to implement custom effects:
```js
// Automatically called when the season changes (e.g., change map tint)
$gameSystem.triggerSeasonChange = function() {
    // Your code, e.g., $gameMap.changeTone(0, 0, 0, 64);
    console.log("Season changed to: " + this.getSeasonName());
};

// Automatically called when the time segment changes (e.g., change ambient light)
$gameSystem.triggerTimeSegmentChange = function() {
    // Your code
    console.log("Time segment changed to: " + this.getTimeSegmentName());
};
```

## Usage Examples
### Example 1: Creating a Time Controller Event
Place a parallel process event on the map that checks for time segment changes every frame and plays corresponding sound effects:
```
◆Plugin Command: DateSeasonSystem setSteps 15
◆Script: $gameSystem.triggerTimeSegmentChange = function() {
    let t = this.getTimeSegmentName();
    if (t === 'Dawn') $gameSystem.playSe('morning');
    else if (t === 'Evening') $gameSystem.playSe('night');
}
```

### Example 2: Displaying Different Maps Based on Season
Use a common event to automatically switch map tilesets or screen tint when the season changes:
```
◆Script: $gameSystem.triggerSeasonChange = function() {
    switch(this.getSeason()) {
        case 0: $gameScreen.setTone(0,0,0,0); break;  // Spring
        case 1: $gameScreen.setTone(20,0,-20,0); break; // Summer
        case 2: $gameScreen.setTone(10,10,-10,0); break; // Autumn
        case 3: $gameScreen.setTone(-30,-30,0,68); break; // Winter
    }
}
```

## Important Notes
1. **Step accumulation is based on player movement**: Using transfers or events that directly change position does not increment steps and will not advance time.
2. **Date reset rule**: When the date exceeds 365, it resets to day 1 (the beginning of the year), and the season resets accordingly.
3. **Window refresh performance**: The date window refreshes every 30 frames by default and does not cause noticeable performance issues.
4. **Compatibility**: If used with other plugins that modify `Game_Player.increaseSteps` or `Game_System` initialization/save-load routines, adjust the plugin order to ensure this plugin is lower in the list (higher priority).
5. **No direct method to set season**: You can indirectly change the season using `setDay`, or directly modify `$gameSystem._currentDay` and manually update `_lastSeason`.

## Changelog
### 1.0.0 (Initial Release)
- Implemented step-driven time segment progression and date increment
- Supports 365 days / 4 seasons
- Provides optional UI window
- Full save/load support

## License
This plugin is released under the MIT License. You are free to use, modify, and distribute it, provided that the original author attribution is retained.

## Support & Feedback
For questions or suggestions, please contact the author YOCIM (via RPG Maker communities or by submitting an issue on GitHub).
