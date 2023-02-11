import { RTCIceCandidate, RTCSessionDescription, MediaStreamTrack } from 'werift';
import { Context } from './context/context';
import { Kind, Room } from '../../../../../shared/video/packages/core/src';
import { RoomManager } from './context/room';

export const handleCreate = async ({ roomManager }: Context) => {
  return roomManager.create();
};

export const handleJoin = async ({ roomManager }: Context, name: string) => {
  return roomManager.join(name);
};

export const handleAnswer = async (
  { roomManager }: Context,
  name: string,
  peerId: string,
  answer: RTCSessionDescription
) => {
  return roomManager.answer(name, peerId, answer);
};

export const handleCandidate = async (
  { roomManager }: Context,
  name: string,
  peerId: string,
  candidate: RTCIceCandidate
) => {
  return roomManager.candidate(name, peerId, candidate);
};

export const handlePublish = async (
  { roomManager }: Context,
  roomName: string,
  publisherId: string,
  track: MediaStreamTrack,
  simulcast: boolean,
  kind: Kind
) => {
  const room = roomManager.rooms[roomName];
  const { media, peer } = room.createMedia(publisherId, { simulcast, kind });
  return room.publish(media);
};
