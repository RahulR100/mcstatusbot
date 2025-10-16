'use strict';
import 'dotenv/config';
import { AutoResharderManager, ClusterManager, HeartbeatManager, ReClusterManager } from 'discord-hybrid-sharding';
import { beaver } from './functions/consoleLogging.js';

// The number of shards to use per cluster
// Higher values save memory but put more pressure on the thread
const shardsPerClusters = parseInt(process.env.SPC);

// Create the cluster manager
// Spawns instances of shards specified in bot.js
let manager = new ClusterManager('./bot.js', {
	shardsPerClusters: shardsPerClusters,
	token: process.env.TOKEN,
	mode: 'process',
	restarts: {
		max: 5,
		interval: 24 * 60 * 60 * 1000
	}
});

manager.extend(new ReClusterManager());
manager.extend(new AutoResharderManager());
manager.extend(new HeartbeatManager());

manager.on('clusterCreate', (cluster) => beaver.log('sharding', `Created cluster ${cluster.id}`));

// Spawn the clusters and set an interval to check for recommended shard count every 24 hours
// Timeout is set to -1 since each shard takes a while to initialize
async function spawnShards() {
	beaver.log('sharding', `Starting bot!`);
	await manager.spawn({ timeout: -1 });
}

// Start the bot
try {
	spawnShards();
} catch (error) {
	beaver.log('sharding', error);
}
