'use strict';
import { beaver } from './consoleLogging.js';

// Log an error when renaming channels
function errorHandler(error, message) {
	// Temporarily ignore rate limit and missing permissions errors to prevent log spam
	// Rate limit errors should be rare, but should also take care of themselves as the bot retries requests
	// Missing permissions cannot be fixed on our end, as they should be handled by server admins
	if (!error.name.includes('RateLimitError') && !error.message.includes('Missing Permissions')) {
		beaver.log(
			'rename-channels',
			message,
			JSON.stringify({
				'Channel ID': channel.object.id,
				'Guild ID': channel.object.guildId
			}),
			error
		);
	}
}

// Rename the channels based on the server status
// By default we assume high priority - this value only affects legacy proxies
export async function renameChannels(channels, serverStatus, indicators, priority = 'high_priority', serverError = null) {
	let channelNames;

	// If there is a server error (one that we want to display to the user), show that instead of the status
	if (serverError) {
		channelNames = {
			status: 'Status: Error',
			players: `${serverError}`
		};
	} else {
        if (serverStatus) {
            // Server is online
            channelNames = {
                status: `Status: ${indicators.onlineIndicator}`,
                players: `Players: ${serverStatus.players.online} / ${serverStatus.players.max}`
            };
        } else {
            // Server is offline
            channelNames = {
                status: `Status: ${indicators.offlineIndicator}`,
                players: `Players: 0`
            };
        }
	}

	// Begin channel update loop
	await Promise.allSettled(
		channels.map(async (channel) => {
			try {
				// If we dont have a channel object (it was deleted, we cannot access it, etc.)
				// Of if the name of the channel is already the same value as what we have, skip it
				// This prevents unnecessary API calls and potential rate limits
				// TODO: Move handle this with DB
				if (!channel.object || channelNames[channel.type] == channel.object.name) return;

				// Rename the channel
				await channel.object.setName(channelNames[channel.type], priority);
			} catch (error) {
				errorHandler(error, 'Error renaming channels while updating server status');
			}
		})
	);
}
