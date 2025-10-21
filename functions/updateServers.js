'use strict';
import 'dotenv/config';
import { beaver } from './consoleLogging.js';
import { getIndicators, getServers } from './databaseFunctions.js';
import { getServerStatus } from './getServerStatus.js';
import { renameChannels } from './renameChannels.js';
import pMap from 'p-map';

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

// Function to update all servers in a guild
async function updateGuildServers(guild) {
	// Get the list of monitored servers for this guild
	const serverList = await getServers(guild.id);

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

			// Get the channels to rename
			const channels = [
				{ object: await guild.channels.cache.get(server.statusId), type: 'status' },
				{ object: await guild.channels.cache.get(server.playersId), type: 'players' }
			];

			// Get the indicators for this server
			const indicators = await getIndicators(guild.id, server);

			// Rename the channels with low priority
			await renameChannels(channels, serverStatus, indicators, 'low_priority', serverError);
		})
	);
}

// The main update loop
// We limit to 50 guilds at a time to avoid overloading the pingserver
export async function updateServers(client) {
	await pMap(client.guilds.cache.values(), updateGuildServers, { concurrency: 50 });
}
