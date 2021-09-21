import Conf from 'conf';
import axios from 'axios';
import Inquirer from 'inquirer';
import Colors from 'colors';
// import { schema } from '../../schema.js';
// import { Keys } from '../../index';

const { cyan, green, yellow, magenta, red } = Colors;

const prompt = Inquirer.createPromptModule();

const endpoints = process.env.LOCAL
  ? {
      GET_MACHINES: 'http://localhost:8080',
    }
  : {
      GET_MACHINES: 'https://us-central1-nstrumenta-dev.cloudfunctions.net/getMachines',
    };

const config = new Conf();

export const list = async (projectId: string) => {
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
