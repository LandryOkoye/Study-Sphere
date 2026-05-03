export type StudyTaskStatus = "pending" | "in_progress" | "completed";

export type StudyAgentGoal = {
  goal: string;
  subject: string;
  durationDays?: number;
  dailyMinutes?: number;
  goalType?: "exam-prep" | "skill-building" | "topic-mastery" | "research";
  examType?: string;
  confidenceLevel?: "low" | "medium" | "high";
  targetScore?: number;
};

export type StudyTask = {
  id: string;
  title: string;
  topic: string;
  day: number;
  status: StudyTaskStatus;
  objective: string;
};

export type StudyQuizQuestion = {
  id: string;
  prompt: string;
  answer: string;
};

export type StudyQuiz = {
  topic: string;
  questions: StudyQuizQuestion[];
};

export type StoredArtifactRef = {
  rootHash: string;
  fileName: string;
};

export type StudyArtifact = {
  type: "lesson" | "quiz" | "plan" | "reflection";
  title: string;
  content: string;
  topic?: string;
  createdAt: number;
  storage?: StoredArtifactRef | null;
};

export type StudyQuizResult = {
  topic: string;
  score: number;
  submittedAt: number;
  feedback?: string;
};

export type StudyAgentState = {
  goal: StudyAgentGoal | null;
  plan: StudyTask[];
  weakTopics: string[];
  lastRecommendedTopic: string | null;
  currentTaskId: string | null;
  latestArtifact: StudyArtifact | null;
  storedArtifacts: StoredArtifactRef[];
  recentQuizResults: StudyQuizResult[];
  activityLog: string[];
  updatedAt: number | null;
};

export type StudyAgentContext = {
  subjectId: string;
  subjectName: string;
  availableTopics: string[];
};

export type PlannerAction =
  | "CREATE_PLAN"
  | "GENERATE_LESSON"
  | "GENERATE_QUIZ"
  | "RECOMMEND_REVIEW";

export type PlannerDecision = {
  reasoning_summary: string;
  action: PlannerAction;
  parameters: {
    topic?: string;
    taskId?: string;
    focus?: string;
  };
};

export type StudyAgentOperation =
  | {
      type: "initialize";
      goal: StudyAgentGoal;
    }
  | {
      type: "run-step";
    }
  | {
      type: "complete-task";
      taskId: string;
    }
  | {
      type: "submit-quiz-result";
      topic: string;
      answers: Array<{
        questionId: string;
        response: string;
      }>;
    };

export type StudyAgentResponse = {
  state: StudyAgentState;
  decisionSummary: string;
};
