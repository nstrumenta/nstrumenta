import { Firestore, FieldValue } from '@google-cloud/firestore';
import { Observable } from 'rxjs';
import { FirestoreAdapter, Query } from '../../../firestore';

export class FirebaseServerFirestoreAdapter implements FirestoreAdapter {
  constructor(private firestore: Firestore) {}

  collection$<T>(path: string, q?: Query): Observable<T[]> {
    return new Observable((subscriber) => {
      let collectionRef: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query = this.firestore.collection(path);
      if (q && q.orderBy) {
        collectionRef = collectionRef.orderBy(q.orderBy.field, q.orderBy.directionStr);
      }
      const unsubscribe = collectionRef.onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
          subscriber.next(data);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return () => unsubscribe();
    });
  }

  doc$<T>(path: string): Observable<T | undefined> {
    return new Observable((subscriber) => {
      const docRef = this.firestore.doc(path);
      const unsubscribe = docRef.onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const data = { id: snapshot.id, ...snapshot.data() } as T;
            subscriber.next(data);
          } else {
            subscriber.next(undefined);
          }
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return () => unsubscribe();
    });
  }

  async addDoc<T>(collectionPath: string, data: T): Promise<string> {
    const docRef = await this.firestore.collection(collectionPath).add(data);
    return docRef.id;
  }

  setDoc<T>(docPath: string, data: T): Promise<void> {
    return this.firestore.doc(docPath).set(data).then();
  }

  updateDoc<T>(docPath: string, data: Partial<T>): Promise<void> {
    return this.firestore.doc(docPath).update(data).then();
  }

  deleteDoc(docPath: string): Promise<void> {
    return this.firestore.doc(docPath).delete().then();
  }
}
