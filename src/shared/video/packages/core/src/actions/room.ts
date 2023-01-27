import { MediaInfo } from "../domains/media/media";
import { Room } from "../domains/room";

export const leave = (room: Room) => async (peerId: string) => {
  console.log("leave", peerId);
  room.sfuManager.leave(peerId);
  const infos = room.getUserMedias(peerId).map((media) => media.info);

  await room.leave(peerId);

  return { peers: Object.values(room.peers), infos };
};

export const unPublish = (room: Room) => async (info: MediaInfo) => {
  const sfu = room.getSFU(info);
  const publisher = await room.unPublish(info);
  const subscribers = await sfu.stop();

  return { subscribers, publisher };
};
