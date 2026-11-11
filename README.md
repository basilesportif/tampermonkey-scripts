# Tampermonkey Scripts

A collection of userscripts for use with [Tampermonkey](https://www.tampermonkey.net/) browser extension.

## Scripts

| Script | Site | Description |
|--------|------|-------------|
| [espn-x-toggle-ui](./espn-x-toggle-ui.user.js) | espn.com | Press X to toggle player overlays/controls |
| [FOX World Cup - Nuke Spoiler Side Panel](./FOX%20World%20Cup%20-%20Nuke%20Spoiler%20Side%20Panel.user.js) | fox.com | Removes the FOX Watch side panel to avoid World Cup spoilers |
| [nba-remove-time-controls](./nba-remove-time-controls.user.js) | nba.com | Removes playback/time controls from video overlay; J/L seek 5s instead of 10s |
| [paramountplus-remove-sidebar](./paramountplus-remove-sidebar.user.js) | paramountplus.com | Removes sidebar plugin elements |
| [Paramount+ - hide replay pause ad](./Paramount+%20-%20hide%20replay%20pause%20ad.user.js) | paramountplus.com | Hides the pause-screen ad, dimming, and return button on replays |
| [Paramount+ - J-K-L player keys](./Paramount+%20-%20J-K-L%20player%20keys.user.js) | paramountplus.com | J/K/L keys: back 5s, play/pause, forward 5s |
| [peacock-minimal-controls](./peacock-minimal-controls.user.js) | peacocktv.com | Transparent controls moved lower: scrubber, time, play/pause, 10s skip, and settings/audio & subtitles; live and replay |
| [peacock-keep-time-and-playback-controls](./peacock-keep-time-and-playback-controls.user.js) | peacocktv.com | Older minimal overlay with time bar and play/skip controls |
| [peacock-timebar-only](./peacock-timebar-only.user.js) | peacocktv.com | Minimal overlay with time bar only |
| [Peacock J-K-L Keyboard Controls](./Peacock%20J-K-L%20Keyboard%20Controls.user.js) | peacocktv.com | J/K/L/U/O keyboard controls for skip and play/pause (see Known Issues) |

## Known Issues

- **Peacock J-K-L Keyboard Controls:** J doesn't work as intended. It goes back 10 seconds instead of 5.

## Naming Convention

```
{site}-{feature}.user.js
```

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click on a script file in this repository
3. Click the "Raw" button to trigger Tampermonkey's install prompt
4. Click "Install" in the Tampermonkey dialog

## License

MIT
