import { encode, decode } from "binary-data";
import { HandshakeType } from "../../const";
import { Handshake } from "../../../typings/domain";
import { FragmentedHandshake } from "../../../record/message/fragment";

// 7.4.5.  Server Hello Done

export class ServerHelloDone implements Handshake {
  msgType = HandshakeType.server_hello_done;
  messageSeq?: number;
  static readonly spec = {};

  static createEmpty() {
    return new ServerHelloDone();
  }

  static deSerialize(buf: Buffer) {
    return new ServerHelloDone(
      //@ts-ignore
      ...Object.values(decode(buf, ServerHelloDone.spec))
    );
  }

  serialize() {
    const res = encode(this, ServerHelloDone.spec).slice();
    return Buffer.from(res);
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
