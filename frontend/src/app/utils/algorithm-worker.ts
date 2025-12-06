import { keys as idbKeys } from 'idb-keyval';
import { hash } from 'src/app/utils/hash';

interface AlgorithmDocument {
  url: string;
  nst_project: unknown;
}

type NstProject = Record<string, unknown>;

export class AlgorithmWorker {
  worker: Worker;
  runPromiseResolve: ((value: unknown) => void) | null = null;
  nst_project: NstProject;
  algorithmHash: string;

  constructor(algorithmDoc: AlgorithmDocument) {
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
    this.nst_project = algorithmDoc.nst_project as NstProject;
  }

  init(): void {
    // Worker initialization
  }

  update(): void {
    // Update method implementation would go here
  }

  run(ref: string): Promise<unknown> {
    return new Promise((resolve) => {
      this.runPromiseResolve = resolve;
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
