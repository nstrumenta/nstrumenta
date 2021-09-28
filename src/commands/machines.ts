import Conf from 'conf';
import axios from 'axios';
import Colors from 'colors';

const { magenta, red } = Colors;

const endpoints = process.env.LOCAL
  ? {
    GET_MACHINES: 'http://localhost:8080',
  }
  : {
    GET_MACHINES: 'https://us-central1-macro-coil-194519.cloudfunctions.net/getMachines',
  };

const config = new Conf();

export const ListMachines = async (projectId: string) => {
  try {
    const current: string = config.get('current', '') as string;
    if (!current) {
      return console.log("No project set - use 'auth set [[projectId]]' first");
    }
    console.log(`List host machines for ${magenta(current)}\n`);
    const key = config.get(`keys.${current}`, '') as string;

    const headers = {
      'x-api-key': key,
      'Content-Type': 'application/json',
    };
    const response = await axios.post(
      endpoints.GET_MACHINES,
      {},
      {
        headers,
      }
    );
    console.log(response.data);
  } catch (error) {
    console.log(red('something went wrong'));
  }
};
