// Must be lowercase and not contain any spaces
export const nameLocalizations = {
	da: 'hjælp',
	de: 'hilfe',
	'es-ES': 'ayuda'
};

export const descriptionLocalizations = {
	da: 'Viser en liste over alle kommandoer',
	de: 'Liste die anderen Befehle auf',
	'es-ES': 'Muestra una lista de todos los comandos'
};

export const commandTitleLocalizations = {
	da: 'Kommandoer:',
	de: 'Befehle:',
	'es-ES': 'Comandos:'
};

export const listLocalizations = {
	da: [
		{
			name: '/status [server|ip]',
			value: 'Viser den aktuelle status og aktive spillere for hver server'
		},
		{
			name: '/overvåge ip [nickname] [standard]',
			value: 'Opretter 2 talekanaler, der viser status for en Minecraft-server og valgfrit angiver et kaldenavn'
		},
		{
			name: '/kaldenavn kaldenavn [server]',
			value: 'Ændrer kaldenavnet for en overvåget Minecraft-server'
		},
		{
			name: '/standard [server]',
			value: 'Angiver en server, der skal bruges som standard for alle kommandoer'
		},
		{
			name: '/unmonitor [server|all]',
			value: 'Holder op med at overvåge den angivne server eller alle servere'
		},
		{
			name: '/fejl',
			value: 'Send en fejlrapport til udviklerne'
		}
	],
	de: [
		{
			name: '/status [server|ip]',
			value: 'Zeigt den aktuellen Status und die aktiven Spieler für jeden Server an'
		},
		{
			name: '/überwachen ip [spitzname] [standard]',
			value: 'Erstellt 2 Sprachkanäle, die den Status eines Minecraft-Servers anzeigen und optional einen Spitznamen setzen'
		},
		{
			name: '/spitzname spitzname [server]',
			value: 'Ändert den Spitznamen eines überw achten Minecraft-Servers'
		},
		{
			name: '/standard [server]',
			value: 'Legt einen Server fest, der für alle Befehle standardmäßig verwendet wird'
		},
		{
			name: '/unmonitor [server|all]',
			value: 'Überwacht den angegebenen Server oder alle Server nicht mehr'
		},
		{
			name: '/fehler',
			value: 'Senden Sie einen Fehlerbericht an die Betreuer'
		}
	],
	'es-ES': [
		{
			name: '/status [server|ip]',
			value: 'Muestra el estado actual y los jugadores activos de cada servidor'
		},
		{
			name: '/monitorizar ip [alias] [predeterminado]',
			value: 'Crea 2 canales de voz que muestran el estado de un servidor de Minecraft y opcionalmente establece un alias'
		},
		{
			name: '/alias alias [server]',
			value: 'Cambia el alias de un servidor de Minecraft monitorizado'
		},
		{
			name: '/predeterminado [server]',
			value: 'Establece un servidor para usar como predeterminado para todos los comandos'
		},
		{
			name: '/desmonitorizar [server|all]',
			value: 'Deja de monitorear el servidor especificado o todos los servidores'
		},
		{
			name: '/error',
			value: 'Envía un informe de error a los desarrolladores'
		}
	]
};
