# ScrollPilot - YouTube Shorts for VS Code

Watch YouTube Shorts while agents code for you! 🚀

## Features

- **Smart Channel Selection**: Configure your favorite YouTube channels and get Shorts from them
- **Navigation Controls**: Use arrow keys or click buttons to navigate between videos
- **Auto-play**: Automatically plays the next Short when one ends (configurable)
- **Sidebar Integration**: Dedicated YouTube Shorts view in your VS Code sidebar

## How to Use

1. **Sidebar Button**: Look for the heart icon (❤️) in the VS Code activity bar
2. **Navigation**: 
   - Use ↑/↓ arrow keys or click the navigation buttons
   - Arrow Down / Right = Next video
   - Arrow Up / Left = Previous video

For a full tab view, use the Command Palette -> ScrollPilot: Open YouTube Shorts


## Settings

You can customize these settings in VS Code:

- **Channels**: Array of YouTube channel names
- **Max Videos Per Channel**: Maximum videos to fetch per channel (1-50)
- **Autoplay**: Auto-play next video when current ends

## Troubleshooting

### "No Shorts found from configured channels"
- Check that your channel names are correct
- Make sure the channels actually have Short videos (≤60 seconds)
- Add more channels

### Endless Buffering or Videos not Loading
- Ensure fast and stable Internet connection (run a test [here](https://www.speedtest.net/))
- Ensure the firewall is not blocking YouTube