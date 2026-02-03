<div align="center">
<img src="./assets/grass.png" height="100" />

<h1>Minecraft Server Status - Discord Bot</h1>
<p>A simple Discord.js bot that displays the status of Minecraft servers.</p>

![Discord Server Count](https://img.shields.io/endpoint?url=https%3A%2F%2Fdelegate.mcstatusbot.com%2Fcount%2Ftotal%2Fformatted&style=for-the-badge)
[![Invite to Server](https://img.shields.io/static/v1?label=&message=Invite%20to%20Server&color=forestgreen&style=for-the-badge)](https://discord.com/api/oauth2/authorize?client_id=788083161296273517&permissions=269485072&scope=bot%20applications.commands)

![Docker Pulls](https://img.shields.io/docker/pulls/rar1871/mcstatusbot?style=for-the-badge)
[![Host your own](https://img.shields.io/static/v1?label=&message=Host%20Your%20Own&color=red&style=for-the-badge)](https://github.com/RahulR100/mcstatusbot/blob/main/HOSTING.md)
[![Visit our website](https://img.shields.io/static/v1?label=&message=Website&color=purple&style=for-the-badge)](https://mcstatusbot.com/)
[![Join our Discord](https://img.shields.io/static/v1?label=&message=Join%20Our%20Discord&color=blue&style=for-the-badge)](https://discord.gg/FVuSmQx5tJ)

</div>
<br/>

**To use:** Simply [invite](https://discord.com/api/oauth2/authorize?client_id=788083161296273517&permissions=269485072&scope=bot%20applications.commands) the
bot to your server, or [host your own instance](https://github.com/RahulR100/mcstatusbot/blob/main/HOSTING.md).

**Having trouble?** Check out the [FAQ](https://github.com/RahulR100/mcstatusbot/issues/154), [open an issue](https://github.com/RahulR100/mcstatusbot/issues/new), or [ask our Discord server](https://discord.gg/FVuSmQx5tJ).

**Want to contribute a translation?** Read the [contributing guide](https://github.com/RahulR100/mcstatusbot/blob/main/CONTRIBUTING.md) here.

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

## Fall 2025: Self hosted verion release!

The self-hosted version of the bot is now available for use! Read the [self host guide](https://github.com/RahulR100/mcstatusbot/blob/main/HOSTING.md) for installation and usage.

Other updates:

- Better display of error messages while getting server status
- Updated `/help` command to show options for getting support with problems
- Package and server software updates
- General bugfixes

As usual, please open an issue here if you notice any bugs/abnormal behaviour. Thank you!

## Usage notes

**Bedrock servers:** to use the `/status` and `/monitor` commands, you must set the `type` option to "Bedrock" for the bot to function correctly.

**Local IP Addresses (Cloud hosted only)** The bot filters out private IP addresses (192.168, 127.0.0, 10.0 etc) which are inaccessible to the bot. The bot will now show `Status: Error` if your server's IP address has been filtered. If you wish to monitor a private server, you may [host your own instance](https://github.com/RahulR100/mcstatusbot/blob/main/HOSTING.md) of the bot, or use a free proxy such as [Playit](https://playit.gg/) to make your server securely accessible via a domain, and then monitor that domain.

## Commands

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
- [ ] Server offline notifications in channel
- [ ] Rewrite backend api to support ipc and new federation system
- [ ] Rework monitor and nickname commands to include modal workflow
- [ ] Link Discord usernames to Minecraft accounts for player list in status command (see [this](https://github.com/dommilosz/minecraft-auth) repository)
- [ ] Add graph support (see [this](https://github.com/cappig/MC-status-bot) repository)
- [x] Docker version for self host uses
- [x] Rework status, nickname, and unmonitor commands to include dropdown menus
- [x] Allow disabling of ephemeral messages
- [x] ~~Minecraft plugin to allow monitoring of local servers~~ Use [Playit](https://playit.gg/)
- [x] Custom online / offline indicators
