export const getEndpoints = (apiUrl: string = 'http://localhost:5999') => {
  const url = apiUrl.trim();
  return {
    ADMIN_UTILS: `${url}/adminUtils`,
    GET_MACHINES: `${url}/getMachines`,
    GET_UPLOAD_URL: `${url}/getUploadUrl`,
    GET_UPLOAD_DATA_URL: `${url}/getUploadDataUrl`,
    GET_PROJECT: `${url}/getProject`,
    REGISTER_AGENT: `${url}/registerAgent`,
    LIST_AGENTS: `${url}/listAgents`,
    SET_ACTION: `${url}/setAction`,
    SET_AGENT_ACTION: `${url}/setAgentAction`,
    GET_AGENT_ID_BY_TAG: `${url}/getAgentIdByTag`,
    CLEAN_AGENT_ACTIONS: `${url}/cleanAgentActions`,
    GET_DOWNLOAD_URL: `${url}/getDownloadUrl`,
    GET_PROJECT_DOWNLOAD_URL: `${url}/getProjectDownloadUrl`,
    GENERATE_DATA_ID: `${url}/generateDataId`,
    LIST_MODULES: `${url}/listModules`,
    LIST_MODULES_V2: `${url}/listModulesV2`,
    GET_TOKEN: `${url}/getToken`,
    VERIFY_TOKEN: `${url}/verifyToken`,
    VERIFY_API_KEY: `${url}/verifyApiKey`,
    SET_STORAGE_OBJECT: `${url}/setStorageObject`,
    SET_DATA_METADATA: `${url}/setDataMetadata`,
    LIST_STORAGE_OBJECTS: `${url}/listStorageObjects`,
    GET_DATA_MOUNT: `${url}/getDataMount`,
    QUERY_DATA: `${url}/queryData`,
  };
};

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
