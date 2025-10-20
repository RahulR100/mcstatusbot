'use strict';
import 'dotenv/config';
import { AutoResharderClusterClient, ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { ActivityType, Client, Collection, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import { readdirSync } from 'node:fs';
import path, { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beaver } from './functions/consoleLogging.js';
import { updateServers } from './functions/updateServers.js';
import { updateDelegate } from './functions/updateDelegate.js';
import { getTotalMonitoredServers } from './functions/databaseFunctions.js';

// Catch all errors that occur during the shard initialization
let spoolErrors = false;

// Database Handler
mongoose.set('strictQuery', true);
mongoose.set('debug', false);

// Connect to the database
try {
	await mongoose.connect(process.env.DATABASE_URL || "mongodb://mongodb:27017", { dbName: process.env.DATABASE_NAME || "mcstatusbot" });
} catch (error) {
	beaver.log('database', error);
	spoolErrors = true;
}

// Calculate the interval for updating servers (depends on the number of monitored servers)
// We user totalGuids / 50 because 50 is the maximum number of requests we can make per second to discord.
// A buffer (usually 60s) is added as an extra precaution to avoid hitting rate limits.
const totalGuilds = await getTotalMonitoredServers();
const interval = Math.round(Math.max(6 * 60 * 1000, (totalGuilds / 50 + parseInt(process.env.BUFFER || 60)) * 1000));

// Define client options
let clientOptions = {
	shards: getInfo().SHARD_LIST,
	shardCount: getInfo().TOTAL_SHARDS,
	intents: [GatewayIntentBits.Guilds],
	presence: { activities: [{ name: '/help', type: ActivityType.Watching }] }
};

// If we're in production, we set the rest API to use the proxy URL and set the interval.
// Setting this separately allows us to test the bot locally without needing to set up a proxy server.
if (process.env.PROXY_URL) {
	clientOptions.rest = { api: `${process.env.PROXY_URL}/api`, globalRequestsPerSecond: Infinity, timeout: interval };
}

// Create the client instance, and new collections for commands and command cooldowns
export let client = new Client(clientOptions);

client.cluster = new ClusterClient(client);
client.cooldowns = new Collection();
client.commands = new Collection();

client.on("clientReady", (readyClient) => {
    readyClient.cluster.triggerReady();
})

client.on('error', (msg) => beaver.log('client', msg));

// Add autoresharder client
new AutoResharderClusterClient(client.cluster)

// initialise the shard (once client and cluster are ready)
client.cluster.on('ready', init);

// Finally, login
client.login(process.env.TOKEN);

// Initialize the shard (once client and cluster are ready)
async function init() {
	// If there are any errors during shard initialization, we don't want to continue
	if (spoolErrors) return;

	// Register all commands
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

	// Register all events
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
	if (client.cluster.id == 0) {
		beaver.log('update-servers', `We have ${totalGuilds} servers monitored, making the update interval ${interval / 1000} seconds`);
	}

	// Initial update of all servers on launch
	// Useful to see immediate changes after a restart/deploy
	// Only do this if you have < 1000 servers else you may hit rate limits and encounter weird issues
	if (process.env.UPDATE_SERVERS_ON_LAUNCH == 'true') await updateServers(client);

	// Main update loop
	// Each shard is offset by (shard ID * 1000ms) to avoid all shards updating at the same time
	setTimeout(() => setInterval(updateServers, interval, client), client.cluster.id * 1000);

	// Update shard status in delegate
	if (process.env.DELEGATE_URL && process.env.DELEGATE_TOKEN) {
		setInterval(() => updateDelegate(client), 15 * 60 * 1000);
	}
}
