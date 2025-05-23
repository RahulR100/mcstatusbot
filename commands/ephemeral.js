'use strict';
import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { setEphemeral } from '../functions/databaseFunctions.js';
import { sendMessage } from '../functions/sendMessage.js';
import {
	descriptionLocalizations,
	enabledDescriptionLocalizations,
	enabledOptionLocalizations,
	nameLocalizations,
	updatedLocalizations
} from '../localizations/ephemeral.js';

// prettier-ignore
export const data = new SlashCommandBuilder()
    .setName('ephemeral')
    .setNameLocalizations(nameLocalizations)
    .setDescription('Enable or disable ephemeral responses for this server')
    .setDescriptionLocalizations(descriptionLocalizations)
    .addBooleanOption((option) => option
        .setName('enabled')
        .setNameLocalizations(enabledOptionLocalizations)
        .setDescription('Enable or disable ephemeral responses')
        .setDescriptionLocalizations(enabledDescriptionLocalizations)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts([InteractionContextType.Guild]);

export async function execute(interaction) {
	const ephemeral = interaction.options.getBoolean('enabled');

	await setEphemeral(interaction.guildId, ephemeral);

	const localization = updatedLocalizations[interaction.locale];

	if (localization) {
		await sendMessage(interaction, `${localization[1]} ${ephemeral ? localization[2] : localization[3]}`);
		return;
	}

	await sendMessage(interaction, `Ephemeral responses are now ${ephemeral ? 'enabled' : 'disabled'}`);
}
