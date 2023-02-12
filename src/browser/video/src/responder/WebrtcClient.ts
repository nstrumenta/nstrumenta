import { Kind, MediaInfo, SubscriberType } from '..';
import { subscribe, unsubscribe } from '../actions/sfu';
import { join, publish, unPublish } from '../actions/user';
import { Events } from '../context/events';
import { SFUManager } from '../domain/sfu/manager';
import { User } from '../domain/user';
import { Connection } from './connection';

export class WebrtcClient {
  events = new Events();
  connection = new Connection(this.events);
  sfu = new SFUManager(this.events, this.connection);
  user?: User;
  medias: { [id: string]: MediaInfo } = {};
  streams: { [id: string]: { stream: MediaStream; info: MediaInfo } } = {};

  constructor() {
    this.events.onPublish.subscribe((info) => {
      this.medias[info.mediaId] = info;
    });
    this.events.onUnPublish.subscribe((info) => {
      delete this.medias[info.mediaId];
      delete this.streams[info.mediaId];
    });
    this.events.onLeave.subscribe((infos) => {
      infos.forEach((info) => {
        delete this.medias[info.mediaId];
        this.events.onUnPublish.execute(info);
      });
    });
    this.events.onTrack.subscribe((stream, info) => {
      this.streams[info.mediaId] = { info, stream };
    });
  }

  get peerId() {
    return this.user?.peerId;
  }

  async join(peerId: string, offer: RTCSessionDescription) {
    const { answer, user, candidates } = await join(this.connection)(peerId, offer);
    this.user = user;

    return { answer, candidates, user };
  }

  async publish(request: { track?: MediaStreamTrack; simulcast?: boolean; kind: Kind }) {
    return await publish(this.connection, this.user!, this.events, this.sfu)(request);
  }

  async unPublish(info: MediaInfo) {
    await unPublish(this.connection, this.user!, this.events)(info);
  }

  async subscribe(infos: MediaInfo[]) {
    await subscribe(this.connection, this.sfu)(infos);
  }

  async unsubscribe(info: MediaInfo) {
    await unsubscribe(this.connection, this.sfu)(info);
  }

  async getMedias() {
    const medias = await this.connection.getMedias();
    this.medias = medias.reduce((acc: { [mediaId: string]: MediaInfo }, cur) => {
      acc[cur.mediaId] = cur;
      return acc;
    }, {});
    return medias;
  }

  addMixedAudioTrack(mixerId: string, info: MediaInfo) {
    this.connection.addMixedAudioTrack([mixerId, info]);
  }

  removeMixedAudioTrack(mixerId: string, info: MediaInfo) {
    this.connection.removeMixedAudioTrack([mixerId, info]);
  }

  changeQuality(info: MediaInfo, type: SubscriberType) {
    this.connection.changeQuality([this.peerId!, info, type]);
  }
}
