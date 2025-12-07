// Legacy RPC types - kept for backward compatibility during migration
// TODO: Remove once all WebSocket code is eliminated

export type NstrumentaRPCType = 'ping';

export interface RPC {
  type: NstrumentaRPCType;
  request: Record<string, unknown>;
  response?: Record<string, unknown>;
}

export interface Ping extends RPC {
  type: 'ping';
  request: { sendTimestamp: number };
  response: { sendTimestamp: number; serverTimestamp: number };
}
