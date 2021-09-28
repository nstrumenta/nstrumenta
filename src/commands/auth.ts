import Conf from 'conf';
import Inquirer from 'inquirer';
import { schema } from '../schema';
import Colors from 'colors';
import { Keys } from '../index';

const { cyan, green, yellow } = Colors;

const prompt = Inquirer.createPromptModule();

const config = new Conf(schema as any);

const inquiryForAuthentication = async () => {
  const { projectId, apiKey } = await prompt([
    { type: 'input', name: 'projectId', message: 'Project ID' },
    { type: 'password', name: 'apiKey', message: 'API Key', mask: '●' },
  ]);
  return { projectId, apiKey };
};

const inquiryForSelectProject = async (choices: string[]) => {
  const { projectId } = await prompt([
    { type: 'list', name: 'projectId', message: 'Project ID', choices },
  ]);
  return projectId;
};

export const AddKey = async () => {
  try {
    console.log('Store API key');
    const { projectId, apiKey } = await inquiryForAuthentication();
    const keys = config.get('keys', {});
    config.set({ keys: { ...(keys as object), [projectId]: apiKey } });
    config.set('current', projectId);
  } catch (error) {
    console.log((error as Error).message);
    console.warn('Something went wrong');
  }
};

export const SetProject = async (id: string) => {
  try {
    console.log('Set current project');

    let projectId: string = id;
    const keys = config.get('keys') as Keys;
    const choices = Object.keys(keys);

    if (choices.length === 0) {
      console.log('[no projects set]');
      return;
    }
    if (!id) {
      projectId = await inquiryForSelectProject(choices);
    }

    if (!(Object.keys(keys).length > 0) && keys[projectId]) {
      console.log('This project needs a key added');
      return;
    }

    config.set('current', projectId);
    console.log(`${green('>')} Project set to ${cyan(projectId)}`);
  } catch (error) {
    console.log('Something went wrong');
  }
};

export const ListProjects = async () => {
  console.log('projects \n');
  try {
    const keys = config.get('keys') as object;
    const current = config.get('current');

    if (Object.keys(keys).length <= 0) {
      console.log('[no keys set]');
      return;
    }

    Object.keys(keys).forEach((value) => {
      console.log(`${value === current ? yellow('* ') : '  '}${value}`);
    });
  } catch (error) {
    console.log('No projects stored');
  }
};
