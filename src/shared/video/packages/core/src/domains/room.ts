import { v4 } from 'uuid';
import { Kind, useAbsSendTime, useSdesMid, useSdesRTPStreamId } from 'werift';
import { Connection } from '../responders/connection';
import { Media, MediaInfo } from './media/media';
import { PeerConnection } from './peer';
import { SFUManager } from './sfu/manager';
import { SFU } from './sfu/sfu';

export class Room {
  readonly connection = new Connection(this);
  readonly sfuManager = new SFUManager();
  peers: { [peerId: string]: PeerConnection } = {};
  medias: { [mediaId: string]: Media } = {};

  async join() {
    const peerId = 'p_' + v4();
    const peer = new PeerConnection({
      headerExtensions: {
        video: [useSdesMid(), useAbsSendTime(), useSdesRTPStreamId()],
        audio: [useSdesMid(), useAbsSendTime()],
      },
    });
    this.peers[peerId] = peer;

    const channel = peer.createDataChannel('__sfu');
    this.connection.listen(channel, peer, peerId);

    await peer.setLocalDescription(await peer.createOffer());
    return { peerId, offer: peer.localDescription };
  }

  getUserMedias(peerId: string) {
    const medias = Object.values(this.medias).filter((media) => media.publisherId === peerId);
    return medias;
  }

  async leave(peerId: string) {
    delete this.peers[peerId];

    const medias = this.getUserMedias(peerId);
    await Promise.all(
      medias.map((media) => {
        const sfu = this.getSFU(media);
        return sfu.stop();
      })
    );

    medias.forEach((media) => {
      delete this.medias[media.mediaId];
    });
  }

  createMedia(publisherId: string, { kind }: CreateMediaRequest) {
    console.log('publish', publisherId, { kind });
    const peer = this.peers[publisherId];

    const media = new Media(kind, publisherId);
    this.medias[media.mediaId] = media;

    const transceiver = peer.addTransceiver(kind, { direction: 'recvonly' });
    media.initAV(transceiver);

    return { media, peer };
  }

  async publish(media: Media) {
    if (media.transceiver) {
      const [track] = await media.transceiver.onTrack.asPromise();
      media.addTrack(track);
    }

    const peers = Object.values(this.peers);

    return { peers, info: media.info };
  }

  async unPublish(info: MediaInfo) {
    const media = this.medias[info.mediaId];
    delete this.medias[info.mediaId];

    const peer = this.peers[info.publisherId];
    if (media.tracks.length > 0) {
      // remove sender
    }
    await peer.setLocalDescription(await peer.createOffer());

    return peer;
  }

  getMedias(peerId: string) {
    const peer = this.peers[peerId];
    const infos = Object.values(this.medias).map((media) => media.info);
    return { peer, infos };
  }

  getSFU(info: MediaInfo): SFU {
    if (this.sfuManager.getSFU(info.mediaId)) return this.sfuManager.getSFU(info.mediaId);

    const media = this.medias[info.mediaId];
    if (!media) {
      throw new Error();
    }
    return this.sfuManager.createSFU(media);
  }
}

export type CreateMediaRequest = { kind: Kind };
