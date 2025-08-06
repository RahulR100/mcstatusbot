'use strict';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { embedColor } from '../functions/sendMessage.js';
import { commandTitleLocalizations, descriptionLocalizations, listLocalizations, nameLocalizations } from '../localizations/help.js';

// Command to receive help instructions

// prettier-ignore
export const data = new SlashCommandBuilder()
	.setName('help')
    .setNameLocalizations(nameLocalizations)
	.setDescription('List the other commands')
    .setDescriptionLocalizations(descriptionLocalizations);

const defaultListLocalizations = [
	{
		name: '/status [server]',
		value: 'Displays the current status and active players for any server'
	},
	{
		name: '/monitor server [nickname] [default (true/false)] [platform (java/bedrock)] [online] [offline]',
		value: 'Create 2 voice channels that display the status of a Minecraft server and optionally set a nickname, default status, platform, and online/offline indicators'
	},
	{
		name: '/nickname nickname [server]',
		value: 'Change the nickname of a monitored Minecraft server'
	},
	{
		name: '/default [server]',
		value: 'Set a server to be the default for all commands'
	},
	{
		name: '/unmonitor [server|all]',
		value: 'Unmonitor the specified server or all servers'
	},
	{
		name: '/ephemeral enabled (true/false)',
		value: 'Enable or disable ephemeral messages'
	},
	{
		name: '/indicators [server|all] [online] [offline]',
		value: 'Change the online and offline indicators for a server'
	},
	{
		name: '/bug',
		value: 'Send a bug report to the maintainers'
	}
];

function getFieldLocalizations(locale) {
	return listLocalizations[locale] ?? defaultListLocalizations;
}

export async function execute(interaction) {
	const helpEmbed = new EmbedBuilder()
		.setTitle(commandTitleLocalizations[interaction.locale] ?? 'Commands:')
		.setColor(embedColor)
		.addFields(...getFieldLocalizations(interaction.locale));

	await interaction.editReply({ embeds: [helpEmbed] });
}
