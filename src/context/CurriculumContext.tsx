"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type LearningItem = {
  id: string;
  name: string;
  subtitle: string;
  progress: number;
  timeSpent: string;
  lastTopic: string;
};

export type TOCNode = {
  id: string;
  title: string;
  type: "chapter" | "topic";
  progress?: number;
  children?: TOCNode[];
};

type CurriculumContextType = {
  secondaryTextbooks: LearningItem[];
  universityCourses: LearningItem[];
  tocs: Record<string, TOCNode[]>;
  addTextbook: (item: LearningItem) => void;
  removeTextbook: (id: string) => void;
  addCourse: (item: LearningItem) => void;
  removeCourse: (id: string) => void;
  setTOC: (subjectId: string, toc: TOCNode[]) => void;
};

const defaultTextbooks: LearningItem[] = [
  { id: "sec-phy", name: "Physics", subtitle: "Senior Secondary", progress: 40, timeSpent: "14h 20m", lastTopic: "Motion in a Straight Line" },
  { id: "sec-chem", name: "Chemistry", subtitle: "Senior Secondary", progress: 18, timeSpent: "5h 45m", lastTopic: "Atomic Structure" },
  { id: "sec-bio", name: "Biology", subtitle: "Senior Secondary", progress: 70, timeSpent: "22h 10m", lastTopic: "Cellular Respiration" },
  { id: "sec-math", name: "Mathematics", subtitle: "Senior Secondary", progress: 30, timeSpent: "11h 05m", lastTopic: "Quadratic Equations" },
];

const defaultCourses: LearningItem[] = [
  { id: "uni-cs", name: "Computer Science", subtitle: "CS301: Data Structures", progress: 12, timeSpent: "4h 15m", lastTopic: "Binary Search Trees" },
  { id: "uni-acc", name: "Accounting", subtitle: "ACC201: Financial Acc", progress: 80, timeSpent: "34h 50m", lastTopic: "Ledger Reconciliation" },
  { id: "uni-pol", name: "Political Science", subtitle: "POL104: Int. Relations", progress: 5, timeSpent: "1h 20m", lastTopic: "Theories of Power" },
  { id: "uni-bio", name: "Biochemistry", subtitle: "BCH401: Enzymology", progress: 55, timeSpent: "18h 40m", lastTopic: "Enzyme Kinetics" },
];

const defaultPhysicsTOC: TOCNode[] = [
  {
    id: "ch1",
    title: "1. Concepts of Space, Time and Motion",
    type: "chapter",
    children: [
      { id: "t1-1", title: "1.1 Introduction to Physics", type: "topic", progress: 100 },
      { id: "t1-2", title: "1.2 Measurement and Units", type: "topic", progress: 100 },
      { id: "t1-3", title: "1.3 Motion in a Straight Line", type: "topic", progress: 70 },
    ]
  },
  {
    id: "ch2",
    title: "2. Vectors and Scalars",
    type: "chapter",
    children: [
      { id: "t2-1", title: "2.1 Difference between Vectors and Scalars", type: "topic", progress: 0 },
      { id: "t2-2", title: "2.2 Vector Addition and Subtraction", type: "topic", progress: 0 },
      { id: "t2-3", title: "2.3 Resolution of Vectors", type: "topic", progress: 0 },
    ]
  },
  {
    id: "ch3",
    title: "3. Dynamics",
    type: "chapter",
    children: [
      { id: "t3-1", title: "3.1 Newton's Laws of Motion", type: "topic", progress: 0 },
      { id: "t3-2", title: "3.2 Friction", type: "topic", progress: 0 },
    ]
  }
];

const defaultTocs: Record<string, TOCNode[]> = {
  "sec-phy": defaultPhysicsTOC
};

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export function CurriculumProvider({ children }: { children: React.ReactNode }) {
  const [secondaryTextbooks, setSecondaryTextbooks] = useState<LearningItem[]>(defaultTextbooks);
  const [universityCourses, setUniversityCourses] = useState<LearningItem[]>(defaultCourses);
  const [tocs, setTocs] = useState<Record<string, TOCNode[]>>(defaultTocs);

  useEffect(() => {
    const storedTextbooks = localStorage.getItem("curriculum_textbooks");
    const storedCourses = localStorage.getItem("curriculum_courses");
    const storedTocs = localStorage.getItem("curriculum_tocs");

    if (storedTextbooks) setSecondaryTextbooks(JSON.parse(storedTextbooks));
    if (storedCourses) setUniversityCourses(JSON.parse(storedCourses));
    if (storedTocs) setTocs(JSON.parse(storedTocs));
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addTextbook = (item: LearningItem) => {
    const next = [...secondaryTextbooks, item];
    setSecondaryTextbooks(next);
    saveToStorage("curriculum_textbooks", next);
  };

  const removeTextbook = (id: string) => {
    const next = secondaryTextbooks.filter(t => t.id !== id);
    setSecondaryTextbooks(next);
    saveToStorage("curriculum_textbooks", next);
  };

  const addCourse = (item: LearningItem) => {
    const next = [...universityCourses, item];
    setUniversityCourses(next);
    saveToStorage("curriculum_courses", next);
  };

  const removeCourse = (id: string) => {
    const next = universityCourses.filter(c => c.id !== id);
    setUniversityCourses(next);
    saveToStorage("curriculum_courses", next);
  };

  const setTOC = (subjectId: string, toc: TOCNode[]) => {
    const next = { ...tocs, [subjectId]: toc };
    setTocs(next);
    saveToStorage("curriculum_tocs", next);
  };

  return (
    <CurriculumContext.Provider
      value={{
        secondaryTextbooks,
        universityCourses,
        tocs,
        addTextbook,
        removeTextbook,
        addCourse,
        removeCourse,
        setTOC
      }}
    >
      {children}
    </CurriculumContext.Provider>
  );
}

export function useCurriculum() {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error("useCurriculum must be used within a CurriculumProvider");
  }
  return context;
}
