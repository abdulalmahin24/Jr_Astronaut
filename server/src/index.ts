import { createCrewServer } from './createServer';

const port = Number(process.env.COOP_PORT ?? 2567);
const host = process.env.COOP_HOST ?? '0.0.0.0';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid COOP_PORT: ${process.env.COOP_PORT}`);
}

const gameServer = createCrewServer();

await gameServer.listen(port, host);
console.info(`Jr_AstroCamp private crew server listening on ${host}:${port}`);
