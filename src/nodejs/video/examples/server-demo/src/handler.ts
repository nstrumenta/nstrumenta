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

export const handlePublish = async (
  { roomManager }: Context,
  publisherId: string,
  kind: string
) => {
  const room = roomManager.room;
  const { media, peer } = room.createMedia(publisherId, { kind: kind as Kind });
  room.publish(media).then(({ peers, info }) => {
    peers.forEach((peer) => {
      console.log('send rpc to each connected peer', info);
    });
  });

  await room.connection.createOffer(publisherId);
  return { info: media.info, offer: peer.localDescription };
};
