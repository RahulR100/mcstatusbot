'use strict';
import 'dotenv/config';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { ActivityType, Client, Collection, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import { readdirSync } from 'node:fs';
import path, { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beaver } from './functions/consoleLogging.js';
import { updateServers } from './functions/updateServers.js';
import { updateDelegate } from './functions/updateDelegate.js';

let clientOptions = {
	shards: getInfo().SHARD_LIST,
	shardCount: getInfo().TOTAL_SHARDS,
	intents: [GatewayIntentBits.Guilds],
	presence: { activities: [{ name: '/help', type: ActivityType.Watching }] }
};

if (process.env.NODE_ENV == 'production') {
	clientOptions.rest = { api: `${process.env.PROXY_URL}/api`, globalRequestsPerSecond: Infinity, timeout: 6 * 60 * 1000, retries: 1 };
}

export let client = new Client(clientOptions);

client.cluster = new ClusterClient(client);
client.cooldowns = new Collection();
client.commands = new Collection();

let clientReady = false;
let clusterReady = false;

client.cluster.once('ready', async () => {
	clusterReady = true;
	if (clientReady) init();
});

client.once('ready', async () => {
	clientReady = true;
	if (clusterReady) init();
});

client.on('error', (msg) => beaver.log('client', msg));

// Finally, login
client.login(process.env.TOKEN);

async function init() {
	// Database Handler
	mongoose.set('strictQuery', true);
	mongoose.set('debug', false);

	try {
		await mongoose.connect(process.env.DATABASE_URL, { dbName: process.env.DATABASE_NAME });
	} catch (error) {
		beaver.log('database', error);
		return;
	}

	// Command Handler
	const commandsPath = path.resolve(process.cwd(), './commands');
	const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.resolve(commandsPath, file);
		const command = await import(pathToFileURL(filePath).toString());
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			beaver.log('command-registration', `Error registering /${basename(file, '.js')} command: missing a required "data" or "execute" property.`);
		}
	}

	// Event Handler
	const eventsPath = path.resolve(process.cwd(), './events');
	const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
	for (const file of eventFiles) {
		const filePath = path.resolve(eventsPath, file);
		const event = await import(pathToFileURL(filePath).toString());
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}

	// Update Servers
	if (process.env.UPDATE_SERVERS_ON_LAUNCH == 'true') await updateServers(client);
	// Delay the update based on cluster id
	setTimeout(() => setInterval(updateServers, 6 * 60 * 1000, client), client.cluster.id * process.env.BUFFER * 1000);

	// Update shard status in delegate
	if (process.env.NODE_ENV == 'production') {
		setInterval(() => updateDelegate(client), 15 * 60 * 1000);
	}
}
