'use strict';
import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getServers, setOfflineIndicator, setOnlineIndicator } from '../functions/databaseFunctions.js';
import { sendMessage } from '../functions/sendMessage.js';
import { isNotMonitored, isValidIndicator, noMonitoredServers } from '../functions/inputValidation.js';
import { findDefaultServer, findServer } from '../functions/findServer.js';
import {
	allServerIndicatorsUpdatedLocalizations,
	descriptionLocalizations,
	nameLocalizations,
	offlineOptionDescriptionLocalizations,
	offlineOptionLocalizations,
	onlineOptionDescriptionLocalizations,
	onlineOptionLocalizations,
	serverIndicatorsUpdatedLocalizations,
	serverOptionDescriptionLocalizations,
	serverOptionLocalizations
} from '../localizations/indicators.js';

// prettier-ignore
export const data = new SlashCommandBuilder()
    .setName('indicators')
    .setNameLocalizations(nameLocalizations)
    .setDescription('Customise the online/offline indicators for a particular server')
    .setDescriptionLocalizations(descriptionLocalizations)
    .addStringOption((option) => option
            .setName('server')
            .setNameLocalizations(serverOptionLocalizations)
            .setDescription('Server IP address or nickname')
            .setDescriptionLocalizations(serverOptionDescriptionLocalizations)
            .setRequired(true))
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
	if (await noMonitoredServers(interaction.guildId, interaction)) return;

	const onlineIndicator = interaction.options.getString('online');
	const offlineIndicator = interaction.options.getString('offline');

	if (!onlineIndicator && !offlineIndicator) {
		await sendMessage(interaction, 'No indicators were provided! We will retain default indicators.');
		return;
	}

	// Make sure indicators are valid
	if (onlineIndicator && !(await isValidIndicator(onlineIndicator, interaction))) return;
	if (offlineIndicator && !(await isValidIndicator(offlineIndicator, interaction))) return;

	if (interaction.options.getString('server') == 'all') {
		let monitoredServers = await getServers(interaction.guild.id);

		await Promise.allSettled(
			monitoredServers.map(async (server) => {
				if (onlineIndicator) {
					setOnlineIndicator(interaction.guildId, server, onlineIndicator);
				}
				if (offlineIndicator) {
					setOfflineIndicator(interaction.guildId, server, offlineIndicator);
				}
			})
		);

		const localization = allServerIndicatorsUpdatedLocalizations[interaction.locale];

		if (localization) {
			await sendMessage(interaction, localization);
		} else {
			await sendMessage(
				interaction,
				'The online/offline indicators have been updated for all servers. The changes will be reflected with the next update, in about 5-6 minutes.'
			);
		}

		return;
	}

	let server;

	// Find the server to rename
	if (interaction.options.getString('server')) {
		server = await findServer(interaction.options.getString('server'), ['ip', 'nickname'], interaction.guildId);
		if (await isNotMonitored(server, interaction)) return;
	} else {
		server = await findDefaultServer(interaction.guildId);
	}

	// Update the server's online and offline indicators, if provided
	if (onlineIndicator) {
		setOnlineIndicator(interaction.guildId, server, onlineIndicator);
	}
	if (offlineIndicator) {
		setOfflineIndicator(interaction.guildId, server, offlineIndicator);
	}

	const localization = serverIndicatorsUpdatedLocalizations[interaction.locale];

	if (localization) {
		await sendMessage(interaction, `${localization[1]} ${interaction.options.getString('server')}. ${localization[2]}`);
	} else {
		await sendMessage(
			interaction,
			`The online/offline indicators have been updated for ${interaction.options.getString('server')}. The changes will be reflected with the next update, in about 5-6 minutes.`
		);
	}
}
