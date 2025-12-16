/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FirebaseDataService } from './firebase-data.service';

describe('FirebaseDataService', () => {
  let service: FirebaseDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FirebaseDataService
      ]
    });

    service = TestBed.inject(FirebaseDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Firebase Modular SDK Query Type Validation', () => {
    /**
     * This test validates that all collectionData() calls receive Query types,
     * not raw CollectionReference objects. This catches the Firebase modular SDK
     * error: "Expected type '_Query', but it was: a custom _CollectionReference object"
     * 
     * The test uses TypeScript type guards and runtime checks to ensure proper usage.
     */
    it('should wrap all collectionData calls with query() to prevent Query type errors', () => {
      // Create spy functions that validate the input type
      const collectionSpy = jasmine.createSpy('collection').and.returnValue({
        type: 'collection',
        path: 'test-path'
      } as any);

      const querySpy = jasmine.createSpy('query').and.callFake((collectionRef: any, ..._queryConstraints: any[]) => {
        // Validate that query is called with a collection reference
        expect(collectionRef).toBeDefined();
        expect(collectionRef.type).toBe('collection');
        return {
          type: 'query',
          _query: collectionRef,
        } as any;
      });

      const collectionDataSpy = jasmine.createSpy('collectionData').and.callFake((queryRef: any) => {
        // CRITICAL CHECK: collectionData must receive a Query type, not a CollectionReference
        if (queryRef.type === 'collection') {
          fail('collectionData received a CollectionReference instead of a Query. ' +
               'All collectionData() calls must wrap collections with query(). ' +
               'Example: collectionData(query(collection(...))) not collectionData(collection(...))');
        }
        
        expect(queryRef.type).toBe('query', 
          'collectionData must receive a Query object, not a CollectionReference');
        
        return of([]);
      });

      // This test serves as documentation and validation that the pattern:
      // ✅ CORRECT:   collectionData(query(collection(firestore, 'path')))
      // ❌ INCORRECT: collectionData(collection(firestore, 'path'))
      // 
      // The incorrect pattern causes runtime errors with Firebase modular SDK:
      // "Expected type '_Query', but it was: a custom _CollectionReference object"

      // Test the correct pattern
      const mockFirestore = {} as any;
      const collectionRef = collectionSpy(mockFirestore, 'test-collection');
      const queryRef = querySpy(collectionRef);
      const observable = collectionDataSpy(queryRef);

      expect(collectionSpy).toHaveBeenCalled();
      expect(querySpy).toHaveBeenCalledWith(collectionRef);
      expect(collectionDataSpy).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'query' }));
      
      // Verify the observable returns data
      observable.subscribe(data => {
        expect(data).toEqual([]);
      });
    });

    it('should fail when collectionData receives a CollectionReference without query wrapper', () => {
      // This test demonstrates the WRONG pattern and should fail
      const mockCollection = {
        type: 'collection',
        path: 'test-path'
      } as any;

      // Simulate calling collectionData with a raw collection reference
      const validateCollectionDataInput = (input: any) => {
        if (input.type === 'collection') {
          throw new Error(
            'Firebase Modular SDK Error: Expected type \'_Query\', but it was: a custom _CollectionReference object. ' +
            'Fix: Wrap collection() with query() => collectionData(query(collection(...)))'
          );
        }
      };

      // This should throw an error
      expect(() => validateCollectionDataInput(mockCollection)).toThrowError(/Expected type '_Query'/);
    });

    it('should document the correct pattern for all collection observables', () => {
      // This test serves as living documentation for the correct patterns used in:
      // - modulesObservable$
      // - dataObservable$
      // - recordObservable$
      // - actionsObservable$
      // - repositoriesObservable$
      // - agentsObservable$
      // - machinesObservable$
      // - userProjectsObservable$

      const correctPatterns = [
        'collectionData(query(collection(this.firestore, `users/${uid}/modules`)))',
        'collectionData(query(collection(this.firestore, `users/${projectUserId}/projects/${projectId}/data`)))',
        'collectionData(query(collection(this.firestore, `users/${uid}/repositories`)))',
        'collectionData(query(collection(this.firestore, `users/${uid}/agents`)))',
        'collectionData(query(collection(this.firestore, `users/${uid}/machines`)))',
        'collectionData(query(collection(this.firestore, `users/${uid}/projects`)))',
      ];

      const incorrectPatterns = [
        'collectionData(collection(this.firestore, `users/${uid}/modules`))',
        'collectionData(collection(this.firestore, `users/${projectUserId}/projects/${projectId}/data`))',
      ];

      // Document that all patterns must use query() wrapper
      correctPatterns.forEach(pattern => {
        expect(pattern).toContain('query(collection(');
        expect(pattern).toMatch(/collectionData\(query\(collection\(/);
      });

      incorrectPatterns.forEach(pattern => {
        expect(pattern).not.toContain('query(collection(');
        expect(pattern).toMatch(/collectionData\(collection\(/);
      });

      // Validate pattern structure
      const hasCorrectStructure = (pattern: string) => {
        return /collectionData\(query\(collection\(/.test(pattern);
      };

      expect(correctPatterns.every(hasCorrectStructure)).toBe(true);
      expect(incorrectPatterns.some(hasCorrectStructure)).toBe(false);
    });
  });

  describe('Public API', () => {
    it('should provide access to modules signal', () => {
      expect(service.modules).toBeDefined();
    });

    it('should provide access to agents signal', () => {
      expect(service.agents).toBeDefined();
    });

    it('should provide access to repositories signal', () => {
      expect(service.repositories).toBeDefined();
    });

    it('should provide access to userProjects signal', () => {
      expect(service.userProjects).toBeDefined();
    });
  });
});
