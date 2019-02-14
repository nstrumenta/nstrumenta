export interface Config {
  type: 'sandbox' | 'algorithm' | 'project';
  name: string;
  fileIncludeString: string;
  entry?: string;
  port?: number; 
}

export interface Message {
  type: string;
  config?: Config;
  payload?: any;
}