'use strict';
import 'dotenv/config';
import { beaver } from './consoleLogging.js';
import { getIndicators, getServers } from './databaseFunctions.js';
import { getServerStatus } from './getServerStatus.js';
import { renameChannels } from './renameChannels.js';

// Log an error when updating servers
function handleUpdateError(error, ip, guild) {
	beaver.log(
		'update-servers',
		'Error pinging Minecraft server while updating servers',
		JSON.stringify({
			'Server IP': ip,
			'Guild ID': guild
		}),
		error
	);
}

// The main update loop
export async function updateServers(client) {
	await Promise.allSettled(
		client.guilds.cache.map(async (guild) => {
			// Get the list of monitored servers for this guild
			let serverList = await getServers(guild.id);

			await Promise.allSettled(
				serverList.map(async (server) => {
					// Server status and error
					// We use serverError to catch errors that we want to display to the user
					let serverStatus;
					let serverError;

					try {
						// Get server status with low priority (longer cache time)
						serverStatus = await getServerStatus(server, 'low_priority');
					} catch (error) {
						// Handle known errors that we want to display to the user
						if (error.message == 'Invalid server IP') {
							serverError = 'Invalid IP Address';
						} else {
							handleUpdateError(error, server.ip, guild.id);
						}
					}

					// If we have neither a status nor an error, don't update anything
					// This should never happen unless the whole internal network is down, but just in case
					if (!serverStatus && !serverError) return;

					// Get the channels to rename
					const channels = [
						{ object: await guild.channels.cache.get(server.statusId), type: 'status' },
						{ object: await guild.channels.cache.get(server.playersId), type: 'players' }
					];

					// Get the indicators for this server
					const indicators = await getIndicators(guild.id, server);

					// Rename the channels with low priority - the priority only affects legacy proxies
					await renameChannels(channels, serverStatus, indicators, 'low_priority', serverError);
				})
			);
		})
	);
}
