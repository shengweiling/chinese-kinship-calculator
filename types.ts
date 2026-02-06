export interface KinshipStep {
  step: string;
  result: string;
  explanation: string;
}

export interface GraphNode {
  id: string;
  label: string;
  group: number; // 0 for start, 1 for intermediate, 2 for result
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface KinshipResult {
  finalTitle: string;
  steps: KinshipStep[];
  graphData: GraphData;
}

export interface RelationButton {
  label: string;
  value: string;
}