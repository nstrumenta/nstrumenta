import SerialPort from 'serialport';

export const SerialportList = async () => {
  const devices = await SerialPort.list();
  devices.forEach((device) => console.dir(device));
};
