import ByteBuffer from 'bytebuffer';

export class BusMessage extends ByteBuffer {}
export enum BusMessageType {
  BUS_MESSAGE_TYPES_BEGIN = 100,
  Json,
  Buffer,
  BUS_MESSAGE_TYPES_END,
}

export type DeserializedMessage = {
  channel: string;
  busMessageType: BusMessageType;
  contents: any;
};

//TODO type contents above
// ? contents: undefined | Record<string, unknown> | Buffer;


// BusMessage
// Int32 busMessageType
// IString channel (UInt32 prefixed UTF-8 string)
// [unknown] contents (type depends on busMessageType, e.g. Json string, ArrayBuffer, etc.)

export const makeBusMessageFromJsonObject = (
  channel: string,
  object: Record<string, unknown>
): ArrayBuffer => {
  return new ByteBuffer()
    .writeUint32(BusMessageType.Json)
    .writeIString(channel)
    .writeIString(JSON.stringify(object))
    .flip()
    .toBuffer();
};

export const makeBusMessageFromBuffer = (channel: string, buffer: ArrayBufferLike): ArrayBuffer => {
  const busMessageBuffer = new ByteBuffer()
    .writeUint32(BusMessageType.Buffer)
    .writeIString(channel)
    .append(buffer)
    .flip()
    .toBuffer();

  return busMessageBuffer;
};

export const deserializeBlob: (input: Blob) => Promise<DeserializedMessage> = async (input) => {
  const arrayBuffer = await input.arrayBuffer();

  const bb = new ByteBuffer(arrayBuffer.byteLength);
  new Uint8Array(arrayBuffer).forEach((byte) => {
    bb.writeUint8(byte);
  });
  bb.flip();
  return deserializeByteBuffer(bb);
};

export const deserializeWireMessage: (input: Buffer | ArrayBuffer) => DeserializedMessage = (
  input
) => {
  if (input instanceof ArrayBuffer) {
    const bb = new ByteBuffer(input.byteLength);
    new Uint8Array(input).forEach((byte) => {
      bb.writeUint8(byte);
    });
    bb.flip();
    return deserializeByteBuffer(bb);
  } else {
    const bb = new ByteBuffer(input.byteLength);
    bb.buffer = input;
    return deserializeByteBuffer(bb);
  }
};

export const deserializeByteBuffer: (busMessage: BusMessage) => DeserializedMessage = (
  busMessage
) => {
  const busMessageType = busMessage.readInt32();
  if (
    busMessageType <= BusMessageType.BUS_MESSAGE_TYPES_BEGIN ||
    busMessageType >= BusMessageType.BUS_MESSAGE_TYPES_END
  ) {
    throw `unknown busMessageType ${busMessageType}: ${busMessage}`;
  }
  const channel = busMessage.readIString();
  let contents = undefined;
  switch (busMessageType) {
    case BusMessageType.Json:
      contents = JSON.parse(busMessage.readIString());
      break;
    case BusMessageType.Buffer:
      contents = busMessage.buffer.slice(busMessage.offset);
      break;
  }
  return { channel, busMessageType, contents };
};
