'use strict';
import { needsPermissionsLocalizations } from '../localizations/botPermissions.js';
import { sendMessage } from './sendMessage.js';

// The permissions that the bot needs to function properly
// DO NOT EDIT THIS UNLESS YOU KNOW WHAT YOU ARE DOING
const requiredPermissions = [
	{ flag: 'ViewChannel', category: 'View Channels', channel: 'View Channel', server: 'View Channels' },
	{ flag: 'ManageChannels', category: 'Manage Channels', channel: 'Manage Channel', server: 'Manage Channels' },
	{ flag: 'ManageRoles', category: 'Manage Permissions', channel: 'Manage Permissions', server: 'Manage Roles' },
	{ flag: 'Connect', category: 'Connect', channel: 'Connect', server: 'Connect' }
];

// Check if the bot is missing any required permissions in a channel or server
// This should only happen if the server admins have changed the bot's permissions
export async function isMissingPermissions(type, object, interaction) {
	if (!object) return false;

	const missingPermissions = getMissingPermissions(type, object);

	if (missingPermissions) {
		if (interaction) {
			const localizedError = needsPermissionsLocalizations[interaction.locale];

			if (localizedError) {
				await sendMessage(interaction, `${localizedError[1]} ${type.toLowerCase()} ${localizedError[2]} ${missingPermissions}`);
			} else {
				await sendMessage(
					interaction,
					`The bot needs the following permissions in the ${type.toLowerCase()} to use this command: ${missingPermissions}`
				);
			}
		}
		return true;
	}

	return false;
}

// Get a human readable list of missing permissions in a channel or server
export function getMissingPermissions(type, object) {
	type = type.toLowerCase();
	const basicType = type == 'status channel' || type == 'players channel' ? 'channel' : type;

	const botPermissions = type == 'server' ? object.members.me.permissions.toArray() : object.guild.members.me.permissionsIn(object.id).toArray();
	const missingPermissions = requiredPermissions.filter((permission) => !botPermissions.includes(permission.flag)).map((permission) => permission[basicType]);

	return missingPermissions.length ? missingPermissions.join(', ') : null;
}
