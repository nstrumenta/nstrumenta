import { RTCIceCandidate, RTCSessionDescription } from 'werift';
import { Room } from '../../../../../../shared/video/packages/core/src';
// import { workerThreadsWrapper, wrap } from 'airpc';
// import { Worker } from 'worker_threads';

// const workerPath = process.argv[3];
// const workerLoaderPath = process.argv[2] === 'prod' ? workerPath : process.argv[2];

export class RoomManager {
  room: Room;

  constructor() {
    // const room = wrap(
    //   Room,
    //   workerThreadsWrapper(
    //     new Worker(workerLoaderPath, {
    //       workerData: { path: workerPath },
    //     })
    //   )
    // );
    this.room = new Room();
  }

  async join() {
    return this.room.join();
  }

  async answer(peerId: string, answer: RTCSessionDescription) {
    return this.room.connection.handleAnswer(peerId, answer);
  }

  async candidate(peerId: string, candidate: RTCIceCandidate) {
    return this.room.connection.handleCandidate(peerId, candidate);
  }
}
