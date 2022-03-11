import Conf from 'conf';
import Inquirer from 'inquirer';
import { Keys } from '../cli/utils';
import { getContextProperty, setContextProperty } from '../lib/context';
import { schema } from '../schema';

const cyan = (text: string) => {
  return text;
};

const green = (text: string) => {
  return text;
};

const yellow = (text: string) => {
  return text;
};

const prompt = Inquirer.createPromptModule();

const config = new Conf(schema as any);

const inquiryForAuthentication = async () => {
  const { projectId, apiKey } = await prompt([
    { type: 'input', name: 'projectId', message: 'Project ID' },
    { type: 'password', name: 'apiKey', message: 'API Key', mask: '●' },
  ]);
  return { projectId, apiKey };
};

const inquiryForSelectProject = async (choices: string[]): Promise<string> => {
  const { projectId } = await prompt([
    { type: 'list', name: 'projectId', message: 'Project ID', choices },
  ]);
  return projectId;
};

export const AddKey = async () => {
  try {
    console.log('Store API key');
    const { projectId, apiKey } = await inquiryForAuthentication();
    const keys = config.get('keys', {}) as Keys;
    config.set({ keys: { ...(keys as object), [projectId]: apiKey } });
    setContextProperty({ projectId: projectId });
  } catch (error) {
    console.log((error as Error).message);
    console.warn('Something went wrong');
  }
};

export const SetProject = async (id?: string) => {
  try {
    console.log(`Set current project in context ${config.get('current')}`);

    let projectId = id;
    const keys = config.get('keys') as Keys;
    const choices = Object.keys(keys);

    if (choices.length === 0) {
      console.log('[no projects set]');
      return;
    }
    if (projectId === undefined) {
      projectId = await inquiryForSelectProject(choices);
    }

    if (!(Object.keys(keys).length > 0) && keys[projectId]) {
      console.log('This project needs a key added');
      return;
    }

    setContextProperty({ projectId: projectId });
    console.log(`${green('>')} Project set to ${cyan(projectId)}`);
  } catch (error) {
    console.log('Something went wrong');
  }
};

export const ListProjects = async () => {
  console.log('projects \n');
  try {
    const keys = config.get('keys') as object;
    const projectId = getContextProperty('projectId');

    if (Object.keys(keys).length <= 0) {
      console.log('[no keys set]');
      return;
    }

    Object.keys(keys).forEach((value) => {
      console.log(`${value === projectId ? yellow('* ') : '  '}${value}`);
    });
  } catch (error) {
    console.log('No projects stored');
  }
};
