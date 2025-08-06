'use strict';
import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { isMissingPermissions } from '../functions/botPermissions.js';
import { beaver } from '../functions/consoleLogging.js';
import { findDefaultServer, findServer } from '../functions/findServer.js';
import { isNicknameUsed, isNotMonitored, noMonitoredServers } from '../functions/inputValidation.js';
import { sendMessage } from '../functions/sendMessage.js';
import {
	descriptionLocalizations,
	errorMessageLocalizations,
	nameLocalizations,
	nicknameDescriptionLocalizations,
	nicknameLocalizations,
	rateLimitErrorLocalizations,
	serverDescriptionLocalizations,
	serverLocalizations,
	successMessageLocalizations
} from '../localizations/nickname.js';

// Command to set the nickname of a server

// prettier-ignore
export const data = new SlashCommandBuilder()
	.setName('nickname')
    .setNameLocalizations(nameLocalizations)
	.setDescription('Change the nickname of a monitored Minecraft server')
    .setDescriptionLocalizations(descriptionLocalizations)
	.addStringOption((option) => option
		.setName('nickname')
        .setNameLocalizations(nicknameLocalizations)
		.setDescription('Server nickname')
        .setDescriptionLocalizations(nicknameDescriptionLocalizations)
		.setRequired(true))
	.addStringOption((option) => option
		.setName('server')
        .setNameLocalizations(serverLocalizations)
		.setDescription('Server IP address or nickname')
        .setDescriptionLocalizations(serverDescriptionLocalizations)
		.setRequired(false))
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts([InteractionContextType.Guild]);

export async function execute(interaction) {
    // If there are no monitored servers, or the nickname is already used, we stop execution
    // Nicknames MUST be unique (within the guild) since they can also be used as a search parameter
	if (await noMonitoredServers(interaction.guildId, interaction)) return;
	if (await isNicknameUsed(interaction.options.getString('nickname'), interaction.guildId, interaction)) return;

    // Create server object
	let server;

	// If the server is provided, use that
    // Else use the default server
	if (interaction.options.getString('server')) {
		server = await findServer(interaction.options.getString('server'), ['ip', 'nickname'], interaction.guildId);
		if (await isNotMonitored(server, interaction)) return;
	} else {
		server = await findDefaultServer(interaction.guildId);
	}

    // Check the bots permissions on the category
    // If there are missing permissions, the rename will fail so we stop here to prevent state mismatch between discord and our database
	if (await isMissingPermissions('category', interaction.guild.channels.cache.get(server.categoryId), interaction)) return;

	// Rename the server category
	try {
		let channel = await interaction.guild.channels.cache.get(server.categoryId);
		await channel?.setName(interaction.options.getString('nickname'));
	} catch (error) {
        // This is one of the few cases we want to send a rate limit error to the user
        // Categories can only be changed twice in 10 minutes
        // If the user tries to change it more than twice we let them know that they need to wait instead of silently failing and hitting more rate limits
        // This cannot be achieved using cooldowns
		if (error.name.includes('RateLimitError')) {
			await sendMessage(
				interaction,
				rateLimitErrorLocalizations[interaction.locale] ??
					'The rate limit for this channel has been reached, please try renaming this server in a few minutes!'
			);
		} else {
			beaver.log(
				'nickname',
				'Error renaming channel while setting nickname',
				JSON.stringify({
					'Channel ID': server.categoryId,
					'Guild ID': interaction.guildId
				}),
				error
			);
			await sendMessage(interaction, errorMessageLocalizations[interaction.locale] ?? 'There was an error while renaming the channel!');
		}
		return;
	}

    // We also let the user know that there is a delay between us submitting a request to discord, and the change appearing
	await sendMessage(
		interaction,
		successMessageLocalizations[interaction.locale] ??
			"The server has successfully been renamed. It might take a few seconds to show up due to Discord's API limitations."
	);
}
