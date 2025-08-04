import * as vscode from 'vscode';
import { fetchChannelShorts } from './youtubeService';

class YouTubeShortsWebviewProvider implements vscode.WebviewViewProvider {
	private currentVideoIndex: number = 0;
	private currentVideos: any[] = [];
	
	public readonly defaultChannels: string[];

	constructor(
		private readonly _extensionUri: vscode.Uri,
		defaultChannels: string[] = []
	) {
		// Initialize with provided default channels or fallback to a hardcoded list
		this.defaultChannels = defaultChannels.length > 0 ? defaultChannels : [
			'Law By Mike', 
			'MrBeast', 
			'Steven He', 
			'Fireship', 
			'Kings and Generals'
		];
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this.getWebviewContent(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (message) => {
			switch (message.type) {
				case 'loadVideos':
					await this.loadVideos(webviewView.webview);
					break;
				case 'nextVideo':
					this.playNextVideo(webviewView.webview);
					break;
				case 'previousVideo':
					this.playPreviousVideo(webviewView.webview);
					break;
				case 'videoEnded':
					if (vscode.workspace.getConfiguration('scrollpilot').get('autoplay')) {
						this.playNextVideo(webviewView.webview);
					}
					break;
			}
		});

		// Load videos on initial load
		this.loadVideos(webviewView.webview);
	}

	private async loadVideos(webview: vscode.Webview): Promise<void> {
		try {
			const config = vscode.workspace.getConfiguration('scrollpilot');
			let channels = config.get<string[]>('channels') || [];
			const maxVideosPerChannel = config.get<number>('maxVideosPerChannel') || 10;
			
			// Use default channels if no channels are configured
			if (channels.length === 0) {
				channels = this.defaultChannels;
				webview.postMessage({
					type: 'info',
					message: 'Using default channels. Refer to the `README.md` on how to configure your own channels.'
				});
			}

			webview.postMessage({ type: 'loading', message: 'Loading YouTube Shorts...' });

			const shorts = await fetchChannelShorts(channels, maxVideosPerChannel);
			this.currentVideos = shorts;
			this.currentVideoIndex = 0;

			if (this.currentVideos.length === 0) {
				webview.postMessage({
					type: 'error',
					message: 'No Shorts found from configured channels. Check your channel IDs.'
				});
				return;
			}

			webview.postMessage({
				type: 'videosLoaded',
				videos: this.currentVideos,
				currentIndex: this.currentVideoIndex
			});

		} catch (error: any) {
			webview.postMessage({
				type: 'error',
				message: error.message
			});
		}
	}

	private playNextVideo(webview: vscode.Webview): void {
		if (this.currentVideos.length === 0) return;
		
		this.currentVideoIndex = (this.currentVideoIndex + 1) % this.currentVideos.length;
		webview.postMessage({
			type: 'playVideo',
			video: this.currentVideos[this.currentVideoIndex],
			index: this.currentVideoIndex
		});
	}

	private playPreviousVideo(webview: vscode.Webview): void {
		if (this.currentVideos.length === 0) return;
		
		this.currentVideoIndex = this.currentVideoIndex === 0 ? 
			this.currentVideos.length - 1 : 
			this.currentVideoIndex - 1;
		webview.postMessage({
			type: 'playVideo',
			video: this.currentVideos[this.currentVideoIndex],
			index: this.currentVideoIndex
		});
	}

	public getWebviewContent(webview: vscode.Webview): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'unsafe-inline' https://www.youtube.com; frame-src https://www.youtube.com; connect-src https://www.youtube.com;">
	<title>YouTube Shorts for VS Code</title>
	<script>
		// Bail out of cast initialization entirely
		window.chrome = window.chrome || {};
		window.chrome.cast = window.chrome.cast || { initialize: () => {}, isAvailable: false };

		// Stub PresentationRequest so it doesn't throw
		window.PresentationRequest = window.PresentationRequest || class {
			constructor() { return this; }
			static requestSession() { throw new Error('Presentation disabled'); }
			static getAvailability() { return Promise.resolve({ value: false }); }
		};
	</script>
	<script src="https://www.youtube.com/iframe_api"></script>
	<style>
		body {
			margin: 0;
			padding: 0;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background-color: #0f0f0f;
			color: white;
			overflow: hidden;
		}
		.container {
			width: 100%;
			height: 100vh;
			display: flex;
			flex-direction: column;
			position: relative;
		}
		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10px;
			background-color: #212121;
			z-index: 100;
		}
		.logo-title {
			display: flex;
			align-items: center;
		}
		.logo {
			width: 30px;
			height: 20px;
			background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEyIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTEyIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTA5Ljg0MSAxMi4yMTVDMTA4LjYzOCA3LjgzMzMzIDEwNS4xNTEgNC4zNDMzMyAxMDAuNzc0IDMuMTQ4MzNDOTIuNDg0MSAwLjk5OTk5NyA1NiAwLjk5OTk5NyA1NiAwLjk5OTk5N0M1NiAwLjk99OTk5NyAxOS41MTU5IDEgMTEuMjI1OSAzLjE0ODMzQzYuODQ4OTQgNC4zNDMzMyAzLjM2MTk0IDcuODMzMzMgMi4xNTg5NCAxMi4yMTVDMCAxOC40OTIgMCAzMS41IDAgMzEuNUMwIDMxLjUgMCA0NC41MDggMCA1MC43ODVDMS4yMDI5NCA1NS4xNjY3IDQuNjg5OTQgNTguNjU2NyA5LjA2Njk0IDU5Ljg1MTdDMTcuMzU2IDYyIDUzLjgzOTEgNjIgNTMuODM5MSA2MkM1My44MzkxIDYyIDkwLjMyNCA2MiA5OC42MTQgNTkuODUxN0MxMDIuOTkxIDU4LjY1NjcgMTA2LjQ3OCA1NS4xNjY3IDEwNy42ODEgNTAuNzg1QzEwOS44NCA0NC41MDggMTA5Ljg0IDMxLjUgMTA5Ljg0IDMxLjVDMTA5Ljg0IDMxLjUgMTA5Ljg0IDE4LjQ5MiAxMDkuODQxIDEyLjIxNVoiIGZpbGw9IiNGRjAwMDAiLz4KPHBhdGggZD0iTTQ1IDIyVjQxTDcyIDMxLjVMNDUgMjJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K');
			background-size: contain;
			background-repeat: no-repeat;
			margin-right: 10px;
		}
		.title {
			font-size: 16px;
			font-weight: bold;
		}
		.controls {
			display: flex;
			gap: 5px;
		}
		.control-btn {
			background: #333;
			border: none;
			color: white;
			padding: 5px 8px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 12px;
		}
		.control-btn:hover {
			background: #555;
		}
		.video-container {
			flex-grow: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			background: #000;
		}
		.video-player {
			width: 100%;
			height: 100%;
			max-width: 400px;
		}
		.navigation {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			z-index: 10;
		}
		.nav-btn {
			background: rgba(0, 0, 0, 0.7);
			border: none;
			color: white;
			width: 40px;
			height: 40px;
			border-radius: 50%;
			cursor: pointer;
			font-size: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.nav-btn:hover {
			background: rgba(0, 0, 0, 0.9);
		}
		.nav-prev {
			left: 10px;
		}
		.nav-next {
			right: 10px;
		}
		.error-message, .loading-message {
			text-align: center;
			padding: 20px;
			font-size: 14px;
		}
		.error-message {
			color: #ff6b6b;
		}
		.loading-message {
			color: #4ecdc4;
		}
		.video-info {
			position: absolute;
			bottom: 10px;
			left: 10px;
			right: 10px;
			background: rgba(0, 0, 0, 0.7);
			padding: 10px;
			border-radius: 5px;
			z-index: 10;
		}
		.video-title {
			font-size: 14px;
			margin-bottom: 5px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.video-channel {
			font-size: 12px;
			color: #ccc;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="logo-title">
				<div class="logo"></div>
				<div class="title">YouTube Shorts</div>
			</div>
			<div class="controls">
				<button class="control-btn" onclick="refreshVideos()">Refresh</button>
			</div>
		</div>
		<div class="video-container" id="videoContainer">
			<div class="loading-message" id="loadingMessage">Loading...</div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		let ytPlayer = null;
		let currentVideo = null;
		let isPlayerReady = false;
		let videoEndTimer = null;

		// Load YouTube API
		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		const firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

		// This function is called by the YouTube API when it's ready
		window.onYouTubeIframeAPIReady = function() {
			isPlayerReady = true;
		};

		// Request to load videos on startup
		vscode.postMessage({ type: 'loadVideos' });

		// Listen for messages from the extension
		window.addEventListener('message', event => {
			const message = event.data;
			
			switch (message.type) {
				case 'videosLoaded':
					displayVideo(message.videos[message.currentIndex], message.currentIndex, message.videos.length);
					break;
				case 'playVideo':
					displayVideo(message.video, message.index, null);
					break;
				case 'error':
					showError(message.message);
					break;
				case 'info':
					showInfo(message.message);
					break;
				case 'loading':
					showLoading(message.message);
					break;
			}
		});

		function displayVideo(video, index, total) {
			currentVideo = video;
			const container = document.getElementById('videoContainer');
			
			// Clear any existing timer
			if (videoEndTimer) {
				clearTimeout(videoEndTimer);
			}

			// Create a unique player div ID
			const playerId = 'ytplayer-' + Date.now();
			
			container.innerHTML = \`
				<div id="\${playerId}" class="video-player"></div>
				<div class="navigation nav-prev">
					<button class="nav-btn" onclick="previousVideo()">↑</button>
				</div>
				<div class="navigation nav-next">
					<button class="nav-btn" onclick="nextVideo()">↓</button>
				</div>
			\`;

			// Initialize YouTube Player
			if (isPlayerReady) {
				initializePlayer(playerId, video.id);
			} else {
				// Wait for API to be ready
				const checkReady = setInterval(() => {
					if (isPlayerReady) {
						clearInterval(checkReady);
						initializePlayer(playerId, video.id);
					}
				}, 100);
			}
		}

		function initializePlayer(playerId, videoId) {
			try {
				ytPlayer = new YT.Player(playerId, {
					height: '100%',
					width: '100%',
					videoId: videoId,
					playerVars: {
						autoplay: 1,
						controls: 1,
						modestbranding: 1,
						rel: 0,
						showinfo: 0,
						fs: 0,
						cc_load_policy: 0,
						iv_load_policy: 3,
						autohide: 1,
						enablejsapi: 1,
  						origin: window.location.origin

					},
					events: {
						onReady: onPlayerReady,
						onStateChange: onPlayerStateChange,
						onError: onPlayerError
					}
				});
				const htmlEl = ytPlayer.getIframe ? ytPlayer.getIframe() : ytPlayer.h;
				if (htmlEl instanceof HTMLIFrameElement && htmlEl.hasAttribute('sandbox')) {
					htmlEl.setAttribute(
						'sandbox',
						'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation'
					);
				}
			} catch (error) {
				vscode.window.showErrorMessage('Error initializing YouTube player: ' + error.message);
				
				// Fallback to iframe if player creation fails
				document.getElementById(playerId).innerHTML = \`
					<iframe 
						width="100%" 
						height="100%" 
						src="https://www.youtube.com/embed/\${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0"
						frameborder="0" 
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
						allowfullscreen>
					</iframe>
				\`;
			}
		}

		function onPlayerReady(event) {
			console.log('YouTube player ready');
			event.target.playVideo();
		}

		function onPlayerStateChange(event) {
			console.log('Player state changed:', event.data);
			
			// Clear any existing timer when state changes
			if (videoEndTimer) {
				clearTimeout(videoEndTimer);
				videoEndTimer = null;
			}

			switch (event.data) {
				case YT.PlayerState.ENDED:
					console.log('Video ended');
					vscode.postMessage({ type: 'videoEnded' });
					break;
				case YT.PlayerState.PAUSED:
					console.log('Video paused');
					break;
				case YT.PlayerState.BUFFERING:
					console.log('Video buffering');
					break;
			}
		}

		function onPlayerError(event) {
			console.error('YT Player error:', event.data);
			if (event.data === 2 && window.chrome.cast?.isAvailable === false) {
				// Likely the suppressed cast kick-off error — ignore it
				return;
			}
			showError('Error loading video. It may be unavailable or restricted.');
			setTimeout(() => vscode.postMessage({ type: 'nextVideo' }), 3000);
		}

		function showError(message) {
			const container = document.getElementById('videoContainer');
			container.innerHTML = \`<div class="error-message">\${message}</div>\`;
		}

		function showLoading(message) {
			const container = document.getElementById('videoContainer');
			container.innerHTML = \`<div class="loading-message">\${message}</div>\`;
		}
		
		function showInfo(message) {
			const infoElement = document.createElement('div');
			infoElement.textContent = message;
			infoElement.style.cssText = 'position:absolute; top:50px; left:0; right:0; background:#4285f4; color:white; padding:8px 16px; z-index:200; text-align:center; font-size:12px;';
			document.body.appendChild(infoElement);
			
			setTimeout(() => {
				if (infoElement.parentNode) {
					infoElement.parentNode.removeChild(infoElement);
				}
			}, 5000);
		}

		function nextVideo() {
			vscode.postMessage({ type: 'nextVideo' });
		}

		function previousVideo() {
			vscode.postMessage({ type: 'previousVideo' });
		}

		function refreshVideos() {
			showLoading('Refreshing...');
			vscode.postMessage({ type: 'loadVideos' });
		}

		// Keyboard navigation
		document.addEventListener('keydown', (e) => {
			// Only handle keys if not in an input field
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
				return;
			}

			switch (e.key) {
				case 'ArrowDown':
				case 'ArrowRight':
					e.preventDefault();
					nextVideo();
					break;
				case 'ArrowUp':
				case 'ArrowLeft':
					e.preventDefault();
					previousVideo();
					break;
				case ' ':
					e.preventDefault();
					if (ytPlayer && ytPlayer.getPlayerState) {
						const state = ytPlayer.getPlayerState();
						if (state === YT.PlayerState.PLAYING) {
							ytPlayer.pauseVideo();
						} else if (state === YT.PlayerState.PAUSED) {
							ytPlayer.playVideo();
						}
					}
					break;
			}
		});

		// Cleanup on page unload
		window.addEventListener('beforeunload', () => {
			if (videoEndTimer) {
				clearTimeout(videoEndTimer);
			}
			if (ytPlayer && ytPlayer.destroy) {
				ytPlayer.destroy();
			}
		});
	</script>
</body>
</html>`;
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log)
	// and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	vscode.window.showInformationMessage('ScrollPilot extension is now active!');
	
	// Get default channels from package.json
	let defaultChannelsFromConfig: string[] = [];
	
	// Try to get the default channel values from package.json
	try {
		// Access the extension's package.json configuration
		const packageJSON = context.extension.packageJSON;
		if (packageJSON && 
			packageJSON.contributes && 
			packageJSON.contributes.configuration && 
			packageJSON.contributes.configuration.properties && 
			packageJSON.contributes.configuration.properties["scrollpilot.channels"]) {
			
			defaultChannelsFromConfig = packageJSON.contributes.configuration.properties["scrollpilot.channels"].default || [];
			console.log('Read default channels from package.json:', defaultChannelsFromConfig);
		}
	} catch (error) {
		console.error('Error reading default channels from package.json:', error);
	}
	
	const provider = new YouTubeShortsWebviewProvider(
		context.extensionUri, 
		defaultChannelsFromConfig
	);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("scrollpilot.youtubeShortsView", provider));

	// Command to open YouTube Shorts in a new tab
	let openCommand = vscode.commands.registerCommand('scrollpilot.openYouTubeShorts', () => {
		const panel = vscode.window.createWebviewPanel(
			'youtubeshortsView', // Identifies the type of the webview. Used internally
			'YouTube Shorts', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{
				enableScripts: true // Enable scripts in the webview
			}
		);

		// Use the same provider instance to ensure consistency
		panel.webview.html = provider.getWebviewContent(panel.webview);
		
		// Handle messages for the standalone panel too
		panel.webview.onDidReceiveMessage(async (message) => {
			// Send initial load videos message
			if (message.type === 'loadVideos') {
				panel.webview.postMessage({ type: 'loading', message: 'Loading YouTube Shorts...' });
				
				// Load videos using the configuration
				try {
					const config = vscode.workspace.getConfiguration('scrollpilot');
					let channels = config.get<string[]>('channels') || [];
					const maxVideosPerChannel = config.get<number>('maxVideosPerChannel') || 10;
					
					// Use default channels if no channels are configured
					if (channels.length === 0) {
						channels = provider.defaultChannels;
						panel.webview.postMessage({
							type: 'info',
							message: 'Using default channels. Refer to the README.md on how to configure your own channels.'
						});
					}
					
					const shorts = await fetchChannelShorts(channels, maxVideosPerChannel);
					
					if (shorts.length === 0) {
						panel.webview.postMessage({
							type: 'error',
							message: 'No Shorts found from configured channels. Check your channel names.'
						});
						return;
					}
					
					panel.webview.postMessage({
						type: 'videosLoaded',
						videos: shorts,
						currentIndex: 0
					});
				} catch (error: any) {
					panel.webview.postMessage({
						type: 'error',
						message: error.message
					});
				}
			}
			
			// For other messages, just reload the view which will trigger a new message sequence
			else if (message.type === 'resetToDefaults') {
				await vscode.workspace.getConfiguration('scrollpilot').update('channels', provider.defaultChannels, vscode.ConfigurationTarget.Global);
				panel.webview.postMessage({
					type: 'info',
					message: 'Reset to default channels'
				});
				panel.webview.postMessage({ type: 'loadVideos' });
			}
		});
	});

	context.subscriptions.push(openCommand);

}

export function deactivate() {}
