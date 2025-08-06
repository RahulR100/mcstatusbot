'use strict';
import { Events } from 'discord.js';
import { beaver } from '../functions/consoleLogging.js';
import { getServers, setServers } from '../functions/databaseFunctions.js';
import { findServer, findServerIndex } from '../functions/findServer.js';
import { isNotMonitored } from '../functions/inputValidation.js';

// This event is triggered when a category name is updated
// Users can manually update a category name, which is the manual equivalent of giving the bot a nickname
// We want to keep track of these changes so we can update our database accordingly
export const name = Events.ChannelUpdate;
export const once = false;

export async function execute(_, newChannel) {
	try {
		// Check if the updated channel is in the list of monitored channels
		let server = await findServer(newChannel.id, ['categoryId'], newChannel.guildId);
		if (await isNotMonitored(server)) return;

		// Check if the channel name is the same as the nickname listed in the database
		if (newChannel.name == server.nickname || newChannel.name == server.ip) return;

		// Set the nickname listed in the database to the channel name
		let monitoredServers = await getServers(newChannel.guildId);
		const serverIndex = await findServerIndex(server, newChannel.guildId);
		monitoredServers[serverIndex].nickname = newChannel.name;
		await setServers(newChannel.guildId, monitoredServers);
	} catch (error) {
		beaver.log(
			'channel-update',
			'Error setting nickname during channel rename',
			JSON.stringify({
				'Channel ID': newChannel.id,
				'Guild ID': newChannel.guildId
			}),
			error
		);
	}
}
