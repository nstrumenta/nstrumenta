export interface ExperimentNode {
  id: string;
  label: string;
  color?: string;
  position?: string;
}

export interface ExperimentLink {
  source: string;
  target: string;
  label?: string;
}

export class Experiment {
  graph: { nodes: ExperimentNode[]; links: ExperimentLink[] };
  name: string;

  constructor() {
    this.graph = { nodes: [], links: [] };
  }
}
