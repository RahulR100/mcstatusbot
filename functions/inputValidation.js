'use strict';
import {
	alreadyDefaultServerLocalizations,
	alreadyMonitoredLocalizations,
	alreadyMonitoredNicknameLocalizations,
	alreadyUsedNicknameIPLocalizations,
	alreadyUsedNicknameLocalizations,
	invalidServerLocalizations,
	multipleMonitoredServersLocalizations,
	noMonitoredServersLocalizations,
	notMonitoredLocalizations,
	removingDefaultServerLocalizations,
	restrictedKeywordLocalizations,
	restrictedKeywordNicknameLocalizations,
	invalidIndicatorLocalizations,
	invalidPortLocalizations,
	invalidBogonLocalizations,
	invalidUnderscoreLocalizations
} from '../localizations/inputValidation.js';
import { numberOfServers } from './databaseFunctions.js';
import { findDefaultServer, findServer } from './findServer.js';
import { sendMessage } from './sendMessage.js';
import { validateHost } from './validateHost.js';

// Reserved names that cannot be used as IP addresses or nicknames
// These are used to prevent conflicts with commands and reserved keywords
const reservedNames = ['all'];

// Check if there are no monitored servers
export async function noMonitoredServers(guildId, interaction, isStatusCommand) {
	// If there are no servers, send a message to the interaction if it exists
	if ((await numberOfServers(guildId)) == 0) {
		if (interaction) {
			const localizedError = noMonitoredServersLocalizations[interaction.locale];

			if (localizedError) {
				await sendMessage(interaction, `${localizedError[1]}${isStatusCommand ? localizedError[2] : '!'}`);
			} else {
				await sendMessage(interaction, `There are no monitored servers${isStatusCommand ? ' and no IP address was specified!' : '!'}`);
			}
		}
		return true;
	}

	// If there are servers, return false
	// This may seem backwards but not that the function name is `noMonitoredServers`
	// and we want to return false if there are monitored servers
	return false;
}

// Check if the server is already the default server
export async function isDefault(server, guildId, interaction) {
	let defaultServer = await findDefaultServer(guildId);

	if (server.ip == defaultServer.ip) {
		interaction && (await sendMessage(interaction, alreadyDefaultServerLocalizations[interaction.locale] ?? 'This server is already the default server!'));
		return true;
	}

	return false;
}

// Check if the server is already being monitored
export async function isMonitored(ip, guildId, interaction) {
	let server = await findServer(ip, ['ip'], guildId);

	// Check if the server IP is already being monitored
	if (server) {
		interaction && (await sendMessage(interaction, alreadyMonitoredLocalizations[interaction.locale] ?? 'This IP address is already being monitored!'));
		return true;
	}

	// Check if the server nickname is already monitored, or the provided IP is the nickname of another server
	server = await findServer(ip, ['nickname'], guildId);
	if (server) {
		interaction &&
			(await sendMessage(
				interaction,
				alreadyMonitoredNicknameLocalizations[interaction.locale] ??
					'This IP address is the nickname of another server that is already being monitored!'
			));
		return true;
	}

	// Check if the provided IP is a reserved name
	if (reservedNames.includes(ip)) {
		interaction && (await sendMessage(interaction, restrictedKeywordLocalizations[interaction.locale] ?? 'This IP address is a restricted keyword!'));
		return true;
	}

	return false;
}

// Check if the server is not being monitored
export async function isNotMonitored(server, interaction) {
	if (!server) {
		interaction && (await sendMessage(interaction, notMonitoredLocalizations[interaction.locale] ?? 'This server is not being monitored!'));
		return true;
	}

	return false;
}

// Check if the nickname is already being used
export async function isNicknameUsed(nickname, guildId, interaction) {
	let server = await findServer(nickname, ['nickname'], guildId);

	// Check if the nickname is already being used by another server
	if (nickname && server) {
		interaction && (await sendMessage(interaction, alreadyUsedNicknameLocalizations[interaction.locale] ?? 'This nickname is already being used!'));
		return true;
	}

	// Check if the nickname is the IP address of another server that is already being monitored
	server = await findServer(nickname, ['ip'], guildId);
	if (nickname && server) {
		interaction &&
			(await sendMessage(
				interaction,
				alreadyUsedNicknameIPLocalizations[interaction.locale] ?? 'This nickname is the IP address of another server that is already being monitored!'
			));
		return true;
	}

	// Check if the nickname is a reserved name
	if (reservedNames.includes(nickname)) {
		interaction && (await sendMessage(interaction, restrictedKeywordNicknameLocalizations[interaction.locale] ?? 'This nickname is a restricted keyword!'));
		return true;
	}

	return false;
}

// Check if no server was specified for a command that requires a server to be specified
// Note that the use of a default server overrides this function as it is considred a server specification
export async function isServerUnspecified(server, guildId, interaction) {
	if (!server && (await multipleMonitoredServers(guildId))) {
		interaction &&
			(await sendMessage(
				interaction,
				multipleMonitoredServersLocalizations[interaction.locale] ??
					'There are multiple monitored servers, and no server was specified! Use `/unmonitor all` to unmonitor all servers.'
			));
		return true;
	}

	return false;
}

// Check if a server is the default server before removing it
// We used to set the default server to the first monitored server, but this caused unintended behavior for users
// So now we require the user to set another server as the default server before unmonitoring
export async function removingDefaultServer(server, guildId, interaction) {
	if ((await multipleMonitoredServers(guildId)) && (await isDefault(server, guildId))) {
		interaction &&
			(await sendMessage(
				interaction,
				removingDefaultServerLocalizations[interaction.locale] ??
					'There are multiple monitored servers, and this server is the default server! Set another server to be the default server before unmonitoring this server, or use `/unmonitor all` to unmonitor all servers.'
			));
		return true;
	}

	return false;
}

// Check if there are multiple monitored servers
export async function multipleMonitoredServers(guildId) {
	return (await numberOfServers(guildId)) > 1;
}

// Check if the server is valid for monitoring
// This function uses the `validateHost` function to check if the server is a valid IP address or domain name
// It also checks if the port is valid, if the server is a bogon IP address
// Here is where we handle sending messages to the interaction depending on the validation result
export async function isValidServer(server, interaction) {
	const serverCheck = validateHost(server);

	if (!serverCheck.valid) {
		if (interaction) {
			switch (serverCheck.reason) {
				// Invalid port
				case 'port':
					await sendMessage(interaction, invalidPortLocalizations[interaction.locale] ?? 'An invalid port was supplied!');
					break;

				// Bogon IP address
				// Includes private or non-routable IP addresses
				case 'bogon':
					await sendMessage(
						interaction,
						invalidBogonLocalizations[interaction.locale] ?? 'This is a private IP address! The bot is not able to access this IP address.'
					);
					break;

				// Catch all
				// Should ideally never be reached
				default:
					await sendMessage(interaction, invalidServerLocalizations[interaction.locale] ?? 'This is not a valid IP address or domain name!');
					break;
			}
		}

		return false;
	}

	return true;
}

// Check if the server indicator is valid
// The 16 character limit is not discord enforced but is for readability purposes
export async function isValidIndicator(indicator, interaction) {
	if (indicator.length > 16) {
		interaction && (await sendMessage(interaction, invalidIndicatorLocalizations[interaction.locale] ?? 'The indicator must be 16 characters or less!'));
		return false;
	}

	return true;
}
