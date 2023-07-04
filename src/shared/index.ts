export const getEndpoints = (apiUrl: string = 'http://localhost:5999') => {
  return {
    ADMIN_UTILS: `${apiUrl}/adminUtils`,
    GET_MACHINES: `${apiUrl}/getMachines`,
    GET_UPLOAD_URL: `${apiUrl}/getUploadUrl`,
    GET_UPLOAD_DATA_URL: `${apiUrl}/getUploadDataUrl`,
    REGISTER_AGENT: `${apiUrl}/registerAgent`,
    LIST_AGENTS: `${apiUrl}/listAgents`,
    SET_ACTION: `${apiUrl}/setAction`,
    SET_AGENT_ACTION: `${apiUrl}/setAgentAction`,
    GET_AGENT_ID_BY_TAG: `${apiUrl}/getAgentIdByTag`,
    CLEAN_AGENT_ACTIONS: `${apiUrl}/cleanAgentActions`,
    GET_DOWNLOAD_URL: `${apiUrl}/getDownloadUrl`,
    GET_PROJECT_DOWNLOAD_URL: `${apiUrl}/getProjectDownloadUrl`,
    GENERATE_DATA_ID: `${apiUrl}/generateDataId`,
    LIST_MODULES: `${apiUrl}/listModules`,
    LIST_MODULES_V2: `${apiUrl}/listModulesV2`,
    GET_TOKEN: `${apiUrl}/getToken`,
    VERIFY_TOKEN: `${apiUrl}/verifyToken`,
    VERIFY_API_KEY: `${apiUrl}/verifyApiKey`,
    SET_STORAGE_OBJECT: `${apiUrl}/setStorageObject`,
    SET_DATA_METADATA: `${apiUrl}/setDataMetadata`,
    LIST_STORAGE_OBJECTS: `${apiUrl}/listStorageObjects`,
    GET_DATA_MOUNT: `${apiUrl}/getDataMount`,
    QUERY_DATA: `${apiUrl}/queryData`,
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
