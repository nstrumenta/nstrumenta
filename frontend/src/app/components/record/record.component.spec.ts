import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordComponent } from './record.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import {
  MockActivatedRoute,
  MockAuthService,
  MockFirebaseDataService,
} from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

Object.defineProperty(navigator, 'getGamepads', {
  value: () => [],
  writable: true,
  configurable: true,
});

describe('RecordComponent', () => {
  let component: RecordComponent;
  let fixture: ComponentFixture<RecordComponent>;
  let mockFirebaseDataService: MockFirebaseDataService;

  beforeEach(async () => {
    mockFirebaseDataService = new MockFirebaseDataService();
    TestBed.configureTestingModule({
      imports: [RecordComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: AuthService, useClass: MockAuthService },
        { provide: FirebaseDataService, useValue: mockFirebaseDataService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have dataSource with common sources including Mouse on initialization', () => {
    const rows = component.dataSource.data as Array<{
      name: string;
    }>;
    expect(rows.length).toBeGreaterThan(0);
    const mouseRow = rows.find((r) => r.name === 'Mouse');
    expect(mouseRow).toBeTruthy();
  });

  describe('onSensorEvent', () => {
    it('should add a new entry to eventStats for a new sensor id', async () => {
      const event = { id: '/input/mouse', timestamp: 1000, values: [10, 20, 0] };
      await component.onSensorEvent(event);

      expect(component.eventStats.has('/input/mouse')).toBe(true);
      const stats = component.eventStats.get('/input/mouse');
      expect(stats.count).toBe(1);
      expect(stats.values).toEqual([10, 20, 0]);
      expect(stats.previousTimestamp).toBeUndefined();
    });

    it('should increment count and update previousTimestamp on subsequent events', async () => {
      const event1 = { id: '/input/mouse', timestamp: 1000, values: [10, 20, 0] };
      const event2 = { id: '/input/mouse', timestamp: 2000, values: [30, 40, 1] };
      await component.onSensorEvent(event1);
      await component.onSensorEvent(event2);

      const stats = component.eventStats.get('/input/mouse');
      expect(stats.count).toBe(2);
      expect(stats.timestamp).toBe(2000);
      expect(stats.previousTimestamp).toBe(1000);
      expect(stats.values).toEqual([30, 40, 1]);
    });

    it('should track multiple sensor ids independently', async () => {
      await component.onSensorEvent({ id: '/input/mouse', timestamp: 1000, values: [1, 2, 0] });
      await component.onSensorEvent({
        id: '/sensor/accel',
        timestamp: 1001,
        values: [0.1, 9.8, 0.2],
      });

      expect(component.eventStats.size).toBe(2);
      expect(component.eventStats.get('/input/mouse').count).toBe(1);
      expect(component.eventStats.get('/sensor/accel').count).toBe(1);
    });
  });

  describe('toggleRecord', () => {
    it('should set isRecording to true and update button text when starting', async () => {
      expect(component.isRecording).toBe(false);
      expect(component.recordButtonText).toBe('Start Recording');

      await component.toggleRecord();

      expect(component.isRecording).toBe(true);
      expect(component.recordButtonText).toBe('Stop Recording');
    });

    it('should set isRecording to false and restore button text when stopping', async () => {
      await component.toggleRecord(); // start
      await component.toggleRecord(); // stop

      expect(component.isRecording).toBe(false);
      expect(component.recordButtonText).toBe('Start Recording');
    });

    it('should set recordingName when starting', async () => {
      expect(component.recordingName).toBeUndefined();
      await component.toggleRecord();
      expect(component.recordingName).toMatch(/^recording-\d+$/);
    });
  });

  describe('isAllSelected / masterToggle', () => {
    beforeEach(() => {
      component.dataSource.data = [
        { type: 'mouse', name: 'Mouse' },
        { type: 'gamepad', name: 'Gamepad' },
      ];
    });

    it('should return false when nothing is selected', () => {
      expect(component.isAllSelected()).toBe(false);
    });

    it('masterToggle should select all rows when none are selected', () => {
      component.selection.clear();
      component.masterToggle();
      expect(component.selection.selected.length).toBe(2);
    });

    it('masterToggle should clear selection when all rows are selected', () => {
      component.dataSource.data.forEach((row) => component.selection.select(row));
      expect(component.isAllSelected()).toBe(true);
      component.masterToggle();
      expect(component.selection.selected.length).toBe(0);
    });
  });
});
