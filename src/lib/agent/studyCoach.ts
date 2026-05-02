import { chatCompletion } from "@/lib/0g/compute";
import { uploadBuffer } from "@/lib/0g/storage";
import type {
  PlannerDecision,
  StoredArtifactRef,
  StudyAgentContext,
  StudyAgentGoal,
  StudyAgentOperation,
  StudyAgentResponse,
  StudyAgentState,
  StudyArtifact,
  StudyQuiz,
  StudyQuizResult,
  StudyTask,
} from "@/lib/agent/types";

const DEFAULT_STATE: StudyAgentState = {
  goal: null,
  plan: [],
  weakTopics: [],
  lastRecommendedTopic: null,
  currentTaskId: null,
  latestArtifact: null,
  storedArtifacts: [],
  recentQuizResults: [],
  activityLog: [],
  updatedAt: null,
};

function createEmptyState(): StudyAgentState {
  return {
    ...DEFAULT_STATE,
    plan: [],
    weakTopics: [],
    storedArtifacts: [],
    recentQuizResults: [],
    activityLog: [],
  };
}

function normalizeState(state: StudyAgentState | null | undefined): StudyAgentState {
  if (!state) return createEmptyState();
  return {
    goal: state.goal ?? null,
    plan: state.plan ?? [],
    weakTopics: state.weakTopics ?? [],
    lastRecommendedTopic: state.lastRecommendedTopic ?? null,
    currentTaskId: state.currentTaskId ?? null,
    latestArtifact: state.latestArtifact ?? null,
    storedArtifacts: state.storedArtifacts ?? [],
    recentQuizResults: state.recentQuizResults ?? [],
    activityLog: state.activityLog ?? [],
    updatedAt: state.updatedAt ?? null,
  };
}

function safeJsonParse<T>(raw: string): T {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(candidate) as T;
}

function formatTopics(availableTopics: string[]): string {
  return availableTopics.slice(0, 30).join(", ");
}

function buildPlanPrompt(goal: StudyAgentGoal, context: StudyAgentContext): string {
  return [
    "You are a Study Coach Agent for an academic learning platform.",
    "Create a practical study plan for the student's goal.",
    "Return JSON only with this shape:",
    '{ "tasks": [{ "title": "Day 1 - Motion in a Straight Line", "topic": "Motion in a Straight Line", "day": 1, "objective": "Understand displacement, distance, speed, and velocity." }] }',
    `Subject: ${goal.subject}`,
    `Exam: ${goal.examType}`,
    `Duration days: ${goal.durationDays}`,
    `Daily minutes: ${goal.dailyMinutes}`,
    `Confidence level: ${goal.confidenceLevel}`,
    `Target score: ${goal.targetScore}`,
    `Available topics: ${formatTopics(context.availableTopics)}`,
    "Rules:",
    "- Produce between 5 and 12 tasks.",
    "- Use only topics from the provided list when possible.",
    "- Tasks must be sequenced from foundational to advanced.",
    "- Objectives must be concise and exam-focused.",
  ].join("\n");
}

function buildDecisionPrompt(state: StudyAgentState, context: StudyAgentContext): string {
  return [
    "You are a Study Coach Agent deciding the student's next best action.",
    "Return JSON only with this exact shape:",
    '{ "reasoning_summary": "short sentence", "action": "GENERATE_LESSON", "parameters": { "topic": "Motion in a Straight Line", "taskId": "task-1", "focus": "kinematics basics" } }',
    "Valid actions: GENERATE_LESSON, GENERATE_QUIZ, RECOMMEND_REVIEW.",
    `Subject: ${context.subjectName}`,
    `Available topics: ${formatTopics(context.availableTopics)}`,
    `Goal: ${JSON.stringify(state.goal)}`,
    `Plan: ${JSON.stringify(state.plan)}`,
    `Weak topics: ${JSON.stringify(state.weakTopics)}`,
    `Recent quiz results: ${JSON.stringify(state.recentQuizResults.slice(-5))}`,
    `Current task id: ${state.currentTaskId ?? "none"}`,
    "Rules:",
    "- If there is a pending task, usually choose GENERATE_LESSON for that task's topic.",
    "- If the current task is already in progress and there is no recent quiz for that topic, choose GENERATE_QUIZ.",
    "- If recent quiz scores are weak, choose RECOMMEND_REVIEW.",
    "- Keep reasoning_summary under 20 words.",
  ].join("\n");
}

function buildLessonPrompt(topic: string, goal: StudyAgentGoal): string {
  return [
    `You are an expert ${goal.subject} tutor preparing a student for ${goal.examType}.`,
    `Teach the topic: ${topic}.`,
    "Write a lesson with markdown headings and concise exam-focused explanations.",
    "Include:",
    "- core ideas",
    "- formulas or definitions if relevant",
    "- one worked example",
    "- two short recap bullets",
  ].join("\n");
}

function buildQuizPrompt(topic: string, goal: StudyAgentGoal): string {
  return [
    `You are an expert ${goal.subject} tutor preparing a student for ${goal.examType}.`,
    `Create a short quiz on: ${topic}.`,
    "Return JSON only with this shape:",
    '{ "topic": "Motion in a Straight Line", "questions": [{ "id": "q1", "prompt": "Question text", "answer": "Expected answer" }] }',
    "Rules:",
    "- Produce exactly 3 questions.",
    "- Make questions short and exam-relevant.",
    "- Include the expected answer for each question.",
  ].join("\n");
}

function buildGradingPrompt(
  quiz: StudyQuiz,
  answers: Array<{ questionId: string; response: string }>,
  goal: StudyAgentGoal
): string {
  return [
    `You are an expert ${goal.subject} tutor grading a short ${goal.examType} prep quiz.`,
    "Return JSON only with this exact shape:",
    '{ "score": 72, "feedback": "short markdown feedback", "weakTopics": ["vector resolution"], "perQuestion": [{ "questionId": "q1", "assessment": "correct" }] }',
    `Quiz: ${JSON.stringify(quiz)}`,
    `Student answers: ${JSON.stringify(answers)}`,
    "Rules:",
    "- Score must be between 0 and 100.",
    "- feedback must be concise and actionable markdown.",
    "- weakTopics should list actual concept gaps.",
  ].join("\n");
}

function logEntry(message: string): string {
  return `${new Date().toISOString()}: ${message}`;
}

function createTaskId(topic: string, day: number): string {
  return `task-${day}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function choosePendingTask(plan: StudyTask[], currentTaskId: string | null): StudyTask | null {
  if (currentTaskId) {
    const currentTask = plan.find((task) => task.id === currentTaskId);
    if (currentTask && currentTask.status !== "completed") {
      return currentTask;
    }
  }
  return plan.find((task) => task.status !== "completed") ?? null;
}

function sanitizeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function persistArtifact(artifact: StudyArtifact): Promise<StudyArtifact> {
  const extension = artifact.type === "quiz" || artifact.type === "plan" ? "json" : "md";
  const filename = `${sanitizeFileName(artifact.title)}-${artifact.createdAt}.${extension}`;
  const buffer = Buffer.from(artifact.content, "utf8");
  const result = await uploadBuffer(buffer, filename);

  return {
    ...artifact,
    storage: {
      rootHash: result.rootHash,
      fileName: filename,
    },
  };
}

function mergeStoredArtifactRefs(existing: StoredArtifactRef[], artifact: StudyArtifact): StoredArtifactRef[] {
  if (!artifact.storage) return existing;
  const hasMatch = existing.some((item) => item.rootHash === artifact.storage?.rootHash);
  return hasMatch ? existing : [...existing, artifact.storage];
}

async function generatePlan(goal: StudyAgentGoal, context: StudyAgentContext): Promise<StudyTask[]> {
  const result = await chatCompletion([
    { role: "system", content: buildPlanPrompt(goal, context) },
    { role: "user", content: "Generate the study plan now." },
  ]);

  const parsed = safeJsonParse<{ tasks: Array<{ title: string; topic: string; day: number; objective: string }> }>(
    result.content
  );

  return parsed.tasks.slice(0, 12).map((task, index) => ({
    id: createTaskId(task.topic, task.day || index + 1),
    title: task.title,
    topic: task.topic,
    day: task.day || index + 1,
    status: index === 0 ? "in_progress" : "pending",
    objective: task.objective,
  }));
}

async function decideNextStep(state: StudyAgentState, context: StudyAgentContext): Promise<PlannerDecision> {
  const result = await chatCompletion([
    { role: "system", content: buildDecisionPrompt(state, context) },
    { role: "user", content: "Choose the single best next action." },
  ]);

  return safeJsonParse<PlannerDecision>(result.content);
}

async function generateLesson(topic: string, goal: StudyAgentGoal): Promise<StudyArtifact> {
  const result = await chatCompletion([
    { role: "system", content: buildLessonPrompt(topic, goal) },
    { role: "user", content: `Generate the lesson for ${topic}.` },
  ]);

  return persistArtifact({
    type: "lesson",
    title: `${topic} Lesson`,
    content: result.content,
    topic,
    createdAt: Date.now(),
  });
}

async function generateQuiz(topic: string, goal: StudyAgentGoal): Promise<StudyArtifact> {
  const result = await chatCompletion([
    { role: "system", content: buildQuizPrompt(topic, goal) },
    { role: "user", content: `Generate the quiz for ${topic}.` },
  ]);

  const parsed = safeJsonParse<StudyQuiz>(result.content);
  return persistArtifact({
    type: "quiz",
    title: `${topic} Quiz`,
    content: JSON.stringify(parsed),
    topic,
    createdAt: Date.now(),
  });
}

async function gradeQuiz(
  quiz: StudyQuiz,
  answers: Array<{ questionId: string; response: string }>,
  goal: StudyAgentGoal
): Promise<{ score: number; feedback: string; weakTopics: string[] }> {
  const result = await chatCompletion([
    { role: "system", content: buildGradingPrompt(quiz, answers, goal) },
    { role: "user", content: "Grade the quiz now." },
  ]);

  const parsed = safeJsonParse<{
    score: number;
    feedback: string;
    weakTopics?: string[];
  }>(result.content);

  return {
    score: Math.max(0, Math.min(100, Math.round(parsed.score))),
    feedback: parsed.feedback,
    weakTopics: parsed.weakTopics ?? [],
  };
}

function applyCurrentTask(plan: StudyTask[], taskId: string | null, status: StudyTask["status"]): StudyTask[] {
  if (!taskId) return plan;
  return plan.map((task) => (task.id === taskId ? { ...task, status } : task));
}

function updateWeakTopics(existing: string[], result: StudyQuizResult): string[] {
  const next = new Set(existing);
  if (result.score < 60) {
    next.add(result.topic);
  } else {
    next.delete(result.topic);
  }
  return Array.from(next);
}

function parseQuizArtifact(artifact: StudyArtifact | null): StudyQuiz | null {
  if (!artifact || artifact.type !== "quiz") return null;
  try {
    return JSON.parse(artifact.content) as StudyQuiz;
  } catch {
    return null;
  }
}

async function buildReviewArtifact(topic: string, focus?: string): Promise<StudyArtifact> {
  return persistArtifact({
    type: "reflection",
    title: `${topic} Review`,
    content: `Review recommended for **${topic}**.\n\nFocus: ${focus ?? "Strengthen weak areas before moving on."}`,
    topic,
    createdAt: Date.now(),
  });
}

async function runAgentStep(state: StudyAgentState, context: StudyAgentContext): Promise<StudyAgentResponse> {
  if (!state.goal) {
    throw new Error("Agent goal is required before running a step.");
  }

  let workingState = normalizeState(state);
  const goal = workingState.goal;
  if (!goal) {
    throw new Error("Agent goal is required before running a step.");
  }

  if (workingState.plan.length === 0) {
    const plan = await generatePlan(goal, context);
    const firstTask = choosePendingTask(plan, null);
    const planArtifact = await persistArtifact({
      type: "plan",
      title: `${goal.subject} Study Plan`,
      content: JSON.stringify(plan),
      createdAt: Date.now(),
    });

    workingState = {
      ...workingState,
      plan,
      currentTaskId: firstTask?.id ?? null,
      lastRecommendedTopic: firstTask?.topic ?? null,
      latestArtifact: planArtifact,
      storedArtifacts: mergeStoredArtifactRefs(workingState.storedArtifacts, planArtifact),
      activityLog: [...workingState.activityLog, logEntry("Generated study plan.")],
      updatedAt: Date.now(),
    };
    return {
      state: workingState,
      decisionSummary: "Generated the initial study plan.",
    };
  }

  const decision = await decideNextStep(workingState, context);
  const activeTask = choosePendingTask(workingState.plan, decision.parameters.taskId ?? workingState.currentTaskId);
  const chosenTopic = decision.parameters.topic ?? activeTask?.topic ?? workingState.lastRecommendedTopic;

  if (!chosenTopic) {
    return {
      state: {
        ...workingState,
        activityLog: [...workingState.activityLog, logEntry("No topic available for the next step.")],
        updatedAt: Date.now(),
      },
      decisionSummary: "No available topic found for the next step.",
    };
  }

  if (decision.action === "GENERATE_QUIZ") {
    const artifact = await generateQuiz(chosenTopic, goal);
    return {
      state: {
        ...workingState,
        currentTaskId: activeTask?.id ?? workingState.currentTaskId,
        lastRecommendedTopic: chosenTopic,
        latestArtifact: artifact,
        storedArtifacts: mergeStoredArtifactRefs(workingState.storedArtifacts, artifact),
        activityLog: [...workingState.activityLog, logEntry(`Generated quiz for ${chosenTopic}.`)],
        updatedAt: Date.now(),
      },
      decisionSummary: decision.reasoning_summary,
    };
  }

  if (decision.action === "RECOMMEND_REVIEW") {
    const reviewArtifact = await buildReviewArtifact(chosenTopic, decision.parameters.focus);
    return {
      state: {
        ...workingState,
        currentTaskId: activeTask?.id ?? workingState.currentTaskId,
        lastRecommendedTopic: chosenTopic,
        latestArtifact: reviewArtifact,
        storedArtifacts: mergeStoredArtifactRefs(workingState.storedArtifacts, reviewArtifact),
        activityLog: [...workingState.activityLog, logEntry(`Recommended review for ${chosenTopic}.`)],
        updatedAt: Date.now(),
      },
      decisionSummary: decision.reasoning_summary,
    };
  }

  const artifact = await generateLesson(chosenTopic, goal);
  return {
    state: {
      ...workingState,
      plan: applyCurrentTask(workingState.plan, activeTask?.id ?? workingState.currentTaskId, "in_progress"),
      currentTaskId: activeTask?.id ?? workingState.currentTaskId,
      lastRecommendedTopic: chosenTopic,
      latestArtifact: artifact,
      storedArtifacts: mergeStoredArtifactRefs(workingState.storedArtifacts, artifact),
      activityLog: [...workingState.activityLog, logEntry(`Generated lesson for ${chosenTopic}.`)],
      updatedAt: Date.now(),
    },
    decisionSummary: decision.reasoning_summary,
  };
}

export async function handleStudyAgentOperation(input: {
  state: StudyAgentState | null | undefined;
  context: StudyAgentContext;
  operation: StudyAgentOperation;
}): Promise<StudyAgentResponse> {
  const state = normalizeState(input.state);

  if (input.operation.type === "initialize") {
    const nextState = normalizeState({
      ...state,
      goal: input.operation.goal,
      plan: [],
      weakTopics: [],
      lastRecommendedTopic: null,
      currentTaskId: null,
      latestArtifact: null,
      storedArtifacts: [],
      recentQuizResults: [],
      activityLog: [logEntry("Initialized Study Coach goal.")],
      updatedAt: Date.now(),
    });

    return runAgentStep(nextState, input.context);
  }

  if (input.operation.type === "complete-task") {
    const operation = input.operation;
    const completedPlan = state.plan;
    const nextPlan = completedPlan.map((task) =>
      task.id === operation.taskId ? { ...task, status: "completed" as const } : task
    );
    const nextTask = nextPlan.find((task) => task.status === "pending") ?? null;

    return {
      state: {
        ...state,
        plan: nextPlan.map((task) =>
          nextTask && task.id === nextTask.id ? { ...task, status: "in_progress" } : task
        ),
        currentTaskId: nextTask?.id ?? null,
        lastRecommendedTopic: nextTask?.topic ?? state.lastRecommendedTopic,
        activityLog: [...state.activityLog, logEntry(`Completed task ${operation.taskId}.`)],
        updatedAt: Date.now(),
      },
      decisionSummary: nextTask
        ? `Marked task complete. Next focus is ${nextTask.topic}.`
        : "Marked task complete. The plan is finished.",
    };
  }

  if (input.operation.type === "submit-quiz-result") {
    const operation = input.operation;
    const quizArtifact = parseQuizArtifact(state.latestArtifact);
    if (!quizArtifact || !state.goal) {
      throw new Error("A generated quiz is required before answers can be graded.");
    }

    const graded = await gradeQuiz(quizArtifact, operation.answers, state.goal);
    const result: StudyQuizResult = {
      topic: operation.topic,
      score: graded.score,
      submittedAt: Date.now(),
      feedback: graded.feedback,
    };
    const feedbackArtifact = await persistArtifact({
      type: "reflection",
      title: `${operation.topic} Quiz Feedback`,
      content: graded.feedback,
      topic: operation.topic,
      createdAt: Date.now(),
    });

    return {
      state: {
        ...state,
        weakTopics: Array.from(new Set([...updateWeakTopics(state.weakTopics, result), ...graded.weakTopics])),
        latestArtifact: feedbackArtifact,
        storedArtifacts: mergeStoredArtifactRefs(state.storedArtifacts, feedbackArtifact),
        recentQuizResults: [...state.recentQuizResults, result].slice(-10),
        activityLog: [
          ...state.activityLog,
          logEntry(`Recorded quiz score ${result.score}% for ${result.topic}.`),
        ],
        updatedAt: Date.now(),
      },
      decisionSummary:
        result.score < 60
          ? `Quiz graded at ${result.score}%. ${result.topic} is now flagged for review.`
          : `Quiz graded at ${result.score}%. ${result.topic} is in good shape.`,
    };
  }

  const quizArtifact = parseQuizArtifact(state.latestArtifact);
  if (quizArtifact && state.currentTaskId) {
    const currentTask = state.plan.find((task) => task.id === state.currentTaskId);
    if (currentTask && currentTask.status === "in_progress") {
      return {
        state,
        decisionSummary: `Quiz is ready for ${quizArtifact.topic}. Submit the student's answers for grading.`,
      };
    }
  }

  return runAgentStep(state, input.context);
}
