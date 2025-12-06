export interface AlgorithmRecord {
  lastModified: string;
}

export interface AlgorithmBuildRecord {
  lastModified: string;
  nst_project: { parameters: unknown[]; controls: unknown[] };
  url: string;
}
