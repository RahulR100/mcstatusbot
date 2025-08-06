'use strict';
import { Collection, Events, InteractionContextType, MessageFlags } from 'discord.js';
import { beaver } from '../functions/consoleLogging.js';
import { cooldownErrorLocalizations, errorMessageLocalizations } from '../localizations/interactionCreate.js';
import { getEphemeral } from '../functions/databaseFunctions.js';

// This function is executed when the bot receives an interaction

// Mandatory event metadata
export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction) {
	// Only respond to slash commands
	if (!interaction.isChatInputCommand()) return;

	// Check if the command issued is in our list of registerd commands
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) return;

	// If the command was executed from a guild, check if the guild has ephemeral responses enabled
	// All DM messages are ephemeral by default
	let ephemeral = true;
	if (interaction.context == InteractionContextType.Guild) {
		ephemeral = await getEphemeral(interaction.guildId);
	}

	// Defer the reply to the interaction
	// ALL interactions must be defered since discord only allows bots 3 seconds to respond to messages
	try {
		ephemeral ? await interaction.deferReply({ flags: MessageFlags.Ephemeral }) : await interaction.deferReply();
		if (!interaction.deferred) throw new Error('Interaction was not deferred');
	} catch (error) {
		const commandOptions = getCommandOptions(interaction);

		beaver.log(
			'interaction-create',
			'Error deferring reply to command',
			JSON.stringify({
				'Guild ID': interaction.guildId,
				'Command Name': interaction.commandName,
				'Command Options': commandOptions || 'None'
			}),
			error
		);

		return;
	}

	// Get command cooldowns to prevent command spam
	const { cooldowns } = interaction.client;

	// Create a bucket for each command
	// The cooldown is not global (it is per commmand)
	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	// Get the current timestamp
	// Note: Changing the server timezone will cause problems here
	const now = Date.now();
	// Get the last noted timestamp for each command (the last time the user used this command)
	const timestamps = cooldowns.get(command.data.name);
	// Define the cooldown time
	// Keep this between 3-5 seconds, definitely below 10 seconds
	const cooldownAmount = 3;

	// Check if the user is on cooldown
	if (timestamps.has(interaction.user.id)) {
		// Create the expiration window
		// This is the time when the user will be able to use the command next
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount * 1000;

		// If the user is on cooldown, tell them to wait
		if (now < expirationTime) {
			const localizedError = cooldownErrorLocalizations[interaction.locale];

			if (localizedError) {
				const reply = { content: `${localizedError[1]} ${cooldownAmount} ${localizedError[2]}` };
				if (ephemeral) reply.flags = MessageFlags.Ephemeral;

				await interaction.editReply(reply);
			} else {
				const reply = { content: `Please wait. You are on cooldown for ${cooldownAmount} seconds.` };
				if (ephemeral) reply.flags = MessageFlags.Ephemeral;

				await interaction.editReply(reply);
			}

			return;
		}
	}

	// If the user is not on cooldown then we add the current timestamp
	// And continue executing
	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount * 1000);

	// Now execute the command
	try {
		await command.execute(interaction);
	} catch (error) {
		const commandOptions = getCommandOptions(interaction);

		beaver.log(
			'interaction-create',
			'Error executing command',
			JSON.stringify({
				'Guild ID': interaction.guildId,
				'Command Name': interaction.commandName,
				'Command Options': commandOptions || 'None'
			}),
			error
		);

		const reply = {
			content:
				errorMessageLocalizations[interaction.locale] ??
				'There was an error while executing this command! Please try again in a few minutes. If the problem persists, please open an issue on GitHub.'
		};
		if (ephemeral) reply.flags = MessageFlags.Ephemeral;

		await interaction.editReply(reply);
	}
}

// Parse any options passed to the command
function getCommandOptions(interaction) {
	const commandOptions = interaction.options.data.map((option) => ({ name: option.name, value: option.value }));
	return commandOptions.length ? commandOptions : null;
}
