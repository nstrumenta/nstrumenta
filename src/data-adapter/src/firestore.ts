import { Observable } from 'rxjs';

export type OrderByDirection = 'desc' | 'asc';

export interface Query {
  orderBy?: {
    field: string;
    directionStr: OrderByDirection;
  };
}
export interface FirestoreAdapter {
  collection$<T>(path: string, query?: Query): Observable<T[]>;
  doc$<T>(path: string): Observable<T | undefined>;
  addDoc<T>(collectionPath: string, data: T): Promise<string>;
  setDoc<T>(docPath: string, data: T): Promise<void>;
  updateDoc<T>(docPath: string, data: Partial<T>): Promise<void>;
  deleteDoc(docPath: string): Promise<void>;
}
