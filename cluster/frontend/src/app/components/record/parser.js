buffer => {
  const accel = Array.from(new Int16Array(buffer, 0, 3));
  const gyro = Array.from(new Int16Array(buffer, 6, 3));
  const mag = Array.from(new Int8Array(buffer, 12, 3));
  const timestamp = Date.now();

  return {
    timestamp: timestamp,
    id: 3001,
    values: [
      accel[0],
      accel[1],
      accel[2],
      gyro[0],
      gyro[1],
      gyro[2],
      mag[0],
      mag[1],
      mag[2]
    ]
  };
};

buffer => {
  const temperature = Array.from(new Int16Array(buffer, 0, 1));
  const timestamp = Date.now();

  return {
    timestamp: timestamp,
    id: 1234,
    values: temperature
  };
};

buffer => {
  try {
    const pressure = new DataView(buffer).getInt32(2, true);
    console.log("success", pressure);
  } catch {
    console.log("failed", buffer);
  }
}

buffer => {
  const tick = new DataView(buffer).getUint16(0, true);
  const pressure = new DataView(buffer).getInt32(2, true);
  const humidity = Array.from(new Int16Array(buffer, 6, 2));
  const temperature = Array.from(new Int16Array(buffer, 8, 2));
  const timestamp = Date.now();

  return {
    timestamp: timestamp,
    id: 1235,
    values: [tick, pressure, humidity[0], temperature[0], temperature[1]]
  };
};
