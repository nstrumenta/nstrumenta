import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreAdapter, Query } from '../../firestore';

export class MockFirestoreAdapter implements FirestoreAdapter {
  private data = new Map<string, BehaviorSubject<any>>();

  constructor(initialData: Record<string, any> = {}) {
    for (const key in initialData) {
      this.data.set(key, new BehaviorSubject(initialData[key]));
    }
  }

  collection$<T>(path: string, q?: Query): Observable<T[]> {
    if (!this.data.has(path)) {
      this.data.set(path, new BehaviorSubject([]));
    }
    const collection$ = this.data.get(path)!.asObservable();
    if (q && q.orderBy) {
      return collection$.pipe(
        map((arr: any[]) => {
          return arr.sort((a, b) => {
            const aVal = a[q.orderBy!.field];
            const bVal = b[q.orderBy!.field];
            if (q.orderBy!.directionStr === 'asc') {
              return aVal < bVal ? -1 : 1;
            } else {
              return aVal > bVal ? -1 : 1;
            }
          });
        })
      );
    }
    return collection$;
  }

  doc$<T>(path: string): Observable<T | undefined> {
    const [collectionPath, docId] = this.splitPath(path);
    if (!this.data.has(collectionPath)) {
      this.data.set(collectionPath, new BehaviorSubject([]));
    }
    return this.data.get(collectionPath)!.pipe(
      map((collection: any[]) => collection.find((doc) => doc.id === docId))
    );
  }

  async addDoc<T>(collectionPath: string, data: T): Promise<string> {
    const docId = this.generateId();
    const doc = { ...data, id: docId };
    if (!this.data.has(collectionPath)) {
      this.data.set(collectionPath, new BehaviorSubject([]));
    }
    const collection = this.data.get(collectionPath)!.getValue();
    this.data.get(collectionPath)!.next([...collection, doc]);
    return docId;
  }

  async setDoc<T>(docPath: string, data: T): Promise<void> {
    const [collectionPath, docId] = this.splitPath(docPath);
    if (!this.data.has(collectionPath)) {
      this.data.set(collectionPath, new BehaviorSubject([]));
    }
    const collection = this.data.get(collectionPath)!.getValue();
    const docIndex = collection.findIndex((doc: any) => doc.id === docId);
    if (docIndex > -1) {
      collection[docIndex] = { ...data, id: docId };
      this.data.get(collectionPath)!.next([...collection]);
    } else {
      this.data.get(collectionPath)!.next([...collection, { ...data, id: docId }]);
    }
  }

  async updateDoc<T>(docPath: string, data: Partial<T>): Promise<void> {
    const [collectionPath, docId] = this.splitPath(docPath);
     if (!this.data.has(collectionPath)) {
      return Promise.reject('Document not found');
    }
    const collection = this.data.get(collectionPath)!.getValue();
    const docIndex = collection.findIndex((doc: any) => doc.id === docId);
    if (docIndex > -1) {
      collection[docIndex] = { ...collection[docIndex], ...data };
      this.data.get(collectionPath)!.next([...collection]);
    } else {
       return Promise.reject('Document not found');
    }
  }

  async deleteDoc(docPath: string): Promise<void> {
    const [collectionPath, docId] = this.splitPath(docPath);
    if (!this.data.has(collectionPath)) {
      return;
    }
    const collection = this.data.get(collectionPath)!.getValue();
    const newCollection = collection.filter((doc: any) => doc.id !== docId);
    this.data.get(collectionPath)!.next(newCollection);
  }

  private splitPath(path: string): [string, string] {
    const parts = path.split('/');
    const docId = parts.pop()!;
    const collectionPath = parts.join('/');
    return [collectionPath, docId];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2);
  }
}
