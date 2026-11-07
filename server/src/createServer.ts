import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { CrewCoopRoom } from './CrewCoopRoom';

export function createCrewServer(): Server {
  const gameServer = new Server({
    transport: new WebSocketTransport(),
    express: (app) => {
      app.get('/health', (_request: object, response: { json(value: { status: string }): unknown }) => {
        response.json({ status: 'ok' });
      });
    },
  });
  gameServer.define('crew-coop', CrewCoopRoom);
  return gameServer;
}
