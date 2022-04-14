import Inquirer from 'inquirer';
import {
  addContext,
  clearConfig,
  deleteContext,
  getContexts,
  getCurrentContext,
  setContext,
  setContextProperty,
} from '../../shared/lib/context';
import { schema } from '../../shared/schema';

const red = (text: string) => {
  return text;
};

const yellow = (text: string) => {
  return text;
};

const prompt = Inquirer.createPromptModule();

export const AddContext = async () => {
  try {
    const { name } = await prompt([{ type: 'input', name: 'name', message: 'Context Name' }]);
    addContext(name);
  } catch (error) {
    console.log(red((error as Error).message));
  }
};

export const DeleteContext = async () => {
  const contexts = getContexts();
  const result = await prompt([
    { type: 'list', name: 'context', message: 'Context', choices: Object.keys(contexts) },
  ]);
  const context = result.context;
  try {
    deleteContext(context);
  } catch (error) {
    console.log(red((error as Error).message));
  }
};

export const SetContext = async () => {
  const contexts = getContexts();
  const { context } = await prompt([
    { type: 'list', name: 'context', message: 'Context', choices: Object.keys(contexts) },
  ]);
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
    console.log(currentContext);
  } catch (err) {
    console.log(red((err as Error).message));
    console.log(red(`can't get current context!`));
  }
};

export const SetContextProperty = async (name: string, { value }: { value?: string }) => {
  let property = name;
  let newValue = value;

  const availableProperties = Object.keys(schema.contexts.properties);

  if (!name) {
    const response = await prompt([
      {
        type: 'list',
        name: 'property',
        message: 'property',
        choices: availableProperties,
      },
    ]);
    property = response.property;
  }

  if (!availableProperties.includes(property)) {
    console.log(red('no'));
    return;
  }

  if (!newValue) {
    const result = await prompt([{ type: 'input', name: 'value', message: `Set ${property} to:` }]);
    newValue = result.value;
  }

  console.log({ newValue, property });
  setContextProperty({ [property]: newValue });
};

// Make sure this is used in development only, not for public consumption
export const ClearConfig = () => {
  console.log(red('💣 config is cleared'));
  clearConfig();
};
