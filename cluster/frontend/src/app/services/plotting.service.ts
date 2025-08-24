import { Injectable } from '@angular/core';
import { get as idbGet, keys as idbKeys, set as idbSet } from 'idb-keyval';
import { BehaviorSubject } from 'rxjs';
import { SensorEvent, sensorEventLabels } from 'src/app/models/sensorEvent.model';
import { hash } from 'src/app/utils/hash';

@Injectable({
  providedIn: 'root',
})
export class PlottingService {
  graph = new BehaviorSubject<any>({});
  data = [{ x: [], y: [], name: '' }];
  eventIdMap = {};

  constructor() {}

  clearData() {
    this.data = [{ x: [], y: [], name: '' }];
    this.eventIdMap = {};
    this.graph.next(this.data);
  }

  plotFromIdb(ref: string) {
    console.log('updating graph');
    idbGet(ref)
      .then((inputEvents: SensorEvent[]) => inputEvents.forEach((event) => this.addEvent(event)))
      .then(() => {
        this.graph.next(this.data);
      });
  }

  addEvent(event) {
    if (!this.eventIdMap.hasOwnProperty(event.id)) {
      this.eventIdMap[event.id] = [];
      for (let i = 0; i < event.values.length; i++) {
        this.eventIdMap[event.id].push(this.data.length);
        const newTrace = {
          name: '',
          x: [],
          y: [],
        };
        if (sensorEventLabels.hasOwnProperty(event.id)) {
          if (sensorEventLabels[event.id].traces[i] != null) {
            newTrace.name = sensorEventLabels[event.id].traces[i];
          }
        }
        this.data.push(newTrace);
      }
    }
    for (let i = 0; i < event.values.length; i++) {
      this.data[this.eventIdMap[event.id][i]].x.push(event.timestamp);
      this.data[this.eventIdMap[event.id][i]].y.push(event.values[i]);
    }
  }

  static LoadFileIntoIdb(fileDoc: any): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('loadFile ', fileDoc);
      const ref = hash(JSON.stringify(fileDoc.downloadURL));
      const output = { type: 'events', ref: ref, info: fileDoc.downloadURL };
      idbKeys().then((keys) => {
        if (keys.includes(ref as IDBValidKey)) {
          console.log(fileDoc.name + ' using cache');
          resolve(output);
        } else {
          const xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          xhr.onload = function () {
            const blob = xhr.response;
            console.log('got blob + blob.size=', blob.size);
            const reader = new FileReader();
            // Closure to capture the file information.
            reader.onload = function (e) {
              if (fileDoc.name.endsWith('.nst')) {
                idbSet(ref, JSON.parse((e.target as any).result));
              }
              if (fileDoc.name.endsWith('.ldjson')) {
                // parse line delimited json line by line
                const events: SensorEvent[] = [];
                const lines = (e.target as any).result.split('\n');
                let lastGPSTimestamp = 0;
                lines.forEach((line) => {
                  if (line) {
                    try {
                      let ldjsonEvent = JSON.parse(line);
                      let event: SensorEvent = null;
                      switch (ldjsonEvent.id) {
                        case 'trax':
                          event = new SensorEvent();
                          event.id = 3002;
                          event.timestamp = ldjsonEvent.data.serialPortTimestamp;
                          event.values = [ldjsonEvent.data.traxTimestamp]
                            .concat(ldjsonEvent.data.acc)
                            .concat(ldjsonEvent.data.gyro)
                            .concat(ldjsonEvent.data.mag);
                          break;
                        default:
                          //try parsing again for double quoted json
                          if (typeof ldjsonEvent === 'string') {
                            ldjsonEvent = JSON.parse(ldjsonEvent);
                          }
                          //determine sensorEvent id from shape if possible
                          if (ldjsonEvent['speed'] !== undefined) {
                            event = new SensorEvent();
                            event.id = 65667;
                            event.timestamp = ldjsonEvent.serverTimeMs;
                            event.values = [ldjsonEvent['speed']];
                          } else if (ldjsonEvent['latitude'] !== undefined) {
                            if (ldjsonEvent.serverTimeMs - 100 > lastGPSTimestamp) {
                              lastGPSTimestamp = ldjsonEvent.serverTimeMs;
                              event = new SensorEvent();
                              event.id = 65666;
                              event.timestamp = ldjsonEvent.serverTimeMs;
                              event.values = [ldjsonEvent['latitude'], ldjsonEvent['longitude']];
                            }
                          } else {
                            console.log('unknown id', ldjsonEvent);
                          }
                      }
                      if (event) {
                        events.push(event);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }
                });
                idbSet(ref, events);
              }
              if (fileDoc.name.endsWith('.json')) {
                const events: SensorEvent[] = [];
                const pniFile = JSON.parse((e.target as any).result);
                const pniIds = {
                  MAG_RAW: 1,
                  ACCEL_RAW: 15,
                  GYRO_RAW: 62,
                  Q_MAG_ACCEL: 77,
                  MAG_AUTOCAL: 93,
                  ACCEL_AUTOCAL: 99,
                  GYRO_AUTOCAL: 108,
                  DS_IN: 200,
                  DOM: 201,
                  Q_9AXIS: 204,
                  MAXWELL: 206,
                  MAXWELL_FIELDS: 207,
                  MAXWELL_SP: 208,
                  EOS_FRAME_DIF: 209,
                };

                if (pniFile.hasOwnProperty('data')) {
                  pniFile.data.forEach((item) => {
                    switch (item.type) {
                      case 'MAG_RAW':
                      case 'ACCEL_RAW':
                      case 'GYRO_RAW':
                      case 'Q_MAG_ACCEL':
                      case 'MAG_AUTOCAL':
                      case 'ACCEL_AUTOCAL':
                      case 'GYRO_AUTOCAL':
                      case 'DS_IN':
                      case 'Q_9AXIS':
                      case 'MAXWELL':
                      case 'MAXWELL_FIELDS':
                      case 'MAXWELL_SP':
                      case 'EOS_FRAME_DIF':
                        {
                          events.push({
                            timestamp: item.ts,
                            values: item.values,
                            id: 4000 + pniIds[item.type],
                          });
                        }
                        break;
                      case 'DOM': {
                        let values = item.coordinate;
                        values.push(item.rssi);
                        values.push(item.domInfo.stepNum);
                        values.push(item.domInfo.length);
                        values.push(item.domInfo.heading);
                        events.push({
                          timestamp: item.ts,
                          values: values,
                          id: 4000 + pniIds[item.type],
                        });
                      }
                    }
                  });
                }
                idbSet(ref, events);
              }
              if (fileDoc.name.endsWith('.log')) {
                // trax2 log (tsv)
                const events: SensorEvent[] = [];
                const lines = (e.target as any).result.split('\n');
                const headerLines = 1;
                for (let i = headerLines; i < lines.length; i++) {
                  const tsvSplit = lines[i].split('\t');
                  if (tsvSplit.length > 1) {
                    const timestamp = Number(tsvSplit[0]);
                    const values: number[] = tsvSplit.map((stringValue) => {
                      if (stringValue === 'False') return 0;
                      if (stringValue === 'True') return 1;
                      return Number(stringValue);
                    });

                    // Trax2
                    events.push({
                      timestamp: timestamp,
                      id: 1012,
                      values: values.slice(1),
                    });
                  }
                }
                idbSet(ref, events);
              }
              if (fileDoc.name.endsWith('.csv')) {
                const events: SensorEvent[] = [];
                // parse csv line by line
                const lines = (e.target as any).result.split('\n');
                const headerLines = 1;
                for (let i = headerLines; i < lines.length; i++) {
                  const csvSplit = lines[i].split(',');
                  if (csvSplit.length > 1) {
                    const timestamp = Number(csvSplit[0]);
                    const values = [];
                    for (let valueIndex = 1; valueIndex < csvSplit.length; valueIndex++) {
                      values.push(Number(csvSplit[valueIndex]));
                      if (isNaN(values[valueIndex])) {
                        values[valueIndex] = 0;
                      }
                    }
                    // Accel
                    events.push({
                      timestamp: timestamp,
                      id: 1,
                      values: values.slice(35, 38),
                    });

                    // gyro
                    events.push({
                      timestamp: timestamp,
                      id: 4,
                      values: values.slice(32, 35),
                    });

                    // synthetic mag
                    const heading = values[28] * (Math.PI / 180);
                    const mag = [Math.cos(heading), Math.sin(heading), 0];
                    events.push({
                      timestamp: timestamp,
                      id: 2,
                      values: mag,
                    });

                    // ECEF
                    events.push({
                      timestamp: timestamp,
                      id: 65668,
                      values: values.slice(13, 19),
                    });

                    // VEHICLE_DATA
                    const vehicleSpeed = values.slice(20, 21);
                    const wheelTicks = values.slice(40, 43);
                    events.push({
                      timestamp: timestamp,
                      id: 65667,
                      values: vehicleSpeed.concat(wheelTicks),
                    });
                  }
                }
                idbSet(ref, events);
              }
              resolve(output);
            };

            reader.readAsText(blob);
          };
          xhr.onerror = (ev) => {
            reject(ev);
          };
          xhr.open('GET', fileDoc.downloadURL);
          xhr.send();
        }
      });
    });
  }
}
