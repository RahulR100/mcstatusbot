# Self Hosting Guide:

A Docker image is provided for self hosting purposes. It has all the same features as the main bot on a server, but can be run anywhere, including your own laptop! The only requirement is that you have Docker, and an internet connection available.

**Note:** The Docker image is made for small server loads. Attempting to monitor > 100 servers may cause unwanted behaviour. Use of the bot in more than 10 Discord Servers is not supported. Use of docker images for commercial purposes is prohibited.

## General Requirements

The following is required to run an instance of the bot:
- A Discord bot client ID and token.
- A computer with Docker installed (>1 CPU, >2GB RAM)
- An internet connection

Hosting the bot requires basic knowledge of the operation and maintenance of Docker containers, and the management of Discord bots via the Developer Portal. If you feel uncomfortable with either of these, we recommend you use the centrally hosted version instead, using this [invite link](https://discord.com/api/oauth2/authorize?client_id=788083161296273517&permissions=269485072&scope=bot%20applications.commands).

**Note:** While you may run the bot on any computer, it is recommended to run it on a small server that is available 24x7. Running it on a laptop might require some additional considerations (see below)

## Creating the Discord Bot

We must first register a bot with Discord. Begin [here](https://discord.com/developers/applications?new_application=true)

1. Give your bot a name.
2. Copy the Client ID and Bot Token.
3. Ensure the bot has correct permissions (see below).

<img src="./assets/permissions.png"/>

## Docker compose

Use the following docker compose file to start a basic instance of the bot:

```
name: "mcstatusbot"

services:
  mongodb:
    image: mongo:latest
    volumes:
      - mcstatusbot-data:/data/db

  redis:
    image: redis:latest

  mcpingserver:
    image: rar1871/mcpingserver:latest
    depends_on:
      - redis

  mcstatusbot:
    image: rar1871/mcstatusbot:latest
    environment:
      - CLIENT_ID=<YOUR_BOT_CLIENT_ID>
      - TOKEN=<YOUR_BOT_TOKEN>
    depends_on:
      - mcpingserver
      - mongodb

volumes:
  mcstatusbot-data:
```

## Additional options:

The `mcstatusbot` service accepts the following additional options, defined as environment variables

Name | Description | Default
---|---|---
`UPDATE_SERVERS_ON_LAUNCH `| This option will force the bot to refresh server statuses for monitored servers on launch. Use carefully, as if your bot restarts often, you might hit Discord rate limits | `False`
`DATABASE_URL` | If you do not wish to use the MongoDB service included by default, you may provide a custom URL here | `mongodb://mongodb:27107`
`DATABASE_NAME` | Provide a custom database name here. This has no meaningful effect if not using a custom MongoDB instance | `mcstatusbot`

## Additional considerations:

- More RAM is better, especially as you add more servers.
- The bot needs a continuous internet connection. If using a laptop, and the laptop goes to sleep this connection might be interupted. Reconnecting to the Discord gateway will require a bot restart.
- You may use services such as Watchtower to automatically update bot images when new versions are available. This is recommended to keep up to date with latest features and bug fixes