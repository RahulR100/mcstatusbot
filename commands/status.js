'use strict';
import { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { beaver } from '../functions/consoleLogging.js';
import { findDefaultServer, findServer } from '../functions/findServer.js';
import { getServerStatus } from '../functions/getServerStatus.js';
import { isValidServer, noMonitoredServers } from '../functions/inputValidation.js';
import { embedColor, sendMessage } from '../functions/sendMessage.js';
import {
	MOTDLocalizations,
	descriptionLocalizations,
	errorMessageLocalizations,
	latencyLocalizations,
	nameLocalizations,
	noMOTDLocalizations,
	noPlayersLocalizations,
	noServerVersionLocalizations,
	platformDescriptionLocalizations,
	platformLocalizations,
	playersOnlineLocalizations,
	serverDescriptionLocalizations,
	serverLocalizations,
	serverOfflineLocalizations,
	serverVersionLocalizations,
	statusForLocalizations
} from '../localizations/status.js';

// prettier-ignore
export const data = new SlashCommandBuilder()
	.setName('status')
    .setNameLocalizations(nameLocalizations)
	.setDescription('Displays the current status and active players for any server')
    .setDescriptionLocalizations(descriptionLocalizations)
	.addStringOption((option) => option
		.setName('server')
        .setNameLocalizations(serverLocalizations)
		.setDescription('Server IP address or nickname')
        .setDescriptionLocalizations(serverDescriptionLocalizations)
		.setRequired(false))
	.addStringOption((option) => option
		.setName('platform')
        .setNameLocalizations(platformLocalizations)
		.setDescription('Server platform')
        .setDescriptionLocalizations(platformDescriptionLocalizations)
		.setRequired(false)
		.setChoices({ name: 'Java', value: 'java' }, { name: 'Bedrock', value: 'bedrock' }));

export async function execute(interaction) {
	let server;

	if (interaction.options.getString('server')) {
		server = await findServer(interaction.options.getString('server'), ['nickname', 'ip'], interaction.guildId);
		if (!server) {
			server = {
				ip: interaction.options.getString('server'),
				platform: interaction.options.getString('platform') || 'java'
			};
		}
	} else {
		if (await noMonitoredServers(interaction.guildId, interaction, true)) return;
		server = await findDefaultServer(interaction.guildId);
	}

	// Validate the server IP
	if (!(await isValidServer(server.ip, interaction))) return;

	//Get the server status
	let serverStatus;
	try {
		serverStatus = await getServerStatus(server);
	} catch (error) {
		beaver.log(
			'status',
			'Error pinging Minecraft server while running status command',
			JSON.stringify({
				'Guild ID': interaction.guildId,
				'Server IP': server.ip
			}),
			error
		);
		await sendMessage(
			interaction,
			errorMessageLocalizations[interaction.locale] ??
				'There was an error pinging the server. Please verify the server address, and try again in a few seconds!'
		);
		return;
	}

	// Message if server is offline
	if (!serverStatus.online) {
		await sendMessage(
			interaction,
			serverOfflineLocalizations[interaction.locale] ?? `*The server is offline!*`,
			`${statusForLocalizations[interaction.locale] ?? 'Status for'} ${server.ip}:`
		);
		return;
	}

	// Message if server is online
	let message;
	if (!serverStatus.current_players) {
		message = noPlayersLocalizations[interaction.locale] ?? `*No one is playing!*`;
	} else {
        let playerList = serverStatus.player_list || [];

		message = `**${serverStatus.current_players}/${serverStatus.max_players}** ${playersOnlineLocalizations[interaction.locale] ?? 'player(s) online.'}`;
		if (playerList.length) message += `\n\n ${playerList.sort().join(', ')}`;
	}

	const responseEmbed = new EmbedBuilder()
		.setTitle(`${statusForLocalizations[interaction.locale] ?? 'Status for'} ${server.ip}:`)
		.setColor(embedColor)
		.setDescription(message)
		.addFields(
			{ name: MOTDLocalizations[interaction.locale] ?? 'MOTD:', value: serverStatus.stripped_motd || (noMOTDLocalizations[interaction.locale] ?? 'None') },
			{
				name: serverVersionLocalizations[interaction.locale] ?? 'Server version:',
				value: serverStatus.version || (noServerVersionLocalizations[interaction.locale] ?? 'Not specified'),
				inline: true
			},
			{ name: latencyLocalizations[interaction.locale] ?? 'Latency:', value: `${serverStatus.latency} ms`, inline: true }
		);

	// Set thumbnail to server icon
	let files = [];
	if (serverStatus.favicon_b64) {
		let iconBuffer = new Buffer.from(serverStatus.favicon_b64.split(',')[1], 'base64');
		files.push(new AttachmentBuilder(iconBuffer, { name: 'icon.jpg' }));
		responseEmbed.setThumbnail('attachment://icon.jpg');
	}

	await interaction.editReply({ embeds: [responseEmbed], files });
}
