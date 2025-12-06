// Consolidated Firebase data models for the application

import { Action } from './action.model';
import { DocumentData } from 'firebase/firestore';

export interface Agent extends DocumentData {
  id?: string;
  name?: string;
  status?: string;
  type?: string;
  lastModified?: number;
  [key: string]: unknown;
}

export interface Project extends DocumentData {
  id?: string;
  key?: string;
  name?: string;
  lastOpened?: number;
  lastModified?: number;
  [key: string]: unknown;
}

export interface Machine extends DocumentData {
  name?: string;
  status?: string;
  type?: string;
  lastModified?: number;
  [key: string]: unknown;
}

export interface Repository extends DocumentData {
  key?: string;
  name?: string;
  url?: string;
  lastModified?: number;
  [key: string]: unknown;
}

export interface Module extends DocumentData {
  id?: string;
  name?: string;
  version?: string;
  lastModified?: number;
  [key: string]: unknown;
}

export interface DataRecord extends DocumentData {
  key?: string;
  name?: string;
  type?: string;
  filePath?: string;
  dirname?: string;
  lastModified?: number;
  size?: number;
  displayName?: string; // Used in flat view to show relative path
  [key: string]: unknown;
}

export interface RecordData extends DocumentData {
  key?: string;
  name?: string;
  lastModified?: number;
  data?: unknown[];
  [key: string]: unknown;
}

// Document interfaces with Firebase IDs
export interface AgentWithKey extends Agent {
  key: string;
}

export interface ActionWithKey extends Action {
  key: string;
}

export interface FileDocument extends DocumentData {
  key?: string;
  name?: string;
  [key: string]: unknown;
}

// Type for any Firebase document with key
export interface FirebaseDocument extends DocumentData {
  key?: string;
  id?: string;
  [key: string]: unknown;
}
