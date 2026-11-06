# Tampermonkey Scripts

A collection of userscripts for use with [Tampermonkey](https://www.tampermonkey.net/) browser extension.

## Scripts

| Script | Site | Description |
|--------|------|-------------|
| [nba-remove-scrubbar](./nba-remove-scrubbar.user.js) | nba.com | Removes scrub bar and time controls from video overlay |
| [paramountplus-remove-sidebar](./paramountplus-remove-sidebar.user.js) | paramountplus.com | Removes sidebar plugin elements |
| [Paramount+ - J-K-L player keys](./Paramount+%20-%20J-K-L%20player%20keys.user.js) | paramountplus.com | J/K/L keys: back 5s, play/pause, forward 5s |
| [peacock-timebar-only](./peacock-timebar-only.user.js) | peacocktv.com | Minimal overlay with time bar only |
| [peacock-minimal-controls](./peacock-minimal-controls.user.js) | peacocktv.com | Minimal overlay with time bar and play/skip controls |
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
