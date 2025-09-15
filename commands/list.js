'use strict';

import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { noMonitoredServers } from '../functions/inputValidation';
import { sendMessage } from '../functions/sendMessage';

// Command to list all servers monitored, and provide options to manage them

// prettier-ignore
export const data = new SlashCommandBuilder()
    .setName('list')
    .setDescription('List all servers monitored in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts([InteractionContextType.Guild]);

export async function execute(interaction) {
	// If no servers are monitored then there are none to list
	if (await noMonitoredServers(interaction.guildId, interaction)) {
		await sendMessage(interaction, 'There are no monitored servers!', 'Error:');
		return;
	}
}
