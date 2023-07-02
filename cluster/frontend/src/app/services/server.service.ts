import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Action } from '../models/action.model';

export type ServerTasks =
  | 'archiveProject'
  | 'duplicateProject'
  | 'createApiKey'
  | 'revokeApiKey'
  | 'deployHostedVM'
  | 'stopDeployedHostedVM'
  | 'deleteDeployedHostedVM'
  | 'createServiceAccount'
  | 'buildFromGithub'
  | 'buildFromFolder'
  | 'gitToken';
@Injectable({
  providedIn: 'root',
})
export class ServerService {
  uid: string;
  subscriptionsByTask: { [taskId: string]: () => void } = {};

  constructor(private authService: AuthService, private afs: AngularFirestore) {
    this.authService.user.subscribe((user) => {
      if (user) {
        this.uid = user.uid;
      } else {
        this.uid = '';
      }
    });
  }

  unsubscribe(key) {
    this.subscriptionsByTask[key]();
    delete this.subscriptionsByTask[key];
    console.log('unsubscribing. keys remaining: ', Object.keys(this.subscriptionsByTask).length);
  }

  runServerTask(
    task: ServerTasks,
    projectId: string,
    payload?: any,
    progress?: (message: string) => void
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.uid !== '') {
        console.log('setting task ' + task + ' action to pending');
        const action: Action = {
          status: 'pending',
          created: Date.now(),
          lastModified: Date.now(),
          task: task,
          uid: this.uid,
          payload: payload ? payload : {},
          version: environment.version,
        };
        return this.afs
          .collection('projects/' + projectId + '/actions')
          .add(action)
          .then((ref) => {
            return new Promise<any>(() => {
              const key = ref.path;
              console.log('watching for project action to complete ', key);
              this.subscriptionsByTask[key] = ref.onSnapshot((snapshot) => {
                const val = snapshot.data() as { status: string; task: string; payload?: Record<string, unknown> };
                console.log(val);
                switch (val.status) {
                  case 'complete':
                    this.unsubscribe(key);
                    //redact api key from action
                    if (task === 'createApiKey') {
                      const responseDeepCopy = JSON.parse(JSON.stringify(val));
                      const { payload } = val
                      payload.key = 'redacted'
                      this.afs.doc(key).update({ payload })
                      resolve(responseDeepCopy);
                    }
                    resolve(val);
                    break;
                  case 'build-error':
                    this.unsubscribe(key);
                    reject(val);
                    break;
                  case 'error':
                    this.unsubscribe(key);
                    reject(val);
                    break;
                  default:
                    if (progress) progress(key + ' ' + val.task + ' ' + val.status);
                    break;
                }
              });
            });
          })
          .catch((reason) => reject(reason));
      } else {
        return 'unable to run server task: user not logged in';
      }
    });
  }
}
