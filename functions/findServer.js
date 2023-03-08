const { getMonitoredServers } = require("./databaseFunctions");

module.exports = {
    async findServer(query, fields, guildId) {
        const monitoredServers = await getMonitoredServers(guildId);
        let serverIndex = -1;
        let server;

        for (const field of fields) {
            if (serverIndex != -1) {
                server = monitoredServers[serverIndex];
                break;
            }
            serverIndex = await monitoredServers.findIndex((server) => server[field] == query);
        }
        return server;
    },
    async findDefaultServer(guildId) {
        const monitoredServers = await getMonitoredServers(guildId);
        const serverIndex = await monitoredServers.findIndex((server) => server.default);
        server = serverIndex != -1 ? monitoredServers[serverIndex] : monitoredServers[0];
        return server;
    }
}