'use strict';
import 'dotenv/config';
import { beaver } from './consoleLogging.js';

// Update server count badge on remote
export async function updateDelegate(client) {
	// Update badge count if first client
	if (client.cluster.id == 0) {
		try {
			const serverCountByShard = await client.cluster.fetchClientValues('guilds.cache.size');
	        const serverCount = serverCountByShard.reduce((totalGuilds, shardGuilds) => totalGuilds + shardGuilds, 0);
			await fetch(process.env.DELEGATE_URL + '/count/set', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ count: serverCount, token: process.env.DELEGATE_TOKEN })
			});
		} catch (error) {
			beaver.log('update-badge', 'Error updating server count badge on remote', error);
		}
	}
}
