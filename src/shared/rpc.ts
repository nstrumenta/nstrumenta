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

export interface WebrtcJoin extends RPC {
  type: 'webrtcJoin';
  request: {};
  response: { peerId: string; offer: any };
}

export interface WebrtcAnswer extends RPC {
  type: 'webrtcAnswer';
  request: { peerId: string; answer: any };
}

export interface WebrtcCandidate extends RPC {
  type: 'webrtcCandidate';
  request: { peerId: string; candidate: any };
}

export interface WebrtcPublish extends RPC {
  type: 'webrtcPublish';
  request: { peerId: string; kind: string };
  response: { info: any; offer: any };
}
