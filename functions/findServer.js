'use strict';
import { getServers } from './databaseFunctions.js';

// Find a server by a query string in specified fields (ip, nickname)
// The search is case insensitive and returns the first match (there should only be one match anyway)
export async function findServer(query, fields, guildId) {
	const monitoredServers = await getServers(guildId);
	let match;

	for (const field of fields) {
		match = monitoredServers.find((server) => server[field]?.toLowerCase() == query?.toLowerCase());
		if (match) break;
	}

	return match;
}

// Find the default server for a guild
export async function findDefaultServer(guildId) {
	const monitoredServers = await getServers(guildId);
	return monitoredServers.find((server) => server.default) || monitoredServers[0];
}

// Find the index of a server by its IP address
// Returns -1 if not found
// TODO: This is a legacy function and is being replaced with findServer
export async function findServerIndex(query, guildId) {
	const monitoredServers = await getServers(guildId);
	return monitoredServers.findIndex((server) => server.ip == query.ip);
}
