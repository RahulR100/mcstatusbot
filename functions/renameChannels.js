'use strict';
import { onlineStatusLocalizations } from '../localizations/renameChannels.js';
import { beaver } from './consoleLogging.js';

function errorHandler(error, message) {
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

export async function renameChannels(channels, serverStatus, priority = 'high_priority') {
	const channelNames = {
		status: serverStatus.online ? 'Status: Online' : 'Status: Offline',
		players: serverStatus.players ? `Players: ${serverStatus.players.online} / ${serverStatus.players.max}` : 'Players: 0'
	};

	await Promise.allSettled(
		channels.map(async (channel) => {
			try {
				if (!channel.object || channelNames[channel.type] == channel.object.name) return;

				await channel.object.setName(channelNames[channel.type], priority);

				if (channel.type == 'players') {
					try {
						await channel.object.permissionOverwrites.edit(
							channel.object.guild.roles.everyone,
							{
								ViewChannel: serverStatus.online ? null : false
							},
							{ reason: priority }
						);
					} catch (error) {
						errorHandler(error, 'Error changing channel visibility while updating server status');
					}
				}
			} catch (error) {
				errorHandler(error, 'Error renaming channels while updating server status');
			}
		})
	);
}
