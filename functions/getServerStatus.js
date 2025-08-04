'use strict';
import 'dotenv/config';
import { statusBedrock, statusJava } from 'node-mcstatus';
import unidecode from 'unidecode';
import { validateHost } from './validateHost.js';

const options_high = {
	baseURL: process.env.HIGH_PING_URL
};

const options_low = {
	baseURL: process.env.LOW_PING_URL
};

export async function getServerStatus(server, priority = 'high_priority') {
	if (!validateHost(server.ip).valid) {
		throw new Error('Invalid server IP');
	}

	let [ip, port] = server.ip.split(':');
	ip = unidecode(ip);
	port = parseInt(port) || undefined;

	let startTime = Date.now();
	let options = priority == 'high_priority' ? options_high : options_low;
	let response = server.platform == 'bedrock' ? await statusBedrock(ip, port, options) : await statusJava(ip, port, options);
	let latency = Date.now() - startTime + ' ms';

	// Final check for valid response, incase our validation missed something
	if (typeof response != 'object') {
		throw new Error('Invalid server response');
	}

	// Use the clean name where possible
	if (response.online) {
		if (response.version) {
			response.version.name = response.version.name_clean || response.version.name;
		} else {
			response.version = { name: 'Unknown Version' };
		}
	}

	return { ...response, latency };
}
