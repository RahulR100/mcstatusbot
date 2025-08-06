'use strict';
import 'dotenv/config';
import { ClusterManager, HeartbeatManager, ReClusterManager, fetchRecommendedShards } from 'discord-hybrid-sharding';
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
manager.extend(
	new HeartbeatManager({
		interval: 12000,
		maxMissedHeartbeats: 5
	})
);

manager.on('clusterCreate', (cluster) => beaver.log('sharding', `Created cluster ${cluster.id}`));

// Spawn the clusters and set an interval to check for recommended shard count every 24 hours
// Timeout is set to -1 since each shard takes a while to initialize
async function spawnShards() {
	beaver.log('sharding', `Starting bot!`);
	await manager.spawn({ timeout: -1 });
	setInterval(reclusterShards, 24 * 60 * 60 * 1000);
}

// Check if the number of shards running matches the recommended number of shards
// By default, discord will add new guilds to the last shard
// This may overload the last shard over time, so we recluster to spread the load evenly
async function reclusterShards() {
	try {
		const recommendedShards = await fetchRecommendedShards(process.env.TOKEN);

		// Only recluster if the recommended number of shards is different from the current number of shards
		if (recommendedShards == manager.totalShards) return;

		beaver.log('sharding', `Reclustering from ${manager.totalShards} to ${recommendedShards} shards`);
		manager.recluster.start({
			restartMode: 'gracefulSwitch',
			totalShards: recommendedShards,
			shardsPerClusters: shardsPerClusters,
			shardList: null,
			shardClusterList: null,
			timeout: -1
		});
	} catch (error) {
		beaver.log('sharding', error);
	}
}

// Start the bot
try {
	spawnShards();
} catch (error) {
	beaver.log('sharding', error);
}
