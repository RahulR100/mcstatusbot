[![Invite to Server](https://img.shields.io/static/v1?label=&message=Invite%20to%20Server&color=forestgreen)](https://discord.com/api/oauth2/authorize?client_id=788083161296273517&permissions=269485072&scope=bot%20applications.commands)
![Discord Server Count](https://img.shields.io/endpoint?url=https%3A%2F%2Fmcstatusbot-delegate-production.up.railway.app%2Fcount%2FgetFormatted)
[![Visit our website](https://img.shields.io/static/v1?label=&message=Website&color=purple)](https://mcstatusbot.com/)
[![Join our Discord Server](https://img.shields.io/static/v1?label=&message=Join%20Our%20Discord%20Server&color=blue)](https://discord.gg/FVuSmQx5tJ)

# Minecraft Server Status - Discord Bot

A simple [Discord.js](https://www.npmjs.com/package/discord.js) bot that displays the status of [Minecraft](https://minecraft.gamepedia.com) servers.

**To use:** Simply [invite](https://discord.com/api/oauth2/authorize?client_id=788083161296273517&permissions=269485072&scope=bot%20applications.commands) the
bot to your server.

**Having trouble?** Check out the [FAQ](https://github.com/RahulR100/mcstatusbot/issues/154) or [open an issue](https://github.com/RahulR100/mcstatusbot/issues/new).

**Want to contribute a translation?** Read the [contributing guide](https://github.com/tedztar/mcstatusbot/blob/V0.2/CONTRIBUTING.md) here.

**Join our Discord Server!** [Here](https://discord.gg/FVuSmQx5tJ)

## Summer 2025 Update Part 1 Release

Due to the sheer size of this update I have split it into 3 parts. Parts 2 and 3 will follow in the coming weeks.
Part 1 is a more technical update, and lays the groundwork for future feature updates.

- We have a brand new server! Now with 5x the cores and 2x the RAM
- Version 2 of the proxy is now in use. This should make all commands to the bot much faster
- A new custom ping server is also implemented, moving away from older libraries.
- New DNS services are now implemented which should fix the server online -> offline -> online flicker bug
- The bot now runs using the new Docker version. This means all internal build pipelines are working well and this Docker version will be ready for yall to use soon

As usual, please open an issue here if you notice any bugs/abnormal behaviour. Thank you!

### Usage notes:

**Bedrock servers:** to use the `/status` and `/monitor` commands, you must set the `type` option to "Bedrock" for the bot to function correctly.

**Hosting/Proxy users:** Underscores are not allowed in Domain names! Please change your server address to remove underscores.

**Local IP Addresses** The bot will now filter out private IP addresses (192.168, 127.0.0, 10.0 etc) which are inaccessible to the bot. The bot will now show `Status: Error` if your server's IP address has been filtered. We recommend you use a free proxy such as [Minekube](https://connect.minekube.com/) or [Playit](https://playit.gg/) to make your server securely accessible via a domain, and then monitor that domain.

## Features

- Auto-updating voice channels to display the server's status and the number of players online
- Support for both Java and Bedrock servers
- Support for monitoring multiple Minecraft servers at once
- Check the status of non-monitored servers
- Slash command support with ephemeral responses (configurable) to prevent channels from being cluttered with commands
- Multiple languages: 🇬🇧 🇩🇪 🇩🇰 🇪🇸

<br>
<table style='border: none'>
<tr>
<td>
<img src="./assets/channels.png" height="200" />
</td>
<td>
<img src="./assets/status.png" height="200" />
</td>
</tr>
</table>

## Usage

`/status [server] [platform]` Displays the current status and active players for any server

`/monitor server [nickname] [platform] [default] [online] [offline]` Create 2 voice channels that display the status of a Minecraft server and optionally set a nickname, default status, online, and offline indicator.

`/nickname nickname [server]` Change the nickname of a monitored Minecraft server

`/default server` Set a server to be the default for all commands

`/unmonitor [server|all]` Remove the voice channels for the specified server or all servers

`/ephemeral setting` Enable or disable ephemeral messages. Note: this is a global setting for your Discord server

`/indicators server|all [online] [offline]` Customise the online/offline indicators for each/all servers

`/bug` Send a bug report to the developers

`/help` List the other commands

## Roadmap

- [ ] Add server list command (basic management interface)
- [ ] Add option to monitor server with message embed instead of voice channels
- [ ] Docker version for self host uses
- [ ] Server offline notifications in channel
- [ ] Rewrite backend api to support ipc and new federation system
- [ ] Rework monitor and nickname commands to include modal workflow
- [ ] Link Discord usernames to Minecraft accounts for player list in status command (see [this](https://github.com/dommilosz/minecraft-auth) repository)
- [ ] Add graph support (see [this](https://github.com/cappig/MC-status-bot) repository)
- [x] Rework status, nickname, and unmonitor commands to include dropdown menus
- [x] Allow disabling of ephemeral messages
- [x] ~~Minecraft plugin to allow monitoring of local servers~~ Use [Playit](https://playit.gg/)
- [x] Custom online / offline indicators
