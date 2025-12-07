import { resolveApiKey } from '../shared/client-utils';
import {
  ClientStatus,
  ConnectOptions,
  Connection,
  NstrumentaClientBase,
  StorageService,
  getToken,
} from '../shared';
import { version } from '../shared/version';

/**
 * @deprecated WebSocket-based NstrumentaClient is deprecated.
 * Use AgentClient for agent connections or McpClient for direct API calls.
 */
export class NstrumentaClient extends NstrumentaClientBase {
  constructor() {
    super(resolveApiKey(), { name: "nstrumenta-nodejs", version });
    console.warn('NstrumentaClient is deprecated - WebSocket support removed. Use AgentClient or McpClient instead.');
  }

  public async connect(connectOptions: ConnectOptions): Promise<Connection> {
    // DEPRECATED: WebSocket connection removed
    console.warn('NstrumentaClient.connect() is deprecated - WebSocket support removed. Use AgentClient or McpClient instead.');
    return Promise.reject(new Error('WebSocket support removed - use AgentClient or McpClient'));
  }
}
