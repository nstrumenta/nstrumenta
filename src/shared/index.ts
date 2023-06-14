export const DEFAULT_HOST_PORT = '8088';

const BASE_URL = 'https://us-central1-macro-coil-194519.cloudfunctions.net';
const BASE_URL_LOCAL = 'http://localhost:8080';

export const getEndpoints = (env: 'local' | 'prod') => {
  const baseUrl = env === 'local' ? BASE_URL_LOCAL : BASE_URL;

  return {
    ADMIN_UTILS: `${baseUrl}/adminUtils`,
    GET_MACHINES: `${baseUrl}/getMachines`,
    GET_UPLOAD_URL: `${baseUrl}/getUploadUrl`,
    GET_UPLOAD_DATA_URL: `${baseUrl}/getUploadDataUrl`,
    REGISTER_AGENT: `${baseUrl}/registerAgent`,
    LIST_AGENTS: `${baseUrl}/listAgents`,
    SET_ACTION: `${baseUrl}/setAction`,
    SET_AGENT_ACTION: `${baseUrl}/setAgentAction`,
    GET_AGENT_ID_BY_TAG: `${baseUrl}/getAgentIdByTag`,
    CLEAN_AGENT_ACTIONS: `${baseUrl}/cleanAgentActions`,
    GET_DOWNLOAD_URL: `${baseUrl}/getDownloadUrl`,
    GET_PROJECT_DOWNLOAD_URL: `${baseUrl}/getProjectDownloadUrl`,
    GENERATE_DATA_ID: `${baseUrl}/generateDataId`,
    LIST_MODULES: `${baseUrl}/listModules`,
    GET_TOKEN: `${baseUrl}/getToken`,
    VERIFY_TOKEN: `${baseUrl}/verifyToken`,
    VERIFY_API_KEY: `${baseUrl}/verifyApiKey`,
    SET_STORAGE_OBJECT: `${baseUrl}/setStorageObject`,
    SET_DATA_METADATA: `${baseUrl}/setDataMetadata`,
    LIST_STORAGE_OBJECTS: `${baseUrl}/listStorageObjects`,
    QUERY_DATA: `${baseUrl}/queryData`,
    v2: {
      LIST_MODULES: `${baseUrl}/listModulesV2`,
    },
  };
};

export enum ObjectTypes {
  DATA = 'data',
  MODULES = 'modules',
}

export * from './lib';

export interface DataQueryOptionsCLI {
  tag?: string[];
  id?: string;
  before?: string;
  after?: string;
  limit?: string;
  field?: string;
  comparison?:
    | '<'
    | '<='
    | '=='
    | '>'
    | '>='
    | '!='
    | 'array-contains'
    | 'array-contains-any'
    | 'in'
    | 'not-in';
  compareValue?: string;
  filenames?: string[];
  metadata?: string;
}

export interface DataQueryOptionsClient {
  tag?: string[];
  before?: number;
  after?: number;
  limit?: number;
  field?: string;
  comparison?:
    | '<'
    | '<='
    | '=='
    | '>'
    | '>='
    | '!='
    | 'array-contains'
    | 'array-contains-any'
    | 'in'
    | 'not-in';
  compareValue?: string;
  filenames?: string[];
  metadata?: string | Record<string, unknown>;
}

export type DataQueryOptions = DataQueryOptionsCLI | DataQueryOptionsClient;

export type DataQueryResponse = {
  id: string;
  name: string;
  dataId: string;
  filePath: string;
  tags: string[];
  size: number;
  lastModified: number;
}[];

export * from './rpc';
