import Conf from 'conf';
import { schema } from './schema';
import { SetProject } from './commands/auth';
import { green } from 'colors';

const config = new Conf(schema as any);

// Without fancy typescripting, we need to be sure that these are synced with the Conf schema
export interface Context {
  name: string;
  projectId: string;
  wsHost: string;
  channel: string;
}

export type Contexts = Record<string, Context>;

export const defaultContext = {
  name: 'default',
  projectId: '',
  wsHost: '',
};

export const initContexts = () => {
  // console.log(`init contexts, check if ${defaultContext.name} exists`);
  const contexts = getContexts();
  // Just make sure we have a default context
  const context = contexts[defaultContext.name];
  if (!context) {
    console.log('set default context — first run? or maybe config was cleared?');
    config.set({ contexts: { ...contexts, [defaultContext.name]: defaultContext } });
  }

  const current = config.get('current') as string;
  if (!current || !contexts[current]) {
    console.log(`current not set, so set to ${defaultContext.name}`);
    config.set('current', defaultContext.name);
  }
};

export const setContextProperty = (property: Partial<Context>) => {
  console.log('set: ', property);
  const contexts = getContexts();
  const current = config.get('current') as string;
  const currentContext = getCurrentContext();
  const newContexts = {
    contexts: {
      ...(contexts as object),
      [current]: { ...currentContext, ...property },
    },
  };
  config.set(newContexts);
};

export const getContextProperty = (property: keyof Context) => {
  const contexts: Contexts = config.get('contexts', {}) as Contexts;
  const current = config.get('current') as string;
  const currentContext = contexts[current];
  return currentContext[property];
};

export const getContexts = (): Contexts => {
  return config.get('contexts', {}) as Contexts;
};

export const getCurrentContext = (): Context => {
  const current = config.get('current') as string;
  const contexts = getContexts();
  return contexts[current];
};

export const setContext = (name: string) => {
  config.set({ current: name });
  const context = getCurrentContext();
  console.log(green(JSON.stringify(context)));
};

export const addContext = (name: string) => {
  const contexts = getContexts();
  if (contexts[name]) {
    throw new Error(`Can't add context — ${name} exists!`);
  }

  const newContexts = {
    contexts: {
      ...(contexts as object),
      [name]: { name, projectId: '', wsHost: '' },
    },
  };
  config.set(newContexts);
  config.set({ current: name });
  SetProject();
};

export const deleteContext = (name: string) => {
  const contexts = getContexts();
  if (!Object.keys(contexts).includes(name)) {
    throw new Error(`No such context ${name} exists`);
  }

  const newContexts = { contexts: Object.assign({}, contexts) };
  delete newContexts.contexts[name];
  console.log(`deleted context ${name}`);
  config.set(newContexts);
};

export const clearConfig = () => {
  config.clear();
};
