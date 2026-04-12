export * from './lib/index';
export { parseOrgProject } from './lib/orgProject';

export interface QueryOptions {
  collection?: 'data' | 'modules';
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
}
