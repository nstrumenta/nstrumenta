export class Action {
  key?: string;  // Firebase document key
  id?: string;   // Firebase document id
  status: 'pending' | 'started' | 'complete' | 'error';
  created: number;
  lastModified?: number;
  completed?: number;
  task: string;
  uid: string;
  data?: unknown;
  payload?: unknown;
  version: string;
}
