'use strict';
import { Events } from 'discord.js';
import { deleteGuild } from '../functions/databaseFunctions.js';

// This command is executed only when the bot leaves a guild
export const name = Events.GuildDelete;
export const once = false;

export async function execute(guild) {
	await deleteGuild(guild.id);
}
