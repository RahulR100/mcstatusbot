'use strict';
import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getServers, setServers } from '../functions/databaseFunctions.js';
import { findDefaultServer, findServer, findServerIndex } from '../functions/findServer.js';
import { isDefault, isNotMonitored, noMonitoredServers } from '../functions/inputValidation.js';
import { sendMessage } from '../functions/sendMessage.js';
import {
	defaultServerLocalizations,
	descriptionLocalizations,
	nameLocalizations,
	serverOptionLocalizations,
	successMessageLocalizations
} from '../localizations/default.js';

// Command to set a server as the default server

// prettier-ignore
export const data = new SlashCommandBuilder()
	.setName('default')
    .setNameLocalizations(nameLocalizations)
	.setDescription('Set a server to be the default for all commands')
    .setDescriptionLocalizations(descriptionLocalizations)
	.addStringOption((option) => option
		.setName('server')
		.setDescription('Server IP address or nickname')
        .setDescriptionLocalizations(serverOptionLocalizations)
		.setRequired(false))
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts([InteractionContextType.Guild]);

export async function execute(interaction) {
    // If no servers are monitored, then none are eligbile to be set as default so stop
	if (await noMonitoredServers(interaction.guildId, interaction)) return;

	// If no server is provided in the options, the bot will simply list the current default server
	let oldDefaultServer = await findDefaultServer(interaction.guildId);
	if (!interaction.options.getString('server')) {
		await sendMessage(interaction, oldDefaultServer.nickname || oldDefaultServer.ip, defaultServerLocalizations[interaction.locale] ?? 'Default Server:');
		return;
	}

    // If one is provided then we find it from the database
	let newDefaultServer = await findServer(interaction.options.getString('server'), ['ip', 'nickname'], interaction.guildId);

    // If it is not a monitored server, then it cannot be set as the default server
	if (await isNotMonitored(newDefaultServer, interaction)) return;

    // If it is the same as the old server, then we are already done!
	if (await isDefault(newDefaultServer, interaction.guildId, interaction)) return;

    // Swap the default flag from the old to the new server
    // TODO: retire the server index methods. There has to be a better way of doing this
	let monitoredServers = await getServers(interaction.guildId);
	const oldDefaultServerIndex = await findServerIndex(oldDefaultServer, interaction.guildId);
	const newDefaultServerIndex = await findServerIndex(newDefaultServer, interaction.guildId);
	monitoredServers[oldDefaultServerIndex].default = false;
	monitoredServers[newDefaultServerIndex].default = true;
	await setServers(interaction.guildId, monitoredServers);

    // Send success message
	await sendMessage(interaction, successMessageLocalizations[interaction.locale] ?? 'The server has successfully been made the default for all commands.');
}
