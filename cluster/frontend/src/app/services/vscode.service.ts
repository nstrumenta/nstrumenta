import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Observable, Observer, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ProjectService } from './project.service';
import { ServerService } from './server.service';

const SERVER_URL = 'ws://localhost:8888';
const INIT_VSCODE_ON_START_KEY = 'initVscodeOnStart';

export type VscodeMessage = {
  type: string;
  config?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

@Injectable()
export class VscodeService {
  socket$: Observable<WebSocket>;
  message$: Subject<VscodeMessage>;
  messageObserver: Observer<VscodeMessage>;
  private socket: WebSocket;
  projectId: string;
  uid: string;
  buildCount = 0;

  constructor(
    private projectService: ProjectService,
    private serverService: ServerService,
    private storage: Storage
  ) {
    if (localStorage.getItem(INIT_VSCODE_ON_START_KEY) === 'true') {
      this.init();
    }
  }

  public init() {
    console.log('Starting vscode.service');

    this.socket = new WebSocket(SERVER_URL);
    this.socket$ = new Observable((observer) => {
      observer.next(this.socket);
    });
    this.message$ = new Subject<VscodeMessage>();

    this.socket.onopen = () => {
      localStorage.setItem(INIT_VSCODE_ON_START_KEY, 'true');
    };

    this.socket.onmessage = (ev) => {
      const message = JSON.parse(ev.data);
      this.message$.next(message);
      console.log(message);
      if (message.type) {
        switch (message.type) {
          case 'update': {
            if (message.config && message.config.modules) {
              // upload files and send path to server
              const promises = [];
              const uid = this.projectService.user.uid;
              const uploadPath =
                'projects/' + this.projectService.currentProjectId + '/live-session/' + uid;
              const self = this;
              let nst_project = {};
              message.payload.forEach((fileTextItem) => {
                // remove leading slash if present
                let filename = fileTextItem.path;
                if (filename.startsWith('/')) {
                  filename = filename.substring(1);
                }

                promises.push(
                  new Promise(function (resolve) {
                    const filePath = uploadPath + '/' + filename;
                    console.log('uploading ', filePath);
                    const metadata: any = {
                      contentDisposition: 'inline',
                    };
                    if (filePath.endsWith('.html')) {
                      metadata.contentType = 'text/html';
                    }
                    if (filePath.endsWith('.js')) {
                      metadata.contentType = 'application/javascript';
                    }
                    if (filePath.endsWith('.json')) {
                      metadata.contentType = 'application/json';
                    }
                    if (filePath.endsWith('.css')) {
                      metadata.contentType = 'text/css';
                    }
                    if (filePath.endsWith('.png')) {
                      metadata.contentType = 'image/png';
                    }
                    if (filePath.endsWith('.jpeg')) {
                      metadata.contentType = 'image/jpeg';
                    }
                    if (filePath.endsWith('nst_project.json')) {
                      nst_project = JSON.parse(fileTextItem.text);
                    }

                    const storageRef = ref(self.storage, filePath);
                    const uploadTask = uploadBytesResumable(
                      storageRef,
                      new Blob([fileTextItem.text]),
                      metadata
                    );

                    uploadTask.on('state_changed', 
                      null, // progress callback
                      null, // error callback
                      () => { // complete callback
                        resolve({
                          storagePath: filePath,
                          path: filename,
                        });
                      }
                    );
                  })
                );
              });
              Promise.all(promises).then((uploads) => {
                console.log('Uploaded ' + uploads.length + ' files');
                console.log(uploads);
                this.serverService
                  .runServerTask(
                    'buildFromFolder',
                    this.projectService.currentProjectId,
                    {
                      storageFiles: uploads,
                      projectId: this.projectService.currentProjectId,
                    },
                    (progressMessage) => {
                      console.log(progressMessage);
                    }
                  )
                  .then(() => {
                    this.send({ type: 'build-success' });
                    this.message$.next({ type: 'updateComplete' });
                  })
                  .catch((err) => {
                    const buildErrorMessage = {
                      type: 'build-error',
                      payload: {
                        errorMessages: err.error,
                        nstModuleFolder: err.nstModuleFolder,
                      },
                    };
                    this.send(buildErrorMessage);
                    console.log('buildFromFolder error', err);
                  });
              });
            } else {
              console.log('missing config in update');
            }
            break;
          }
          case 'ping':
            {
              console.log(
                message.type +
                  ': ' +
                  (1e-3 * (Date.now() - message.payload.timestamp)).toFixed(3) +
                  's'
              );
            }
            break;
          default:
            console.log('unknown nstrumenta-vscode message type:', message.type);
            break;
        }
      }
    };

    const socket = this.socket;
    this.socket.onerror = function () {
      // handle server error here
      console.log('nstrumenta-vscode extension not detected');
      localStorage.removeItem(INIT_VSCODE_ON_START_KEY);
      socket.close();
    };
  }

  public send(message: VscodeMessage): void {
    if (this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
}
