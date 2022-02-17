import { ClientStatus, NstrumentaClient } from '../../../src/lib/client';
import ws from 'ws';
import { URL } from 'url';

const nstClient = new NstrumentaClient();

setInterval(() => {
  if (nstClient.connection.status === ClientStatus.CONNECTED) {
    nstClient.send('time', { timestamp: Date.now() });
  }
}, 3000);

nstClient.addListener('open', () => {
  console.log('open');

  nstClient.addSubscription('time', (message) => {
    console.log(message);
  });
});

nstClient.connect({
  nodeWebSocket: ws as any,
  wsUrl: new URL('ws://localhost:8088'),
});
