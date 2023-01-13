export interface RPC {
  type: string;
  request: Record<string, unknown>;
  response?: Record<string, unknown>;
}

export interface Ping extends RPC {
  type: 'ping';
  request: { sendTimestamp: number };
  response: { sendTimestamp: number; serverTimestamp: number };
}

export interface Subscribe extends RPC {
  type: 'subscribe';
  request: { channel: string };
  response: { subscriptionId: string };
}

export interface Unsubscribe extends RPC {
  type: 'unsubscribe';
  request: { channel: string; subscriptionId: string };
}

export interface StartLog extends RPC {
  type: 'startLog';
  request: { name: string; channels: string[] };
}

export interface JoinWebRTC extends RPC {
  type: 'joinWebRTC';
  request: { room: string };
  response: { peerId: string | any; offer: string | any };
}
