import Event from 'rx.mini';
import { MediaInfo } from '..';
import { Connection } from '../responder/connection';
export class User {
  private readonly peer = this.connection.peer;

  peerId!: string;
  candidates: RTCIceCandidate[] = [];
  onCandidate = new Event<[RTCIceCandidate]>();
  published: MediaInfo[] = [];

  constructor(private connection: Connection) {}

  join = async (peerId: string, offer: RTCSessionDescription) => {
    this.peerId = peerId;
    this.connection.peerId = peerId;

    // datachannel until is opened
    this.peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.candidates.push(candidate);
        this.onCandidate.execute(candidate);
      }
    };

    const answer = await this.connection.setOffer(offer);
    return { answer, candidates: this.candidates };
  };

  async publish(
    request: { track?: MediaStreamTrack; data?: boolean },
    offer: RTCSessionDescription | undefined
  ) {
    console.log('user publish');
    if (offer) {
      await this.peer.setRemoteDescription(offer);
    }
    if (request.track) {
      const transceiver = this.peer.getTransceivers().slice(-1)[0];
      transceiver.sender.replaceTrack(request.track);
      transceiver.direction = 'sendonly';
    }
    if (offer) await this.peer.setLocalDescription(await this.peer.createAnswer());
    return this.peer;
  }
}
