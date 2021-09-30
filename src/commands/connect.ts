import Conf from 'conf';
import { GetMachines } from './machines';
import { WebSocket } from 'ws';

const config = new Conf();

export const ConnectCli = async (url: string) => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('connected to ', url);
  };

  ws.onmessage = (message) => {
    console.log(message.data);
  };
};

export const ConnectMachine = async (machineName: string) => {
  try {
    console.log('ConnectMachine');
    const machines = await GetMachines();

    const machine = machineName
      ? machines?.data.find((machine: any) => machineName == machine.name)
      : machines?.data[0];

    if (machine === undefined || machine.status != 'RUNNING') {
      throw 'machine needs to be in RUNNING state';
    }

    ConnectCli(machine.url);
  } catch (error) {
    console.log('Something went wrong');
  }
};
