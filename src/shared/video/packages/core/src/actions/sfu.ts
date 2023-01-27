import { Kind } from 'werift';
import { MediaInfo } from '../domains/media/media';
import { Room } from '../domains/room';
import { SubscriberType } from '../domains/sfu/subscriber';
import { MediaIdPair, RequestSubscribe } from '../typings/rpc';

export async function subscribe(requests: RequestSubscribe[], subscriberId: string, room: Room) {
  const peer = room.peers[subscriberId];

  const pairs = requests.map(({ info, type }) => {
    const { mediaId, kind } = info;

    const sfu = room.getSFU(info);
    if (kind === 'application') {
      const label = sfu.subscribeData(subscriberId, peer);
      return { mediaId, label };
    } else {
      const transceiver = peer.addTransceiver(kind as Kind, { direction: 'sendonly' });
      sfu.subscribeAV(subscriberId, peer, transceiver, type);
      return { mediaId, uuid: transceiver.id };
    }
  });

  if (requests.find((req) => req.info.kind !== 'application')) {
    await peer.setLocalDescription(await peer.createOffer());
  }

  const mediaIdPairs = pairs
    .map(({ mediaId, uuid, label }) => {
      if (uuid) {
        const transceiver = peer.getTransceivers().find((t) => t.id === uuid);
        if (!transceiver) throw new Error();
        return { mediaId, mid: transceiver.mid };
      }
      if (label) {
        return { mediaId, label };
      }
      return;
    })
    .filter((v) => v) as MediaIdPair[];

  return { peer, mediaIdPairs };
}

export const unsubscribe = (room: Room) => async (info: MediaInfo, subscriberId: string) => {
  const peer = room.peers[subscriberId];
  const sender = room.getSFU(info).unsubscribe(subscriberId);
  if (sender) {
    peer.removeTrack(sender.sender);
    await peer.setLocalDescription(await peer.createOffer());
  }
  return peer;
};

export function changeQuality(
  subscriberId: string,
  info: MediaInfo,
  type: SubscriberType,
  room: Room
) {
  const sfu = room.getSFU(info);
  sfu.changeQuality(subscriberId, type);
}
