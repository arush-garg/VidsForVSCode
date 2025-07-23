import YouTube from "youtube-sr";
import * as vscode from 'vscode';


async function shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Fetch shorts from a list of YouTube channels
 * @param channels Array of channel names
 * @param maxVideosPerChannel Maximum number of videos to fetch per channel
 * @returns Array of shorts videos
 */
async function fetchChannelShorts(channels: string[], maxVideosPerChannel = 10) {
	const allShorts = [];
	
	for (const channel of channels) {
		try {
			console.log(`Searching for shorts from channel: ${channel}`);
			
			const videos = await YouTube.search(channel + " shorts", { limit: 50, type: "video" });

			shuffle(videos);
            
			const shorts = [];
			for (const video of videos) {
				if (video.duration && video.duration <= 60000) { // Duration in milliseconds
					shorts.push(video);
				}

                if (shorts.length >= maxVideosPerChannel) {
                    break;
                }
			}
			
			console.log(`→ Found ${shorts.length} Shorts from ${channel}`);
			allShorts.push(...shorts);
		} catch (error) {
			console.error(`Error fetching shorts from ${channel}:`, error);
		}
	}
	
	console.log(`→ Total: ${allShorts.length} Shorts found`);
	shuffle(allShorts);
	return allShorts;
}


export { fetchChannelShorts };