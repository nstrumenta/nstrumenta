export class Action {
  status: 'pending' | 'complete' | 'error';
  created: number;
  lastModified?: number;
  completed?: number;
  task: string;
  uid: string;
  data?: unknown;
  payload?: unknown;
  version: string;
}
