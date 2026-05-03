export type ResearchWorkspaceDocument = {
  id: string;
  name: string;
  rootHash: string;
  size: number;
  uploadedAt: number;
  notes: string;
};

export type ResearchGoal = {
  goal: string;
  durationDays?: number;
};

export type ResearchArtifact = {
  type: "literature-map" | "reading-plan" | "synthesis-note";
  title: string;
  content: string;
  createdAt: number;
  storage?: {
    rootHash: string;
    fileName: string;
  } | null;
};

export type ResearchAction = "GENERATE_LITERATURE_MAP" | "GENERATE_READING_PLAN" | "GENERATE_SYNTHESIS_NOTE";

export type ResearchDecision = {
  reasoning_summary: string;
  action: ResearchAction;
  parameters?: {
    focus?: string;
  };
};

export type ResearchAgentState = {
  goal: ResearchGoal | null;
  latestArtifact: ResearchArtifact | null;
  storedArtifacts: Array<{
    rootHash: string;
    fileName: string;
  }>;
  activityLog: string[];
  updatedAt: number | null;
};

export type ResearchAgentOperation =
  | {
      type: "initialize";
      goal: ResearchGoal;
    }
  | {
      type: "run-step";
    };

export type ResearchAgentContext = {
  workspaceId: string;
  workspaceName: string;
  documents: ResearchWorkspaceDocument[];
};

export type ResearchAgentResponse = {
  state: ResearchAgentState;
  decisionSummary: string;
};
