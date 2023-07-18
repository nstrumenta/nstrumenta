import { keys as idbKeys } from 'idb-keyval';
import { hash } from 'src/app/utils/hash';

export class AlgorithmWorker {
  worker: Worker;
  runPromiseResolve: Function;
  nst_project: any;
  algorithmHash: string;

  constructor(algorithmDoc: any) {
    this.worker = new Worker('assets/js/algorithmWorker.js');
    this.worker.postMessage({
      type: 'loadAlgorithm',
      payload: algorithmDoc.url,
    });
    this.algorithmHash = hash(algorithmDoc.url);
    this.worker.postMessage({
      type: 'setNstProject',
      payload: algorithmDoc.nst_project,
    });
    this.nst_project = algorithmDoc.nst_project;
  }

  init() {}

  update() {}

  run(ref): Promise<any> {
    return new Promise((resolve) => {
      this.worker.postMessage({
        type: 'setNstProject',
        payload: this.nst_project,
      });
      const outHash = hash(this.algorithmHash + this.nst_project + ref);
      idbKeys().then((keys) => {
        if (keys.includes(outHash as IDBValidKey)) {
          console.log(this.algorithmHash + ' using cache');
          resolve(outHash);
        } else {
          this.worker.postMessage({
            type: 'run',
            payload: { in: ref, out: outHash },
          });
          this.worker.addEventListener(
            'message',
            (message) => {
              switch (message.data.type) {
                case 'runComplete':
                  console.log('runComplete message from algorithmWorker', message.data);
                  resolve(message.data.payload);
                  break;
              }
            },
            { once: true }
          );
        }
      });
    });
  }
}
