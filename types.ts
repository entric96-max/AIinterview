
export interface User {
  name: string;
  email: string;
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
}

export type TechnicalSubject = "DBMS" | "CN" | "OOPS" | "DSA" | "OS" | "C++";

export type AppView = 'landing' | 'auth' | 'dashboard' | 'resume-interview' | 'mcq-test';