import { BaseRPCService } from './client';
import { MessageEvent, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { deserializeWireMessage, makeBusMessageFromJsonObject } from './busMessage';

export class RPCService implements BaseRPCService {
  private ws: WebSocket;
  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  public call<T>(method: string, params: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = randomUUID();
      const message = {
        openrpc: '1.2.6',
        method,
        params,
        id,
      };
      const listener: (event: MessageEvent) => void = (event: MessageEvent) => {
        const { channel, contents } = deserializeWireMessage(event.data as ArrayBuffer);
        if (channel === '_rpc_response' && contents.id === id) {
          this.ws.removeEventListener('message', listener);
          if (contents.error) {
            reject(contents.error);
          } else {
            resolve(contents.result);
          }
        }
      };
      this.ws.addEventListener('message', listener);
      this.ws.send(makeBusMessageFromJsonObject('_rpc', message));
    });
  }
}
