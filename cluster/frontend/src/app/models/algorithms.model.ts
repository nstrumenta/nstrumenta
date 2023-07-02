export interface AlgorithmRecord {
  lastModified: string;
}

export interface AlgorithmBuildRecord {
  lastModified: string;
  nst_project: { parameters: any[]; controls: any[] };
  url: string;
}
