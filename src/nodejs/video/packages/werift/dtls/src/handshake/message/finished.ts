import { Handshake } from "../../typings/domain";
import { HandshakeType } from "../const";
import { FragmentedHandshake } from "../../record/message/fragment";

// 7.4.9.  Finished

export class Finished implements Handshake {
  msgType = HandshakeType.finished;
  messageSeq?: number;

  constructor(public verifyData: Buffer) {}

  static createEmpty() {
    return new Finished(undefined as any);
  }

  static deSerialize(buf: Buffer) {
    return new Finished(buf);
  }

  serialize() {
    return this.verifyData;
  }

  toFragment() {
    const body = this.serialize();
    return new FragmentedHandshake(
      this.msgType,
      body.length,
      this.messageSeq!,
      0,
      body.length,
      body
    );
  }
}
