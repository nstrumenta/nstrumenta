import { LogConfig } from './lib';

export type NstrumentaRPCType =
  | 'ping'
  | 'subscribe'
  | 'unsubscribe'
  | 'startRecording'
  | 'stopRecording'
  | 'endRecording'
  | 'joinWebRTC'
  | 'answerWebRTC'
  | 'candidateWebRTC';
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

export interface Subscribe extends RPC {
  type: 'subscribe';
  request: { channel: string };
  response: { subscriptionId: string };
}

export interface Unsubscribe extends RPC {
  type: 'unsubscribe';
  request: { channel: string; subscriptionId: string };
}

export interface StartRecording extends RPC {
  type: 'startRecording';
  request: { name: string; channels: string[]; config?: LogConfig };
}
export interface StopRecording extends RPC {
  type: 'stopRecording';
  request: { name: string };
}

export interface JoinWebRTC extends RPC {
  type: 'joinWebRTC';
  request: { room: string };
  response: { peerId: string; offer: any };
}

export interface AnswerWebRTC extends RPC {
  type: 'answerWebRTC';
  request: { peerId: string; room: string; answer: any };
}

export interface CandidateWebRTC extends RPC {
  type: 'candidateWebRTC';
  request: { peerId: string; room: string; candidate: any };
}
