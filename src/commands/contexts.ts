import {
  addContext,
  clearConfig,
  deleteContext,
  getContexts,
  getCurrentContext,
  setContext,
} from '../lib';
import { blue, red, yellow } from 'colors';
import Inquirer from 'inquirer';

const prompt = Inquirer.createPromptModule();

const inquiryForAddContext = async (): Promise<string> => {
  const { name } = await prompt([{ type: 'input', name: 'name', message: 'Context Name' }]);
  return name;
};

const inquiryForSelectContext = async (choices: string[]): Promise<string> => {
  const { context } = await prompt([
    { type: 'list', name: 'context', message: 'Context', choices },
  ]);
  return context;
};

export const AddContext = async () => {
  try {
    const name = await inquiryForAddContext();
    addContext(name);
  } catch (error) {
    console.log(red((error as Error).message));
  }
};

export const DeleteContext = async () => {
  const contexts = getContexts();
  const context = await inquiryForSelectContext(Object.keys(contexts));
  try {
    deleteContext(context);
  } catch (error) {
    console.log(red((error as Error).message));
  }
};

export const SetContext = async () => {
  const contexts = getContexts();
  const context = await inquiryForSelectContext(Object.keys(contexts));
  try {
    setContext(context);
  } catch (error) {
    console.log(red((error as Error).message));
  }
};

export const ListContexts = () => {
  try {
    const contexts = getContexts();
    const { name } = getCurrentContext();
    Object.keys(contexts).forEach((context) => {
      console.log(`${context === name ? yellow('* ') : '  '}${context}`);
    });
  } catch (err) {
    console.log(red((err as Error).message));
    console.log(red(`can't get contexts!`));
  }
};

export const GetCurrentContext = () => {
  try {
    const currentContext = getCurrentContext();
    console.log(blue(JSON.stringify(currentContext)));
  } catch (err) {
    console.log(red((err as Error).message));
    console.log(red(`can't get current context!`));
  }
};

// Danger, Juke Jukerson!! maybe don't publish this, it could lead to heartbreaks
export const ClearConfig = () => {
  console.log(red('💣 config is cleared'));
  clearConfig();
};
