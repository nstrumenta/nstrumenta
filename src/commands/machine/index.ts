import Conf from 'conf';
import axios from 'axios';
import Inquirer from 'inquirer';
import Colors from 'colors';
// import { schema } from '../../schema.js';
// import { Keys } from '../../index';

const { cyan, green, yellow, magenta } = Colors;

const prompt = Inquirer.createPromptModule();

const endpoints = {
  // TODO: figure why the newly deployed getMachines endpoint doesn't permit
  GET_MACHINES: 'https://us-central1-nstrumenta-dev.cloudfunctions.net/getMachines',
};

const config = new Conf();

export const list = async (projectId: string) => {
  try {
    // TODO: move this getting of api key to a command hook
    const current: string = config.get('current', '') as string;
    if (!current) {
      return console.log("No project set - use 'auth set [[projectId]]' first");
    }
    console.log(`List host machines for ${magenta(current)}\n`);
    const key = config.get(`keys.${current}`, '') as string;

    console.log(`api key: ${green(key)}`);
    const response = await axios.get(endpoints.GET_MACHINES, {
      data: { key },
      headers: {
        'x-api-key': key,
      },
    });
    console.log(response);
  } catch (error) {
    console.log('Something went wrong', error);
  }
};
