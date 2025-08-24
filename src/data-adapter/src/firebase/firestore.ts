import {
  Firestore,
  collection,
  collectionData,
  query as fbQuery,
  orderBy,
  doc,
  docData,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FirestoreAdapter, Query } from '../../firestore';

export class FirebaseFirestoreAdapter implements FirestoreAdapter {
  constructor(private firestore: Firestore) {}

  collection$<T>(path: string, q?: Query): Observable<T[]> {
    let collRef = collection(this.firestore, path) as CollectionReference<T>;
    if (q && q.orderBy) {
      const query = fbQuery(collRef, orderBy(q.orderBy.field, q.orderBy.directionStr));
      return collectionData<T>(query, { idField: 'id' });
    } else {
      return collectionData<T>(collRef, { idField: 'id' });
    }
  }

  doc$<T>(path:string): Observable<T | undefined> {
    const docRef = doc(this.firestore, path) as DocumentReference<T>;
    return docData<T>(docRef, { idField: 'id' });
  }

  async addDoc<T>(collectionPath: string, data: T): Promise<string> {
    const collRef = collection(this.firestore, collectionPath) as CollectionReference<T>;
    const docRef = await addDoc<T>(collRef, data);
    return docRef.id;
  }

  setDoc<T>(docPath: string, data: T): Promise<void> {
    const docRef = doc(this.firestore, docPath);
    return setDoc(docRef, data);
  }

  updateDoc<T>(docPath: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, docPath);
    return updateDoc(docRef, data);
  }

  deleteDoc(docPath: string): Promise<void> {
    const docRef = doc(this.firestore, docPath);
    return deleteDoc(docRef);
  }
}
