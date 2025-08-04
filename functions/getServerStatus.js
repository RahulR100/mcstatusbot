'use strict';
import 'dotenv/config';
import axios from 'axios';
import unidecode from 'unidecode';
import { validateHost } from './validateHost.js';


const ping_server = process.env.PING_URL;

export async function getServerStatus(server, priority = 'high_priority') {
	if (!validateHost(server.ip).valid) {
		throw new Error('Invalid server IP');
	}

	let [ip, port] = server.ip.split(':');
	ip = unidecode(ip);
	port = parseInt(port) || undefined;

    const cache_len = priority == 'high_priority' ? 'sm' : 'lg';
    let response;

    if (port) {
        response = await axios.get(`${ping_server}/status/${cache_len}/${ip}/${port}`);
    } else {
        response = await axios.get(`${ping_server}/status/${cache_len}/${ip}`);
    }

    if (response.status !== 200) {
        throw new Error(`Server returned status code ${response.status}`);
    }

    // Get response object from axios
    response = response.data;

    // Final check for valid response, incase our validation missed something
	if (typeof response != 'object') {
		throw new Error('Invalid server response');
	}

	return { ...response };
}
