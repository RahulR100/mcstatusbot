'use strict';
import mongoose from 'mongoose';
import { beaver } from './consoleLogging.js';

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
function createGuild(key, servers) {
	const guild = new Guild({
		guildId: key,
		servers: servers
	});
	guild.save();
}

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

export async function deleteGuild(key) {
	Guild.findOneAndDelete({ guildId: key }).exec().catch(databaseError);
}

// Server level functions
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

export async function getTotalMonitoredServers() {
    return Guild.find()
        .exec()
        .then((guilds) => {
            return guilds.reduce((total, guild) => total + (guild.servers ? guild.servers.length : 0), 0);
        })
        .catch(databaseError);
}