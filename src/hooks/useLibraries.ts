"use client";

import { useState, useEffect } from "react";

export type Library = {
  id: string;
  name: string;
  subjectId: string;
  topicIds: string[];
  createdAt: number;
  updatedAt: number;
  isPapers?: boolean;
};

export function useLibraries() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("studentbud_libraries");
    if (stored) {
      try {
        setLibraries(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse libraries", err);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveToStorage = (libs: Library[]) => {
    localStorage.setItem("studentbud_libraries", JSON.stringify(libs));
  };

  const addLibrary = (library: Omit<Library, "id" | "createdAt" | "updatedAt">) => {
    const newLibrary: Library = {
      ...library,
      id: "lib-" + Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...libraries, newLibrary];
    setLibraries(updated);
    saveToStorage(updated);
    return newLibrary;
  };

  const updateLibrary = (id: string, updates: Partial<Omit<Library, "id" | "createdAt" | "updatedAt">>) => {
    const updated = libraries.map((lib) => {
      if (lib.id === id) {
        return { ...lib, ...updates, updatedAt: Date.now() };
      }
      return lib;
    });
    setLibraries(updated);
    saveToStorage(updated);
  };

  const deleteLibrary = (id: string) => {
    const updated = libraries.filter((lib) => lib.id !== id);
    setLibraries(updated);
    saveToStorage(updated);
  };

  const getLibrariesBySubject = (subjectId: string) => {
    return libraries.filter((lib) => lib.subjectId === subjectId);
  };

  const getLibraryById = (id: string) => {
    return libraries.find((lib) => lib.id === id);
  };

  return {
    libraries,
    isLoaded,
    addLibrary,
    updateLibrary,
    deleteLibrary,
    getLibrariesBySubject,
    getLibraryById,
  };
}
