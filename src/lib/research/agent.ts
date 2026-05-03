import { chatCompletion } from "@/lib/0g/compute";
import { uploadBuffer } from "@/lib/0g/storage";
import type {
  ResearchAgentContext,
  ResearchAgentOperation,
  ResearchAgentResponse,
  ResearchAgentState,
  ResearchArtifact,
  ResearchDecision,
  ResearchGoal,
} from "@/lib/research/types";

const DEFAULT_DURATION_DAYS = 14;

const EMPTY_STATE: ResearchAgentState = {
  goal: null,
  latestArtifact: null,
  storedArtifacts: [],
  activityLog: [],
  updatedAt: null,
};

function normalizeState(state: ResearchAgentState | null | undefined): ResearchAgentState {
  if (!state) return { ...EMPTY_STATE, storedArtifacts: [], activityLog: [] };
  return {
    goal: state.goal ?? null,
    latestArtifact: state.latestArtifact ?? null,
    storedArtifacts: state.storedArtifacts ?? [],
    activityLog: state.activityLog ?? [],
    updatedAt: state.updatedAt ?? null,
  };
}

function normalizeGoal(goal: ResearchGoal): Required<ResearchGoal> {
  return {
    goal: goal.goal.trim(),
    durationDays: goal.durationDays && goal.durationDays > 0 ? goal.durationDays : DEFAULT_DURATION_DAYS,
  };
}

function safeJsonParse<T>(raw: string): T {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(candidate) as T;
}

function sanitizeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function logEntry(message: string): string {
  return `${new Date().toISOString()}: ${message}`;
}

async function persistArtifact(artifact: ResearchArtifact): Promise<ResearchArtifact> {
  const filename = `${sanitizeFileName(artifact.title)}-${artifact.createdAt}.md`;
  const result = await uploadBuffer(Buffer.from(artifact.content, "utf8"), filename);
  return {
    ...artifact,
    storage: {
      rootHash: result.rootHash,
      fileName: filename,
    },
  };
}

function buildDocumentDigest(context: ResearchAgentContext): string {
  return context.documents
    .map((doc, index) => {
      const note = doc.notes.trim() || "No researcher note provided.";
      return `${index + 1}. ${doc.name}\nRoot hash: ${doc.rootHash}\nResearcher notes: ${note}`;
    })
    .join("\n\n");
}

function buildPlannerPrompt(goal: ResearchGoal, context: ResearchAgentContext): string {
  const normalizedGoal = normalizeGoal(goal);
  return [
    "You are a Research Workflow Agent.",
    "You help researchers organize uploaded documents into a literature review workflow.",
    "Return JSON only with this shape:",
    '{ "reasoning_summary": "short sentence", "action": "GENERATE_LITERATURE_MAP", "parameters": { "focus": "core themes and disagreements" } }',
    "Valid actions: GENERATE_LITERATURE_MAP, GENERATE_READING_PLAN, GENERATE_SYNTHESIS_NOTE.",
    `Workspace: ${context.workspaceName}`,
    `Research goal: ${normalizedGoal.goal}`,
    `Duration days: ${normalizedGoal.durationDays}`,
    `Document corpus:\n${buildDocumentDigest(context)}`,
    "Rules:",
    "- If there is no literature map yet, choose GENERATE_LITERATURE_MAP.",
    "- If the researcher has a clear time horizon, reading plan is acceptable after the map exists.",
    "- Keep reasoning_summary under 20 words.",
  ].join("\n");
}

function buildLiteratureMapPrompt(goal: ResearchGoal, context: ResearchAgentContext, focus?: string): string {
  const normalizedGoal = normalizeGoal(goal);
  return [
    "You are building a literature map for a researcher.",
    `Research goal: ${normalizedGoal.goal}`,
    `Time horizon: ${normalizedGoal.durationDays} days`,
    `Focus: ${focus ?? "core themes, methods, conflicts, and gaps"}`,
    `Documents:\n${buildDocumentDigest(context)}`,
    "Write a structured markdown literature map with these sections:",
    "- Themes",
    "- Methods",
    "- Agreements",
    "- Disagreements",
    "- Open Questions",
    "- Suggested Next Reading Order",
    "Be concrete and tie the map back to the goal.",
  ].join("\n");
}

function buildReadingPlanPrompt(goal: ResearchGoal, context: ResearchAgentContext, focus?: string): string {
  const normalizedGoal = normalizeGoal(goal);
  return [
    "You are building a research reading plan.",
    `Research goal: ${normalizedGoal.goal}`,
    `Duration days: ${normalizedGoal.durationDays}`,
    `Focus: ${focus ?? "coverage, synthesis, and comparison"}`,
    `Documents:\n${buildDocumentDigest(context)}`,
    "Produce a markdown reading plan with day-by-day milestones, what to extract from each document, and one synthesis checkpoint.",
  ].join("\n");
}

function buildSynthesisPrompt(goal: ResearchGoal, context: ResearchAgentContext, focus?: string): string {
  return [
    "You are writing a concise research synthesis note.",
    `Research goal: ${normalizeGoal(goal).goal}`,
    `Focus: ${focus ?? "state of the literature"}`,
    `Documents:\n${buildDocumentDigest(context)}`,
    "Produce markdown with a short synthesis, a list of strongest claims, a list of unresolved tensions, and one recommended next move.",
  ].join("\n");
}

async function decideNextAction(state: ResearchAgentState, context: ResearchAgentContext): Promise<ResearchDecision> {
  const result = await chatCompletion([
    { role: "system", content: buildPlannerPrompt(state.goal!, context) },
    { role: "user", content: `Current state: ${JSON.stringify(state)}` },
  ]);
  return safeJsonParse<ResearchDecision>(result.content);
}

async function generateArtifact(
  action: ResearchDecision["action"],
  goal: ResearchGoal,
  context: ResearchAgentContext,
  focus?: string
): Promise<ResearchArtifact> {
  const prompt =
    action === "GENERATE_READING_PLAN"
      ? buildReadingPlanPrompt(goal, context, focus)
      : action === "GENERATE_SYNTHESIS_NOTE"
      ? buildSynthesisPrompt(goal, context, focus)
      : buildLiteratureMapPrompt(goal, context, focus);

  const result = await chatCompletion([
    { role: "system", content: prompt },
    { role: "user", content: "Generate the artifact now." },
  ]);

  const artifact = await persistArtifact({
    type:
      action === "GENERATE_READING_PLAN"
        ? "reading-plan"
        : action === "GENERATE_SYNTHESIS_NOTE"
        ? "synthesis-note"
        : "literature-map",
    title:
      action === "GENERATE_READING_PLAN"
        ? `${context.workspaceName} Reading Plan`
        : action === "GENERATE_SYNTHESIS_NOTE"
        ? `${context.workspaceName} Synthesis Note`
        : `${context.workspaceName} Literature Map`,
    content: result.content,
    createdAt: Date.now(),
  });

  return artifact;
}

export async function handleResearchAgentOperation(input: {
  state: ResearchAgentState | null | undefined;
  context: ResearchAgentContext;
  operation: ResearchAgentOperation;
}): Promise<ResearchAgentResponse> {
  const state = normalizeState(input.state);

  if (input.context.documents.length === 0) {
    throw new Error("Upload at least one research document before running the research agent.");
  }

  if (input.operation.type === "initialize") {
    const goal = normalizeGoal(input.operation.goal);
    const nextState: ResearchAgentState = {
      goal,
      latestArtifact: null,
      storedArtifacts: [],
      activityLog: [logEntry("Initialized research workflow goal.")],
      updatedAt: Date.now(),
    };
    const artifact = await generateArtifact("GENERATE_LITERATURE_MAP", goal, input.context);
    return {
      state: {
        ...nextState,
        latestArtifact: artifact,
        storedArtifacts: artifact.storage ? [artifact.storage] : [],
        activityLog: [...nextState.activityLog, logEntry("Generated literature map.")],
      },
      decisionSummary: "Generated the initial literature map.",
    };
  }

  if (!state.goal) {
    throw new Error("Research goal is required before running the agent.");
  }

  const decision = await decideNextAction(state, input.context);
  const artifact = await generateArtifact(decision.action, state.goal, input.context, decision.parameters?.focus);
  return {
    state: {
      ...state,
      latestArtifact: artifact,
      storedArtifacts: artifact.storage
        ? state.storedArtifacts.some((item) => item.rootHash === artifact.storage?.rootHash)
          ? state.storedArtifacts
          : [...state.storedArtifacts, artifact.storage]
        : state.storedArtifacts,
      activityLog: [...state.activityLog, logEntry(`Generated ${artifact.type}.`)],
      updatedAt: Date.now(),
    },
    decisionSummary: decision.reasoning_summary,
  };
}
