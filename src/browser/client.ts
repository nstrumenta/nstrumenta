import {
  ClientStatus,
  ConnectOptions,
  Connection,
  NstrumentaClientBase,
  WebSocketLike,
  getToken,
} from '../shared';
import { version } from '../shared/version';

/**
 * @deprecated WebSocket-based NstrumentaBrowserClient is deprecated.
 * Use McpClient for browser-based API calls.
 */
export class NstrumentaBrowserClient extends NstrumentaClientBase {
  constructor() {
    super(undefined, { name: "nstrumenta-browser", version });
    console.warn('NstrumentaBrowserClient is deprecated - WebSocket support removed. Use McpClient instead.');
  }

  public async connect(connectOptions?: ConnectOptions): Promise<Connection> {
    // DEPRECATED: WebSocket connection removed
    console.warn('NstrumentaBrowserClient.connect() is deprecated - WebSocket support removed. Use McpClient instead.');
    return Promise.reject(new Error('WebSocket support removed - use McpClient'));
  }
}
