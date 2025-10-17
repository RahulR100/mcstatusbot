'use strict';
import 'dotenv/config';
import axios from 'axios';
import { validateHost } from './validateHost.js';

// Endpoint for the ping server
const ping_server = process.env.PING_URL || "http://mcpingserver:8000";

export async function getServerStatus(server, priority = 'high_priority') {
	// Ensure we have a valid server to avoid pinging invalid servers
	if (!validateHost(server.ip).valid) {
		throw new Error('Invalid server IP');
	}

	// Determine the cache length based on priority
    const cache_sm = process.env.CACHE_SM || 60;
    const cache_lg = process.env.CACHE_LG || 360;
	const cache_len = priority == 'high_priority' ? cache_sm : cache_lg;

	// Ping the server
	// There should not be any timeouts here since the server may take a few seconds to respond
    let response = await axios.get(`${ping_server}/status/${server.platform[0]}/${cache_len}/${server.ip}`);

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
