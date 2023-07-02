import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { UploadMetadata } from '@angular/fire/compat/storage/interfaces';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { fromEvent, Observable, Subject } from 'rxjs';
import { finalize, map, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { SensorEvent } from 'src/app/models/sensorEvent.model';
import * as uuid from 'uuid';

interface SensorEventStats {
  timestamp: number;
  previousTimestamp: number;
  count: number;
  values: number[];
}

@Component({
  selector: 'app-record',
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.scss'],
})
export class RecordComponent implements OnInit {
  events: SensorEvent[] = [];
  eventStats = new Map<number, SensorEventStats>();
  isRecording = false;
  recordButtonText = 'Start Recording';
  isForwardingToWebsocket = false;
  forwardButtonText = 'Start Forwarding';
  forwardToWebsocketUrl?: string = undefined;
  forwardToWebsocketChannel?: string = undefined;
  forwardSocket?: WebSocket;
  deviceMotionListener = false;
  bluetoothDevices: any = {};
  deviceMotionComplete = new Subject<void>();
  uploadPercent: Observable<number>;
  geolocationWatchId: number;
  inputName: string;
  projectId: string;
  dataSource: MatTableDataSource<any>;
  dataPath: any;
  selection = new SelectionModel<any>(true, []);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataPath = '/projects/' + this.projectId + '/record';
    this.afs
      .collection<any>(this.dataPath, (ref) => ref.orderBy('lastModified', 'desc'))
      .snapshotChanges()
      .pipe(
        map((items) => {
          return items.map((a) => {
            const data = a.payload.doc.data();
            const key = a.payload.doc.id;
            return { key: key, ...data };
          });
        })
      )
      .subscribe((data) => {
        const commonSources = [
          {
            type: 'bluetooth',
            name: 'ST Bluecoin',
            notifications: [
              {
                service: '00000000-0001-11e1-9ab4-0002a5d5c51b',
                characteristic: '00140000-0001-11e1-ac36-0002a5d5c51b',
              },
            ],
          },
          {
            type: 'devicemotion',
            name: 'Device Motion',
          },
          {
            type: 'geolocation',
            name: 'Geolocation',
          },
          {
            type: 'bluetooth',
            name: 'Nordic Thingy',
            service: 'ef680400-9b35-4933-9b10-52ffa9740042',
            characteristic: 'ef680406-9b35-4933-9b10-52ffa9740042',
          },
          {
            type: 'bluetooth',
            name: 'Trax',
            service: '00000000-0001-11e1-9ab4-0002a5d5c51b',
            characteristic: '00140000-0001-11e1-ac36-0002a5d5c51b',
          },
          {
            type: 'bluetooth',
            name: 'LPOM',
            notifications: [
              {
                service: '00000000-0001-11ea-8d71-362b9e155667',
                characteristic: '00000001-0001-11ea-8d71-362b9e155667',
              },
            ],
          },
          {
            type: 'bluetooth',
            name: 'canlogger',
            service: '097eb207-a128-49bb-a5e0-d3fe45100000',
            characteristic: '097eb207-a128-49bb-a5e0-d3fe45100001',
          },
        ];
        // check if any common source exists
        // and add if it doesn't
        commonSources.forEach((device) => {});

        this.dataSource = new MatTableDataSource(commonSources.concat(data));
      });

    this.selection.changed.subscribe((change) => {
      console.log('selection.onChange', change);
      change.added.forEach((selected) => {
        console.log(selected.name + ' selected');
        switch (selected.type.toLowerCase()) {
          case 'devicemotion':
            this.startDeviceMotion();
            break;
          case 'geolocation':
            this.startGeolocation();
            break;
          case 'bluetooth':
            this.startBluetooth(selected);
            break;
        }
      });
      change.removed.forEach((selected) => {
        console.log(selected.name + ' selected');
        switch (selected.type.toLowerCase()) {
          case 'devicemotion':
            this.stopDeviceMotion();
            break;
          case 'geolocation':
            this.stopGeolocation();
            break;
          case 'bluetooth':
            this.stopBluetooth(selected);
            break;
        }
      });
    });

    this.handleThingyRawSensorNotification = this.handleThingyRawSensorNotification.bind(this);
    this.handleBluecoinRawSensorNotification = this.handleBluecoinRawSensorNotification.bind(this);
    this.handleLpomSensorNotification = this.handleLpomSensorNotification.bind(this);
  }

  addRecordSource(name) {
    console.log('addRecordSource', name);
    this.afs.collection<any>(this.dataPath).add({ name: name, lastModified: Date.now() });
  }

  onSensorEvent(event: SensorEvent) {
    if (this.isRecording) {
      this.events.push(event);
    }
    if (!this.eventStats.has(event.id)) {
      this.eventStats.set(event.id, {
        timestamp: event.timestamp,
        previousTimestamp: undefined,
        count: 1,
        values: event.values,
      });
    } else {
      const currentStats = this.eventStats.get(event.id);
      this.eventStats.set(event.id, {
        timestamp: event.timestamp,
        previousTimestamp: currentStats.timestamp,
        count: currentStats.count + 1,
        values: event.values,
      });
    }
  }

  async getDeviceMotionPermission() {
    try {
      //@ts-ignore-next-line
      if (typeof DeviceMotionEvent.requestPermission !== 'function') {
        // We're in some motion sensor enabled device other than iOS Safari
        return true;
      }

      // This has to be triggered by a user interaction such as a 'click' or 'touchend'

      //@ts-ignore-next-line
      const permission = await DeviceMotionEvent.requestPermission();
      return permission === 'granted';
    } catch (err) {
      if (err.message === "Can't find variable: DeviceMotionEvent") {
        // We don't have devicemotionevent -- probably on desktop --  so skip
        return false;
      }

      // Try not to break existing behavior...
      return true;
    }
  }

  deviceMotionHandler(event) {
    const timestamp = Date.now();
    const accel = [
      event.accelerationIncludingGravity.x,
      event.accelerationIncludingGravity.y,
      event.accelerationIncludingGravity.z,
    ];
    const gyro = [event.rotationRate.alpha, event.rotationRate.beta, event.rotationRate.gamma];

    this.onSensorEvent({
      timestamp: timestamp,
      id: 1,
      values: accel,
    });
    this.onSensorEvent({
      timestamp: timestamp,
      id: 4,
      values: gyro,
    });
  }

  handleSocketioSensorNotification(message) {
    this.onSensorEvent({
      timestamp: message.data.serialPortTimestamp,
      id: 1,
      values: message.data.acc,
    });

    this.onSensorEvent({
      timestamp: message.data.serialPortTimestamp,
      id: 2,
      values: message.data.mag,
    });

    this.onSensorEvent({
      timestamp: message.data.serialPortTimestamp,
      id: 4,
      values: message.data.gyro,
    });
  }

  startBluetooth(deviceDoc) {
    (navigator as any).bluetooth
      // TODO enable acceptAllDevices with a user checkbox
      .requestDevice({
        acceptAllDevices: true,
        optionalServices: [deviceDoc.notifications[0].service],
      })
      // .requestDevice({
      //   filters: [
      //     { services: [deviceDoc.notifications[0].service] },
      //     { name: deviceDoc.name },
      //     { namePrefix: 'nst' },
      //   ],
      //   optionalServices: [deviceDoc.notifications[0].service],
      // })
      .then((device) => {
        this.bluetoothDevices[deviceDoc.name] = device;
        return device.gatt.connect();
      })
      .then((server) => {
        console.log('connected to ', deviceDoc.name);
        return server.getPrimaryService(deviceDoc.notifications[0].service);
      })
      .then((service) => {
        console.log('success getting service ', service);
        return service.getCharacteristic(deviceDoc.notifications[0].characteristic);
      })
      .then((characteristic) => {
        console.log('success getting characteristic ', characteristic);
        return characteristic.startNotifications();
      })
      .then((characteristic) => {
        switch (deviceDoc.name) {
          case 'ST Bluecoin':
            characteristic.addEventListener(
              'characteristicvaluechanged',
              this.handleBluecoinRawSensorNotification
            );
            break;
          case 'Nordic Thingy':
            characteristic.addEventListener(
              'characteristicvaluechanged',
              this.handleThingyRawSensorNotification
            );
            break;
          case 'Trax':
            characteristic.addEventListener(
              'characteristicvaluechanged',
              this.handleBluecoinRawSensorNotification
            );
            break;
          case 'LPOM':
            characteristic.addEventListener(
              'characteristicvaluechanged',
              this.handleLpomSensorNotification
            );
            break;
          default:
            characteristic.addEventListener('characteristicvaluechanged', (bleEvent) => {
              let parser = (input) => {
                console.log(input);
                return { id: 0, timestamp: 0, values: [] };
              };
              if (deviceDoc.notifications[0].parser) {
                try {
                  eval('parser = ' + deviceDoc.notifications[0].parser);
                } catch (e) {
                  console.log(e);
                }
              }
              console.log(
                bleEvent.target.value.buffer,
                parser,
                parser(bleEvent.target.value.buffer)
              );
              const result = parser(bleEvent.target.value.buffer);
              if (result) {
                this.onSensorEvent(result);
              }
            });
        }
        return characteristic.readValue();
      })
      .catch((error) => {
        console.log(error.message);
      });
  }

  handleThingyRawSensorNotification(bleEvent) {
    const accel = Array.from(new Int16Array(bleEvent.target.value.buffer, 0, 3));
    const gyro = Array.from(new Int16Array(bleEvent.target.value.buffer, 6, 3));
    const mag = Array.from(new Int8Array(bleEvent.target.value.buffer, 12, 3));
    const timestamp = Date.now();

    this.onSensorEvent({
      timestamp: timestamp,
      id: 3001,
      values: [accel[0], accel[1], accel[2], gyro[0], gyro[1], gyro[2], mag[0], mag[1], mag[2]],
    });
  }

  handleBluecoinRawSensorNotification(bleEvent) {
    const timestampArray = new Uint32Array(bleEvent.target.value.buffer, 0, 1).map(Number);
    const accel = Array.from(new Int16Array(bleEvent.target.value.buffer, 4, 3));
    const gyro = Array.from(new Int16Array(bleEvent.target.value.buffer, 10, 3));
    const mag = Array.from(new Int8Array(bleEvent.target.value.buffer, 16, 3));
    const sensorTimestamp = timestampArray[0];
    const timestamp = Date.now();

    // console.log(timestamp + "," + accel.toString() + "," + gyro.toString() + "," + mag.toString());
    this.onSensorEvent({
      timestamp: timestamp,
      id: 3000,
      values: [
        sensorTimestamp,
        accel[0],
        accel[1],
        accel[2],
        gyro[0],
        gyro[1],
        gyro[2],
        mag[0],
        mag[1],
        mag[2],
      ],
    });
  }

  handleLpomSensorNotification(bleEvent) {
    const timestamp = Date.now();
    const buffer = bleEvent.target.value.buffer;
    const id = new Uint8Array(buffer)[0];

    const values = [];
    switch (id) {
      case 1: {
        //Raw Mag int24 (why not int?)
        for (var i = 0; i < 3; i++) {
          const valUint8Array = new Uint8Array(buffer, 6 + 3 * i);
          const val = (valUint8Array[2] << 16) | (valUint8Array[1] << 8) | valUint8Array[0];
          const negative = val & 0x800000;
          const num = negative ? -1 * (0xffffff - val + 1) : val;
          values.push(num);
        }

        const timestampBuffer = new Uint16Array(buffer, 2, 2);
        const sensorTimestamp = ((timestampBuffer[1] << 16) | timestampBuffer[0]) >>> 0;
        values.push(sensorTimestamp);
        break;
      }
      case 15:
      case 62: {
        //Acc or Gyro int16
        const valInt16Array = new Int16Array(buffer, 6, 3);
        valInt16Array.forEach((value) => values.push(value));

        const timestampBuffer = new Uint16Array(buffer, 2, 2);
        const sensorTimestamp = ((timestampBuffer[1] << 16) | timestampBuffer[0]) >>> 0;
        values.push(sensorTimestamp);
        break;
      }
      case 111:
        {
          //Full 64 bit timestamp
          const timestampBuffer = new Uint16Array(buffer, 2, 4);
          const sensorTimestampL = ((timestampBuffer[1] << 16) | timestampBuffer[0]) >>> 0;
          values.push(sensorTimestampL);
          const sensorTimestampM = ((timestampBuffer[3] << 16) | timestampBuffer[2]) >>> 0;
          values.push(sensorTimestampM);
        }
        break;
      default:
        const valUint8Array = new Uint8Array(buffer);
        valUint8Array.forEach((value) => values.push(value));
        break;
    }

    this.onSensorEvent({
      timestamp,
      id: id + 4000,
      values,
    });
  }

  stopBluetooth(deviceDoc) {
    if (this.bluetoothDevices[deviceDoc.name]) {
      this.bluetoothDevices[deviceDoc.name].gatt.disconnect();
    }
  }

  async startDeviceMotion() {
    if (!(await this.getDeviceMotionPermission())) {
      return;
    }

    console.log('starting device motion events');
    this.events = [];
    fromEvent(window, 'devicemotion')
      .pipe(takeUntil(this.deviceMotionComplete))
      .subscribe((event) => this.deviceMotionHandler(event));
  }

  stopDeviceMotion() {
    console.log('stopping device motion');
    this.deviceMotionComplete.next();
    this.deviceMotionComplete.complete();
    this.deviceMotionListener = false;
  }

  startGeolocation() {
    const geo_options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 1000,
    };

    this.geolocationWatchId = window.navigator.geolocation.watchPosition(
      (position) => {
        console.log(position);
        this.onSensorEvent({
          timestamp: position.timestamp,
          id: 65666,
          values: [
            position.coords.latitude,
            position.coords.longitude,
            position.coords.altitude,
            position.coords.accuracy,
            position.coords.altitudeAccuracy,
            position.coords.heading,
            position.coords.speed,
          ],
        });
      },
      (e) => {
        console.log(e);
      },
      geo_options
    );
  }

  stopGeolocation() {
    window.navigator.geolocation.clearWatch(this.geolocationWatchId);
  }

  toggleRecord() {
    if (!this.isRecording) {
      this.isRecording = true;
      this.recordButtonText = 'Stop Recording';
    } else {
      this.isRecording = false;
      this.recordButtonText = 'Start Recording';

      console.log('stopping recordDeviceMotion, ', this.events.length, ' events recorded');
      this.saveEvents();
    }
  }

  toggleForwardToWebsocket() {
    if (!this.isForwardingToWebsocket) {
      if (!this.forwardToWebsocketUrl) {
        return;
      }
      this.forwardSocket = new WebSocket(this.forwardToWebsocketUrl);

      this.forwardSocket.onopen = () => {
        this.isForwardingToWebsocket = true;
        this.forwardButtonText = 'Stop Forwarding';
        console.log('forwarding data to ', this.forwardToWebsocketUrl);
      };

      this.forwardSocket.onclose = () => {
        this.isForwardingToWebsocket = false;
        this.forwardButtonText = 'Start Forwarding';
        this.forwardSocket = undefined;
      };
    } else {
      this.isForwardingToWebsocket = false;
      this.forwardSocket.close();
      this.forwardButtonText = 'Start Forwarding';

      console.log(`stopping forwarding to ${this.forwardToWebsocketUrl}`);
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.afs.doc(this.dataPath + '/' + item.key).delete();
    });
    this.selection.clear();
  }

  updateRecordSource(recordSource) {
    console.log('updating', recordSource);
    this.afs.doc(this.dataPath + '/' + recordSource.key).set(recordSource, { merge: true });
  }

  saveEvents() {
    const blob = new Blob([JSON.stringify(this.events)]);
    const fileName = 'recording.nst';
    const file = new File([blob], fileName, {
      type: 'application/vnd.nstrumenta',
    });
    console.log('uploading recording, blob.size: ', blob.size);
    const filePathUuid = uuid.v4();
    const filePath = '/projects/' + this.projectId + '/' + filePathUuid + '.nst';
    const fileRef = this.storage.ref(filePath);
    const metadata: UploadMetadata = {
      contentDisposition: 'attachment; filename=' + fileName,
    };
    const task = this.storage.upload(filePath, blob, metadata);

    // observe percentage changes
    this.uploadPercent = task.percentageChanges();
    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((downloadURL) => {
            const documentData: any = {
              lastModified: file.lastModified,
              name: file.name,
              size: file.size,
              fileType: file.type,
              filePath: filePath,
              downloadURL: downloadURL,
            };
            this.afs.collection('/projects/' + this.projectId + '/data').add(documentData);
          });
        })
      )
      .subscribe();
  }
}
