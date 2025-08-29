import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, ElementRef, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Storage, ref, uploadBytesResumable, UploadMetadata } from '@angular/fire/storage';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { McapWriter } from '@mcap/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { SensorEvent } from 'src/app/models/sensorEvent.model';

interface SensorEventStats {
  timestamp: number;
  previousTimestamp: number;
  count: number;
  values: number[];
}

export interface NstrumentaVideo {
  name: string;
  filePath: string;
  startTime?: number;
  offset?: number;
  rotate?: number;
}

export interface NstrumentaExperiment {
  dataFilePath: string;
  videos?: NstrumentaVideo[];
}

@Component({
    selector: 'app-record',
    templateUrl: './record.component.html',
    styleUrls: ['./record.component.scss'],
    standalone: false
})
export class RecordComponent implements OnInit {
  @ViewChild('previewVideo', { static: false }) previewVideo: ElementRef;

  // Inject services using the new Angular 20 pattern
  private route = inject(ActivatedRoute);
  private storage = inject(Storage);
  private authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Set up effect to handle record data changes
    effect(() => {
      const records = this.firebaseDataService.record();
      const commonSources = [
          {
            type: 'devicemotion',
            name: 'Device Motion',
          },
          {
            type: 'geolocation',
            name: 'Geolocation',
          },
          {
            type: 'mouse',
            name: 'Mouse',
          },
          {
            type: 'gamepad',
            name: 'Gamepad',
          },
          {
            type: 'video',
            name: 'Video',
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
                configCommand: '30,1,15,62',
              },
            ],
          },
          {
            type: 'bluetooth',
            name: 'PEEK',
            notifications: [
              {
                service: '00000000-0001-11ea-8d71-362b9e155667',
                characteristic: '00000001-0001-11ea-8d71-362b9e155667',
                configCommand: '100,242',
              },
            ],
          },
          {
            type: 'bluetooth',
            name: 'canlogger',
            service: '097eb207-a128-49bb-a5e0-d3fe45100000',
            characteristic: '097eb207-a128-49bb-a5e0-d3fe45100001',
          },
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
        ];
        // Note: commonSources iteration intentionally has no implementation yet
        // TODO: Add logic to check if any common source exists and add if it doesn't
        // commonSources.forEach((device) => { ... });

        this.dataSource = new MatTableDataSource(commonSources.concat(records as any));
    });
  }

  eventStats = new Map<string, SensorEventStats>();
  registrations = new Map<string, { schemaId: number; channelId: number }>();
  mcapWriter: McapWriter;
  bytesWritten: bigint;
  mcapData: Uint8Array[] = [];
  isRecording = false;
  videoToggle = false;
  videoStartTime: number | undefined;
  recordingName: string | undefined;
  mediaStream: MediaStream;
  mediaRecorder: MediaRecorder;
  recordedChunks: Blob[] = [];
  recordButtonText = 'Start Recording';
  isForwardingToWebsocket = false;
  forwardButtonText = 'Start Forwarding';
  forwardToWebsocketUrl?: string = undefined;
  forwardToWebsocketChannel?: string = undefined;
  forwardSocket?: WebSocket;
  deviceMotionListener = false;
  bluetoothDevices: any = {};
  deviceMotionComplete = new Subject<void>();
  gamepadPollingInterval: NodeJS.Timeout = null;
  uploadPercent: Observable<number>;
  geolocationWatchId: number;
  inputName: string;
  projectId: string;
  dataSource: MatTableDataSource<any>;
  dataPath: any;
  selection = new SelectionModel<any>(true, []);
  bigintTime(): bigint {
    const milliseconds = new Date().getTime();
    return BigInt(milliseconds) * 1000000n;
  }
  textEncoder = new TextEncoder();

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));

  checkBrowserCapabilities() {
    console.log('=== Browser Capabilities Check ===');
    console.log('navigator.mediaDevices:', !!navigator.mediaDevices);
    console.log('getUserMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log('MediaRecorder available:', typeof MediaRecorder !== 'undefined');
    console.log('Secure context:', window.isSecureContext);
    console.log('Location:', window.location.href);
    console.log('User agent:', navigator.userAgent);
    
    // Check for specific browser issues
    if (!window.isSecureContext) {
      console.warn('⚠️ Not in secure context - this may prevent media access');
    }
    
    if (!navigator.mediaDevices) {
      console.error('❌ navigator.mediaDevices not available');
    } else if (!navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not available on mediaDevices');
    } else {
      console.log('✅ Media APIs appear to be available');
    }
    
    console.log('=== End Browser Capabilities Check ===');
  }

  ngOnInit(): void {
    // Check browser capabilities for debugging
    this.checkBrowserCapabilities();
    
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataPath = '/projects/' + this.projectId + '/record';

    // Subscribe to user auth state and set project when authenticated
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user && this.projectId) {
        this.firebaseDataService.setProject(this.projectId);
      }
    });

    this.selection.changed.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((change) => {
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
          case 'gamepad':
            this.startGamepad();
            break;
          case 'mouse':
            this.startMouse();
            break;
          case 'video':
            this.videoToggle = true;
            this.startVideo();
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
          case 'gamepad':
            this.stopGamepad();
            break;
          case 'mouse':
            this.stopMouse();
            break;
          case 'video':
            this.videoToggle = false;
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
    this.firebaseDataService.addRecord(this.projectId, { name: name, lastModified: Date.now() });
  }

  async onSensorEvent(event: SensorEvent) {
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
    if (this.isRecording) {
      const topic = `${event.id}`;
      if (!this.mcapWriter) {
        //start new writer
        this.registrations.clear();
        this.bytesWritten = 0n;
        this.mcapData = [];
        this.mcapWriter = new McapWriter({
          writable: {
            position: () => this.bytesWritten,
            write: async (buffer: Uint8Array) => {
              console.log(`writing ${buffer.byteLength} bytes`);
              this.mcapData.push(buffer);
              this.bytesWritten += BigInt(buffer.byteLength);
            },
          },
          useChunks: true,
          useStatistics: true,
        });
        await this.mcapWriter.start({
          library: 'frontend recording',
          profile: '',
        });
      }
      if (!this.registrations.has(topic)) {
        console.log(this.mcapWriter.statistics);
        const schemaId = await this.mcapWriter.registerSchema({
          name: `${event.id}`,
          encoding: 'jsonschema',
          data: this.textEncoder.encode(
            JSON.stringify({
              title: 'ACCEL_RAW',
              type: 'object',
              properties: {
                appTs: {
                  type: 'string',
                },
                id: {
                  type: 'string',
                },
                typeId: {
                  type: 'string',
                },
                ts: {
                  type: 'number',
                },
                values: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                },
              },
            })
          ),
        });
        const channelId = await this.mcapWriter.registerChannel({
          topic,
          messageEncoding: 'json',
          schemaId: schemaId,
          metadata: new Map(),
        });
        this.registrations.set(topic, { schemaId, channelId });
      }
      const { channelId } = this.registrations.get(topic);
      const bigintTime = this.bigintTime();
      await this.mcapWriter.addMessage({
        sequence: 0,
        channelId,
        logTime: bigintTime,
        publishTime: bigintTime,
        data: this.textEncoder.encode(JSON.stringify(event)),
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
      id: 'accel',
      values: accel,
    });
    this.onSensorEvent({
      timestamp: timestamp,
      id: 'gyro',
      values: gyro,
    });
  }

  handleSocketioSensorNotification(message) {
    this.onSensorEvent({
      timestamp: message.data.serialPortTimestamp,
      id: 'accel',
      values: message.data.acc,
    });

    this.onSensorEvent({
      timestamp: message.data.serialPortTimestamp,
      id: 'mag',
      values: message.data.mag,
    });

    this.onSensorEvent({
      timestamp: message.data.serialPortTimestamp,
      id: 'gyro',
      values: message.data.gyro,
    });
  }

  startBluetooth(deviceDoc) {
    navigator.bluetooth
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
      .then(async (characteristic) => {
        if (deviceDoc.notifications[0].configCommand) {
          const clearConfigCommand = new Uint8Array([0, 0]);
          console.log('writing clear config command', clearConfigCommand);
          await characteristic.writeValue(clearConfigCommand);
          const configCommand = new Uint8Array(
            deviceDoc.notifications[0].configCommand.split(',').map(Number)
          );
          console.log('writing config command', configCommand);
          await characteristic.writeValue(configCommand);
        }
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
          case 'PEEK':
          case 'LPOM': {
            characteristic.addEventListener(
              'characteristicvaluechanged',
              this.handleLpomSensorNotification
            );
            break;
          }
          default:
            characteristic.addEventListener('characteristicvaluechanged', (bleEvent) => {
              let parser = (input) => {
                console.log(input);
                return { id: (bleEvent.target as any).value.id, timestamp: 0, values: [] };
              };
              if (deviceDoc.notifications[0].parser) {
                try {
                  parser = new Function('return ' + deviceDoc.notifications[0].parser)();
                } catch (e) {
                  console.log(e);
                }
              }
              console.log(
                (bleEvent.target as any).value.buffer,
                parser,
                parser((bleEvent.target as any).value.buffer)
              );
              const result = parser((bleEvent.target as any).buffer);
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
      id: 'thingy',
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
      id: 'bluecoin',
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
    const sensorId = new Uint8Array(buffer)[0];
    const id = `lpom-${sensorId}`;
    const values = [];
    switch (sensorId) {
      case 1: {
        //Raw Mag int24 (why not int?)
        for (let i = 0; i < 3; i++) {
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
      id,
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
          id: 'geolocation',
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

  pollGamepads() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        const gamepadState = {
          id: gamepad.id,
          timestamp: gamepad.timestamp,
          axes: gamepad.axes,
          buttons: gamepad.buttons,
        };
        this.onSensorEvent({
          timestamp: gamepadState.timestamp,
          id: '/input/gamepad',
          values: [...gamepad.axes, ...gamepad.buttons.map((button) => button.value)],
        });
      }
    }
  }

  startGamepad() {
    if (!this.gamepadPollingInterval) {
      this.gamepadPollingInterval = setInterval(() => {
        this.pollGamepads();
      }, 8);
    }
  }

  stopGamepad() {
    if (this.gamepadPollingInterval) {
      clearInterval(this.gamepadPollingInterval);
      this.gamepadPollingInterval = null;
    }
  }

  handleMouseEvent(event: PointerEvent) {
    this.onSensorEvent({
      timestamp: Date.now(),
      id: '/input/mouse',
      values: [event.clientX, event.clientY, event.buttons],
    });
  }

  startMouse() {
    window.addEventListener('pointerdown', this.handleMouseEvent.bind(this));
    window.addEventListener('pointermove', this.handleMouseEvent.bind(this));
  }

  stopMouse() {
    window.removeEventListener('pointerdown', this.handleMouseEvent);
    window.removeEventListener('pointermove', this.handleMouseEvent);
  }

  async startVideo() {
    console.log('startVideo called, videoToggle:', this.videoToggle);
    
    // Check basic browser support
    if (!navigator.mediaDevices) {
      console.error('navigator.mediaDevices is not available');
      alert('Media devices API not available. This might be due to an insecure context or browser restrictions.');
      return;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia is not available on navigator.mediaDevices');
      alert('getUserMedia is not supported in this browser or context.');
      return;
    }

    if (!this.videoToggle) {
      console.log('Video toggle is false, skipping video start');
      return;
    }

    try {
      console.log('Requesting media stream...');
      console.log('Browser info:', {
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        location: window.location.href,
        protocol: window.location.protocol
      });

      // Check permissions first if available
      if ('permissions' in navigator) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('Permissions:', {
            camera: cameraPermission.state,
            microphone: micPermission.state
          });
        } catch (permError) {
          console.log('Could not check permissions:', permError);
        }
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      console.log('Media stream obtained successfully');

      // Stream video to preview in real-time
      if (this.previewVideo?.nativeElement) {
        this.previewVideo.nativeElement.srcObject = this.mediaStream;
        console.log('Video stream connected to preview element');
      } else {
        console.warn('Preview video element not available');
      }

      // Play the video automatically for preview
      if (this.previewVideo?.nativeElement) {
        try {
          await this.previewVideo.nativeElement.play();
          console.log('Video preview started successfully');
        } catch (playError) {
          console.warn('Could not auto-play video:', playError);
        }
      }

      // Only start recording if we're actually recording
      if (this.isRecording) {
        this.startVideoRecording();
      }

    } catch (error) {
      console.error('Error in startVideo:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: (error as any).code
      });

      let userMessage = 'Failed to access camera/microphone. ';
      
      switch (error.name) {
        case 'NotAllowedError':
          userMessage += 'Permission was denied. Please allow camera and microphone access in your browser settings.';
          break;
        case 'NotFoundError':
          userMessage += 'No camera or microphone found on this device.';
          break;
        case 'NotSupportedError':
          userMessage += 'Camera/microphone access is not supported.';
          break;
        case 'NotReadableError':
          userMessage += 'Camera/microphone is already in use by another application.';
          break;
        case 'OverconstrainedError':
          userMessage += 'The requested video/audio constraints cannot be satisfied.';
          break;
        default:
          userMessage += 'An unknown error occurred.';
          break;
      }
      
      alert(userMessage);
    }
  }

  startVideoRecording() {
    if (!this.mediaStream) {
      console.error('No media stream available for recording');
      return;
    }

    console.log('Starting video recording...');
    this.mediaRecorder = new MediaRecorder(this.mediaStream);
    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      if (this.videoToggle && this.recordedChunks.length > 0) {
        const recordedBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        
        if (this.recordingName) {
          console.log('Uploading video recording...');
          const projectDataPath = '/projects/' + this.projectId + '/data';
          const filePath = `${projectDataPath}/${this.recordingName}.webm`;

          const storageRef = ref(this.storage, filePath);
          await uploadBytesResumable(storageRef, recordedBlob);
          console.log('Video upload completed');
        }
      }
    };

    this.mediaRecorder.start();
    this.videoStartTime = Date.now();
    console.log('Video recording started successfully');
  }

  stopVideo() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();

      // Stop the media stream
      this.previewVideo.nativeElement.srcObject.getTracks().forEach((track) => track.stop());

      // Reset the preview video
      this.previewVideo.nativeElement.srcObject = null;
    }
  }

  async toggleRecord() {
    if (!this.isRecording) {
      this.isRecording = true;
      this.recordingName = `recording-${Date.now()}`;
      this.recordButtonText = 'Stop Recording';
      
      // Start video recording if video is enabled
      if (this.videoToggle) {
        if (!this.mediaStream) {
          // If video stream isn't already started, start it
          await this.startVideo();
        } else {
          // If stream is already running, just start recording
          this.startVideoRecording();
        }
      }
    } else {
      this.isRecording = false;
      this.recordButtonText = 'Start Recording';
      
      // Stop video recording
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      console.log('stopping recordDeviceMotion');
      await this.saveEvents();
      this.mcapWriter = undefined;
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
      this.firebaseDataService.deleteRecord(this.projectId, item.key);
    });
    this.selection.clear();
  }

  updateRecordSource(recordSource) {
    console.log('updating', recordSource);
    this.firebaseDataService.updateRecord(this.projectId, recordSource.key, recordSource);
  }

  async saveEvents() {
    if (this.mcapWriter) {
      const stats = this.mcapWriter.statistics;
      await this.mcapWriter.end();
      const blob = new Blob(this.mcapData as BlobPart[]);
      const recording = this.recordingName;
      const mcapFileName = `${recording}.mcap`;
      console.log(
        `uploading recording ${mcapFileName}\n, blob.size: `,
        stats,
        this.bytesWritten,
        blob.size
      );
      const projectDataPath = '/projects/' + this.projectId + '/data';
      const dataFilePath = `${projectDataPath}/${mcapFileName}`;
      const experimentFilepath = `${projectDataPath}/${recording}.experiment.json`;
      const metadata: UploadMetadata = {
        contentDisposition: 'attachment; filename=' + mcapFileName,
      };
      const dataFileRef = ref(this.storage, dataFilePath);
      await uploadBytesResumable(dataFileRef, blob, metadata);
      //create experiment.json
      const videos = this.videoToggle
        ? [
            {
              name: 'web',
              filePath: `${projectDataPath}/${this.recordingName}.webm`,
              startTime: this.videoStartTime,
            },
          ]
        : undefined;

      const experiment: NstrumentaExperiment = {
        dataFilePath,
        videos,
      };
      const experimentRef = ref(this.storage, experimentFilepath);
      await uploadBytesResumable(
        experimentRef,
        new Blob([JSON.stringify(experiment)], { type: 'application/json' })
      );
    }
  }
}
