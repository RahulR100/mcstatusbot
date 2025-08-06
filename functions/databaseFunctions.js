'use strict';
import mongoose from 'mongoose';
import { beaver } from './consoleLogging.js';

// Schema for a server in a guild
// If a new entry is created, it must have required = false, and a default value to ensure backwards compatibility
const server = mongoose.Schema({
	ip: { type: String, required: true },
	categoryId: { type: String, required: true },
	statusId: { type: String, required: true },
	playersId: { type: String, required: true },
	nickname: { type: String, required: false, default: null },
	default: { type: Boolean, required: false, default: false },
	platform: { type: String, required: false, default: 'java' },
	onlineIndicator: { type: String, required: false, default: 'Online' },
	offlineIndicator: { type: String, required: false, default: 'Offline' }
});

// Schema for a guild
const guild = mongoose.Schema({
	guildId: { type: String, required: true },
	ephemeral: { type: Boolean, required: false, default: true },
	servers: [server]
});

const Guild = mongoose.model('Guild', guild);

function databaseError(error) {
	beaver.log('database', 'Database error!', error);
}

// Guild level functions
// Create a new guild entry in the database when the bot is added to a guild
function createGuild(key, servers) {
	const guild = new Guild({
		guildId: key,
		servers: servers
	});
	guild.save();
}

// Get whether the bot should use ephemeral messages in this guild
export async function getEphemeral(key) {
	return Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				return guild.ephemeral;
			}
			return true;
		})
		.catch(databaseError);
}

// Set whether the bot should use ephemeral messages in this guild
export async function setEphemeral(key, ephemeral) {
	Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				guild.ephemeral = ephemeral;
				guild.save();
			}
		})
		.catch(databaseError);
}

// Get the list of monitored servers for a guild
export async function getServers(key) {
	return Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				return guild.servers;
			}
			return [];
		})
		.catch(databaseError);
}

// Add a server to the list of monitored servers for a guild
export async function addServer(key, server) {
	Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (!guild) {
				createGuild(key, [server]);
			} else {
				guild.servers ? guild.servers.push(server) : (guild.servers = [server]);
				guild.save();
			}
		})
		.catch(databaseError);
}

// Set the list of monitored servers for a guild
// Warning: This will overwrite the entire list of monitored servers for the guild!
export async function setServers(key, servers) {
	Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (!guild) {
				createGuild(key, servers);
			} else {
				guild.servers = servers;
				guild.save();
			}
		})
		.catch(databaseError);
}

// Get the number of monitored servers for a guild
export async function numberOfServers(key) {
	return Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				return guild.servers.length;
			}
			return 0;
		})
		.catch(databaseError);
}

// Delete a server from the list of monitored servers for a guild
export async function deleteServer(key, server) {
	Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				guild.servers = guild.servers.filter((s) => s.ip != server.ip);
				guild.save();
			}
		})
		.catch(databaseError);
}

// Delete multiple servers from the list of monitored servers for a guild
export async function deleteServers(key, servers) {
	const serverIPs = servers.map((s) => s.ip);

	Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				guild.servers = guild.servers.filter((s) => !serverIPs.includes(s.ip));
				guild.save();
			}
		})
		.catch(databaseError);
}

// Delete an entire guild and all its monitored servers
// This should only be used when the bot is removed from a guild
export async function deleteGuild(key) {
	Guild.findOneAndDelete({ guildId: key }).exec().catch(databaseError);
}

// Server level functions
// Get the online and offline indicators for a server in a guild
export async function getIndicators(key, server) {
	return Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				const srv = guild.servers.find((s) => s.ip == server.ip);
				if (srv) {
					return { onlineIndicator: srv.onlineIndicator, offlineIndicator: srv.offlineIndicator };
				}
			}
			return { onlineIndicator: 'Online', offlineIndicator: 'Offline' };
		})
		.catch(databaseError);
}

// Set the online indicator for a server in a guild
export async function setOnlineIndicator(key, server, onlineIndicator) {
	Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				const srv = guild.servers.find((s) => s.ip == server.ip);
				if (srv) {
					srv.onlineIndicator = onlineIndicator;
					guild.save();
				}
			}
		})
		.catch(databaseError);
}

// Set the offline indicator for a server in a guild
export async function setOfflineIndicator(key, server, offlineIndicator) {
	Guild.findOne({ guildId: key })
		.exec()
		.then((guild) => {
			if (guild) {
				const srv = guild.servers.find((s) => s.ip == server.ip);
				if (srv) {
					srv.offlineIndicator = offlineIndicator;
					guild.save();
				}
			}
		})
		.catch(databaseError);
}

// Global functions
// Get the total number of monitored servers across all guilds
export async function getTotalMonitoredServers() {
	return Guild.find()
		.exec()
		.then((guilds) => {
			return guilds.reduce((total, guild) => total + (guild.servers ? guild.servers.length : 0), 0);
		})
		.catch(databaseError);
}
