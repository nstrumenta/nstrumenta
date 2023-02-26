import { RTCIceCandidate, RTCSessionDescription } from 'werift';
import { Kind } from '../../../../../shared/video/packages/core/src';
import { Context } from './context/context';

export const handleJoin = async ({ roomManager }: Context) => {
  return roomManager.join();
};

export const handleAnswer = async (
  { roomManager }: Context,
  peerId: string,
  answer: RTCSessionDescription
) => {
  return roomManager.answer(peerId, answer);
};

export const handleCandidate = async (
  { roomManager }: Context,
  peerId: string,
  candidate: RTCIceCandidate
) => {
  return roomManager.candidate(peerId, candidate);
};
