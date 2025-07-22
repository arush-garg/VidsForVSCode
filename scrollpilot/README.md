# ScrollPilot - YouTube Shorts for VS Code

Watch YouTube Shorts while agents code for you! 🚀

## Features

- **Smart Channel Selection**: Configure your favorite YouTube channels and get Shorts from them
- **YouTube Data API Integration**: Fetches real YouTube Shorts using the official API
- **Navigation Controls**: Use arrow keys or click buttons to navigate between videos
- **Auto-play**: Automatically plays the next Short when one ends (configurable)
- **Sidebar Integration**: Dedicated YouTube Shorts view in your VS Code sidebar
- **Settings UI**: Easy configuration through VS Code commands

## Setup Instructions

### 1. Get a YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### 2. Configure the Extension

1. **Set API Key**: 
   - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Run `ScrollPilot: Set YouTube API Key`
   - Paste your API key

2. **Configure Channels**:
   - Run `ScrollPilot: Configure Channels`
   - Enter channel IDs separated by commas
   - To find a channel ID: Go to the channel page and copy the ID from the URL (e.g., `UCq-Fj5jknLsUf-MWSy4_brA`)

## How to Use

1. **Sidebar Button**: Look for the heart icon (❤️) in the VS Code activity bar
2. **Command Palette**: Use `ScrollPilot: Open YouTube Shorts`
3. **Navigation**: 
   - Use ↑/↓ arrow keys or click the navigation buttons
   - Arrow Down / Right = Next video
   - Arrow Up / Left = Previous video
4. **Auto-Launch**: Automatically opens when you interact with GitHub Copilot

## Default Channels

The extension comes pre-configured with some popular Short-form content channels:
- MrBeast Shorts
- Dude Perfect
- MrBeast Gaming

You can change these using the "Configure Channels" command.

## Settings

You can customize these settings in VS Code:

- `scrollpilot.youtubeApiKey`: Your YouTube Data API key
- `scrollpilot.channels`: Array of YouTube channel IDs
- `scrollpilot.maxVideosPerChannel`: Maximum videos to fetch per channel (1-50)
- `scrollpilot.autoplay`: Auto-play next video when current ends

## Commands

- `ScrollPilot: Set YouTube API Key`: Configure your YouTube API key
- `ScrollPilot: Configure Channels`: Set up your preferred YouTube channels
- `ScrollPilot: Open YouTube Shorts`: Opens YouTube Shorts in a new tab

## Requirements

- VS Code 1.101.0 or higher
- YouTube Data API v3 key (free from Google Cloud Console)
- Internet connection

## Troubleshooting

### "YouTube API key not configured"
- Make sure you've run the "Set YouTube API Key" command
- Verify your API key is correct

### "No Shorts found from configured channels"
- Check that your channel IDs are correct
- Make sure the channels actually have Short videos (≤60 seconds)
- Verify your API key has YouTube Data API v3 enabled

### "Invalid YouTube API key or quota exceeded"
- Check your API key is valid
- YouTube API has daily quotas - you might need to wait or upgrade your quota

## API Usage

This extension uses the YouTube Data API v3 which has free quotas:
- 10,000 units per day (free tier)
- Each video fetch uses approximately 1-3 units
- Typical usage: 100-300 video loads per day with free quota

## Release Notes

### 0.0.1
- Initial release with YouTube Data API integration
- Channel configuration and API key setup
- Navigation controls and auto-play
- Sidebar and standalone views

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
