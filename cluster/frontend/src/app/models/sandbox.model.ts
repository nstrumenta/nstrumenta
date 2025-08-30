import { AlgorithmBuildRecord } from './algorithms.model';
import { FileRecord } from './files.model';
import { Machine } from 'nstrumenta/dist/commands/machines';

export interface Parameter {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export class Sandbox {
  type: string;
  lastModified: number;
  url: string;
  dataFile: string;
  algorithm: string;
  screenshot?: string;
  nstModule: {
    dataflow?: unknown;
  };
  nst_project: {
    parameters: Parameter[];
    controls: Parameter[];
  };
  selectedExperiment?: string;
  selectedExperimentInstance?: string;
  useDataflow: boolean;
  selectedHostedVM?: Machine;
  selectedDataFile?: FileRecord;
  selectedAlgorithm?: string;
  selectedAlgorithmBuild?: AlgorithmBuildRecord & { key: string };
}
