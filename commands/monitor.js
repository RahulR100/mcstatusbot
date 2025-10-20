'use strict';
import { ChannelType, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { isMissingPermissions } from '../functions/botPermissions.js';
import { beaver } from '../functions/consoleLogging.js';
import { addServer, getIndicators, getServers, setServers } from '../functions/databaseFunctions.js';
import { findDefaultServer, findServerIndex } from '../functions/findServer.js';
import { getServerStatus } from '../functions/getServerStatus.js';
import { isMonitored, isNicknameUsed, isValidIndicator, isValidServer, noMonitoredServers } from '../functions/inputValidation.js';
import { renameChannels } from '../functions/renameChannels.js';
import { sendMessage } from '../functions/sendMessage.js';
import {
	IPAddressDescriptionLocalizations,
	IPAddressLocalizations,
	defaultDescriptionLocalizations,
	defaultLocalizations,
	descriptionLocalizations,
	errorMessageLocalizations,
	nameLocalizations,
	nicknameDescriptionLocalizations,
	nicknameLocalizations,
	offlineOptionDescriptionLocalizations,
	offlineOptionLocalizations,
	onlineOptionDescriptionLocalizations,
	onlineOptionLocalizations,
	platformDescriptionLocalizations,
	platformLocalizations,
	successMessageLocalizations
} from '../localizations/monitor.js';

// Command to monitor a new server

// prettier-ignore
export const data = new SlashCommandBuilder()
	.setName('monitor')
    .setNameLocalizations(nameLocalizations)
	.setDescription('Create 2 voice channels that display the status of a Minecraft server')
    .setDescriptionLocalizations(descriptionLocalizations)
	.addStringOption((option) => option
		.setName('ip')
        .setNameLocalizations(IPAddressLocalizations)
		.setDescription('IP address')
        .setDescriptionLocalizations(IPAddressDescriptionLocalizations)
		.setRequired(true))
	.addStringOption((option) => option
		.setName('nickname')
        .setNameLocalizations(nicknameLocalizations)
		.setDescription('Server nickname')
        .setDescriptionLocalizations(nicknameDescriptionLocalizations)
		.setRequired(false))
	.addBooleanOption((option) => option
		.setName('default')
        .setNameLocalizations(defaultLocalizations)
		.setDescription('Set this server to be the default for all commands')
        .setDescriptionLocalizations(defaultDescriptionLocalizations)
		.setRequired(false))
	.addStringOption((option) => option
		.setName('platform')
        .setNameLocalizations(platformLocalizations)
		.setDescription('Server platform')
        .setDescriptionLocalizations(platformDescriptionLocalizations)
		.setRequired(false)
		.setChoices({ name: 'Java', value: 'java' }, { name: 'Bedrock', value: 'bedrock' }))
    .addStringOption((option) => option
        .setName('online')
        .setNameLocalizations(onlineOptionLocalizations)
        .setDescription('Online indicator')
        .setDescriptionLocalizations(onlineOptionDescriptionLocalizations)
        .setRequired(false))
    .addStringOption((option) => option
        .setName('offline')
        .setNameLocalizations(offlineOptionLocalizations)
        .setDescription('Offline indicator')
        .setDescriptionLocalizations(offlineOptionDescriptionLocalizations)
        .setRequired(false))
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts([InteractionContextType.Guild]);

export async function execute(interaction) {
    // If the bot is missing permissions on the server, stop
	if (await isMissingPermissions('server', interaction.guild, interaction)) return;

    // If the IP or nickname is already used, stop
    // We do not want to monitor duplicate servers
	if (await isMonitored(interaction.options.getString('ip'), interaction.guildId, interaction)) return;
	if (await isNicknameUsed(interaction.options.getString('nickname'), interaction.guildId, interaction)) return;

    // Check if the server is valid before adding it to the pool
	if (!(await isValidServer(interaction.options.getString('ip'), interaction))) return;

    // Get custom online and offline indicators if they are provided
	const onlineIndicator = interaction.options.getString('online');
	const offlineIndicator = interaction.options.getString('offline');

	// Make sure indicators (if provided) are valid
	if (onlineIndicator && !(await isValidIndicator(onlineIndicator, interaction))) return;
	if (offlineIndicator && !(await isValidIndicator(offlineIndicator, interaction))) return;

	// Unset the default server if the new server is to be the default
	if (interaction.options.getBoolean('default')) {
		let server = await findDefaultServer(interaction.guildId);
		let serverIndex = await findServerIndex(server, interaction.guildId);
		let monitoredServers = await getServers(interaction.guildId);

		if (monitoredServers.length > 0 && serverIndex >= 0) {
			monitoredServers[serverIndex].default = false;
		}

		await setServers(interaction.guildId, monitoredServers);
	}

	// Create the server object
    // Note: If this is the first server monitored, then it will automatically become the default
    // This ensures every guild has a default server
	let server = {
		ip: interaction.options.getString('ip'),
		nickname: interaction.options.getString('nickname') || null,
		default: (await noMonitoredServers(interaction.guildId)) ? true : interaction.options.getBoolean('default') || false,
		platform: interaction.options.getString('platform') || 'java',
		onlineIndicator: onlineIndicator || 'Online',
		offlineIndicator: offlineIndicator || 'Offline'
	};

	// Create the server category
    // Also set the category and voice channel permissions
	try {
		let category = await interaction.guild.channels.create({
			name: interaction.options.getString('nickname') || interaction.options.getString('ip'),
			type: ChannelType.GuildCategory,
			permissionOverwrites: [
				{
					id: interaction.guild.members.me,
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels]
				},
				{
					id: interaction.guild.roles.everyone,
					deny: [PermissionFlagsBits.Connect]
				}
			]
		});
		server.categoryId = category.id;
	} catch (error) {
		beaver.log('monitor', `Error creating category channel in guild: ${interaction.guildId}`, error);
		await sendMessage(
			interaction,
			errorMessageLocalizations[interaction.locale] ??
				'There was an error while creating the channels, please manually delete any channels that were created!'
		);
		return;
	}

	// Create the channels and add to category
    // Also add a placeholder to show that the bot is fetching the status of the servers
    // The channel creation and status fetching are decoupled to improve user experience (a change is seen faster)
	let voiceChannels = [
		{ idType: 'statusId', name: 'Status: ...' },
		{ idType: 'playersId', name: 'Players: ...' }
	];

    // Try creating the voice channels
	for (const voiceChannel of voiceChannels) {
		try {
			let channel = await interaction.guild.channels.create({
				name: voiceChannel.name,
				type: ChannelType.GuildVoice
			});
			server[voiceChannel.idType] = channel.id;
			await channel.setParent(server.categoryId);
		} catch (error) {
            // If there is an error in any voice channel, we roll back the creation of everything
            // This tries to ensure that the user does not need to delete channels manually
            // If this too fails, then the channels must be deleted manually
			const channelIds = ['categoryId', 'statusId', 'playersId'];
			
            await Promise.allSettled(
				channelIds.map(async (channelId) => {
					try {
						await interaction.guild.channels.cache.get(server[channelId])?.delete();
					} catch (error) {
						beaver.log(
							'monitor',
							'Error deleting channel while aborting monitor command',
							JSON.stringify({
								'Channel ID': server[channelId],
								'Guild ID': interaction.guildId,
								'Server IP': server.ip
							}),
							error
						);
					}
				})
			);

			beaver.log('monitor', `Error creating voice channel in guild: ${interaction.guildId}`, error);

			await sendMessage(
				interaction,
				errorMessageLocalizations[interaction.locale] ??
					'There was an error while creating the channels, please manually delete any channels that were created!'
			);

			return;
		}
	}

	// Add the server to the database once we know the channels have been created successfully
	await addServer(interaction.guildId, server);

    // Send success message
	await sendMessage(
		interaction,
		interaction.options.getBoolean('default')
			? (successMessageLocalizations[interaction.locale]?.default ?? 'Server successfully monitored and set as the default server!')
			: (successMessageLocalizations[interaction.locale]?.notDefault ?? 'Server successfully monitored!')
	);

	// Get the online/offline indicators for the server
	const indicators = await getIndicators(interaction.guildId, server);

	// Finally, get the server status and update the channels
    // This will overwrite the placeholder text we inserted above
	const serverStatus = await getServerStatus(server);
	const channels = [
		{ object: await interaction.guild.channels.cache.get(server.statusId), type: 'status' },
		{ object: await interaction.guild.channels.cache.get(server.playersId), type: 'players' }
	];
	await renameChannels(channels, serverStatus, indicators);
}
