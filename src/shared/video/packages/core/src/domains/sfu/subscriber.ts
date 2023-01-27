import { ReceiverEstimatedMaxBitrate, RtcpPayloadSpecificFeedback } from 'werift';
import { RTCPeerConnection, RTCRtpTransceiver } from 'werift';
import { Media } from '../media/media';

export type SubscriberType = 'high' | 'low' | 'single' | 'auto';

export class Subscriber {
  private stopRTP: () => void = () => {};

  state: SubscriberType = 'single';

  constructor(
    readonly peer: RTCPeerConnection,
    private media: Media,
    public sender?: RTCRtpTransceiver
  ) {}

  listenSingle() {
    this.state = 'single';
    this.subscribeAV(this.state);
  }

  listenHigh() {
    this.state = 'high';
    this.subscribeAV(this.state);
  }

  listenLow() {
    this.state = 'low';
    this.subscribeAV(this.state);
  }

  listenAuto() {
    this.state = 'auto';
    this.subscribeAV('high');
    this.watchREMB();
  }

  count = 0;
  readonly threshold = 10;
  stopWatchREMB: () => void = () => {};
  private watchREMB() {
    if (!this.sender) return;
    const { unSubscribe } = this.sender.sender.onRtcp.subscribe((rtcp) => {
      if (rtcp.type === RtcpPayloadSpecificFeedback.type) {
        const psfb = rtcp as RtcpPayloadSpecificFeedback;
        if (psfb.feedback.count === ReceiverEstimatedMaxBitrate.count) {
          const remb = psfb.feedback as ReceiverEstimatedMaxBitrate;

          if (remb.bitrate / BigInt(1000) <= BigInt(200)) {
            if (this.state !== 'low' && this.count >= this.threshold) {
              console.log('low');
              this.state = 'low';
              this.stopRTP();
              this.subscribeAV(this.state);
              this.count = 0;
            }
            this.count++;
          } else {
            if (this.state !== 'high' && this.count <= -this.threshold) {
              console.log('high');
              this.state = 'high';
              this.stopRTP();
              this.subscribeAV(this.state);
              this.count = 0;
            }
            this.count--;
          }
          if (Math.abs(this.count) > this.threshold) this.count = 0;
        }
      }
    });
    this.stopWatchREMB = unSubscribe;
  }

  changeQuality(state: SubscriberType) {
    this.stopRTP();
    this.stopWatchREMB();

    this.state = state;

    if (state === 'auto') {
      this.watchREMB();
      this.state = 'high';
    }

    this.subscribeAV(this.state);
  }

  listenDataChannel() {
    const label = `__messaging:${this.media.mediaId}`;
    const sender = this.peer.sctpTransport!.channelByLabel(label);
    if (!sender) {
      this.peer.createDataChannel(label);
    }
    this.media.onMessage.subscribe((msg) => {
      const sender = this.peer.sctpTransport!.channelByLabel(label);
      if (sender) sender.send(msg);
    });
    return label;
  }

  private async subscribeAV(state: SubscriberType) {
    const sender = this.sender;
    if (!sender) throw new Error();

    console.log('on subscribe', sender.id, state);

    const track =
      state === 'single'
        ? this.media.tracks[0].track
        : this.media.tracks.find(({ track }) => track.rid!.includes(state))!.track;

    const [rtp] = await track.onReceiveRtp.asPromise();
    sender.sender.replaceRTP(rtp.header);
    console.log('replace track', sender.id, rtp.header.ssrc);

    const { unSubscribe } = track.onReceiveRtp.subscribe((rtp) => {
      sender.sender.sendRtp(rtp);
    });
    this.stopRTP = unSubscribe;
  }

  unsubscribe() {
    this.stopRTP();
    this.stopWatchREMB();
  }
}
