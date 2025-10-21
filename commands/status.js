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

// Command to get the status of a server

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
	// This will hold the server object
	let server;

	// If a server parameter has been provided
	if (interaction.options.getString('server')) {
		// First try to find the server (we assume it is monitored)
		server = await findServer(interaction.options.getString('server'), ['nickname', 'ip'], interaction.guildId);

		// If we are unable to find the server, we assume that the user has provided the IP of an unmonitored server
		// This is perfectly valid since we want to find the status of any server
		// Here we override the server object to act as though it was a monitored server
		// If a platform has not been provided here, we assume they want to check a Java server
		if (!server) {
			server = {
				ip: interaction.options.getString('server'),
				platform: interaction.options.getString('platform') || 'java'
			};
		}
	} else {
		// If no server was provided and none are monitored, we cannot continue
		if (await noMonitoredServers(interaction.guildId, interaction, true)) return;

		// If no server was provided, but there is a default server set, use that instead
		// A guild should always have a default server
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

	// If server is offline, we send a simplified offline message since other parameters won't be available
	if (!serverStatus) {
		await sendMessage(
			interaction,
			serverOfflineLocalizations[interaction.locale] ?? `*The server is offline!*`,
			`${statusForLocalizations[interaction.locale] ?? 'Status for'} ${server.ip}:`
		);
		return;
	}

	// If the server is online, we create the full message
	let message;

	// If no one is online, we indicate this in a more human readable manner than 0/x
	// Extra? maybe but it causes no harm
	if (!serverStatus.players.online) {
		message = noPlayersLocalizations[interaction.locale] ?? `*No one is playing!*`;
	} else {
		// Add the current playerset to the message.
		message = `**${serverStatus.players.online} / ${serverStatus.players.max}** ${playersOnlineLocalizations[interaction.locale] ?? 'player(s) online.'}`;

		// If the server returns a sample of players, which only happens if query is enabled, we add it to the message too.
		if (serverStatus.players.sample?.length) message += `\n\n ${serverStatus.players.sample.sort().join(', ')}`;
	}

	// Build the response embed we will send back to discord
	// It contains information llike the MOTD, server version, and latency with nice formatting
	const responseEmbed = new EmbedBuilder()
		.setTitle(`${statusForLocalizations[interaction.locale] ?? 'Status for'} ${server.ip}:`)
		.setColor(embedColor)
		.setDescription(message)
		.addFields(
			{ name: MOTDLocalizations[interaction.locale] ?? 'MOTD:', value: serverStatus.motd.trim() || (noMOTDLocalizations[interaction.locale] ?? 'None') },
			{
				name: serverVersionLocalizations[interaction.locale] ?? 'Server version:',
				value: serverStatus.version.name || (noServerVersionLocalizations[interaction.locale] ?? 'Not specified'),
				inline: true
			},
			{ name: latencyLocalizations[interaction.locale] ?? 'Latency:', value: `${Math.round(serverStatus.latency)} ms`, inline: true }
		);

	// Set thumbnail of the embed to server icon
	// Discord makes this a little convoluted
	// We essentially need to download the icon, turn it into a file, then add the file as an attachment
	// TODO: If no server icon is returned, use the default minecraft server icon
	let files = [];

	if (serverStatus.icon) {
		// Extract the image data
		let iconBuffer = new Buffer.from(serverStatus.icon.split(',')[1], 'base64');
		// Convert it into an attachment
		files.push(new AttachmentBuilder(iconBuffer, { name: 'icon.jpg' }));
		// Add the attachment as the thumbnail
		responseEmbed.setThumbnail('attachment://icon.jpg');
	}

	// Reply with the attached thumbnail
	await interaction.editReply({ embeds: [responseEmbed], files });
}
