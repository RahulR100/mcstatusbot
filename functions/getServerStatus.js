'use strict';
import 'dotenv/config';
import axios from 'axios';
import unidecode from 'unidecode';
import { validateHost } from './validateHost.js';

// Endpoint for the ping server
const ping_server = process.env.PING_URL || "http://mcpingserver:8000";

export async function getServerStatus(server, priority = 'high_priority') {
	// Ensure we have a valid server to avoid pinging invalid servers
	if (!validateHost(server.ip).valid) {
		throw new Error('Invalid server IP');
	}

	// Get the IP (or FQDN) and port
	// TODO: Split this into its own function since its reused during validation
	let [ip, port] = server.ip.split(':');
	ip = unidecode(ip);
	port = parseInt(port) || undefined;

	// Determine the cache length based on priority
	const cache_len = priority == 'high_priority' ? 'sm' : 'lg';
	let response;

	// Ping the server
	// There should not be any timeouts here since the server may take a few seconds to respond
	if (port) {
		response = await axios.get(`${ping_server}/status/${cache_len}/${ip}/${port}`);
	} else {
		response = await axios.get(`${ping_server}/status/${cache_len}/${ip}`);
	}

	// Check for non-200 status codes
	if (response.status !== 200) {
		throw new Error(`Server returned status code ${response.status}`);
	}

	// Get response data from the server reply
	response = response.data;

	// Final check for valid response
	// This should never be hit since if there is an error code we should get a non-200 status code
	// Nonetheless this code probably has a purpose so Im going to leave it here
	if (typeof response != 'object') {
		throw new Error('Invalid server response');
	}

	return response;
}
