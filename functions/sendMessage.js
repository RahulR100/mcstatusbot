'use strict';
import { EmbedBuilder } from 'discord.js';

// The global default embed color for this bot
export const embedColor = '#7289DA';

// Send a message to the interaction
// If title is provided, it will be used as the embed title
export async function sendMessage(interaction, message, title) {
	const responseEmbed = new EmbedBuilder().setDescription(message).setColor(embedColor);
	if (title) responseEmbed.setTitle(title);

	// We editReply as the interaction should already be deferred or replied to as this point
	await interaction.editReply({ embeds: [responseEmbed] });
}
