import Conf from 'conf';
import { GetMachines } from './machines';

const config = new Conf();

export const ConnectCli = async (machineName: string) => {
  try {
    console.log('Connect cli');
    const machines = await GetMachines();

    const machine = machineName ? machines?.data.find((machine: any) => machineName == machine.name) : machines?.data[0]

    if (machine === undefined || machine.status != 'RUNNING') {
      throw 'machine needs to be in RUNNING state'
    }

    console.log(machine);

    console.log(config.get('current'));
  } catch (error) {
    console.log('Something went wrong');
  }
};
