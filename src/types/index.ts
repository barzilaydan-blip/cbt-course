export type UserRole = "admin" | "student";

export type ApprovedEmailStatus = "active" | "pending_link" | "used" | "revoked";
export type ApprovedEmailSource = "manual" | "csv_import" | "smoove_webhook" | "zapier";

export interface ApprovedEmail {
  id: string;
  email: string;
  status: ApprovedEmailStatus;
  source: ApprovedEmailSource;
  smoove_contact_id: string | null;
  linked_user_id: string | null;
  notes: string | null;
  approved_at: string;
  used_at: string | null;
  created_at: string;
}

export type ResourceCategory =
  | "שאלונים"
  | "מצגות"
  | "מאמרים"
  | "ספרים"
  | "טפסי עבודה"
  | "קישורים לסרטונים";

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "שאלונים",
  "מצגות",
  "מאמרים",
  "ספרים",
  "טפסי עבודה",
  "קישורים לסרטונים",
];

export interface Group {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  total_points: number;
  group_id: string | null;
  phone: string | null;
  profession: string | null;
  created_at: string;
}

export interface Module {
  id: string;
  order_number: number;
  title_he: string;
  description_he: string | null;
  video_url: string | null;
  article_url: string | null;
  podcast_url: string | null;
  weekly_challenge: string | null;
  weekly_challenge_url: string | null;
  meeting_date: string | null;
  access_mode: "locked" | "open" | "auto";
  is_published: boolean;
  created_at: string;
}

export interface CourseSettings {
  id: number;
  zoom_url: string | null;
  syllabus_url: string | null;
  meeting_time: string | null;
  meeting_day_he: string | null;
}

export interface QuizQuestion {
  question_he: string;
  options_he: string[];
  correct_index: number;
  explanation_he: string;
}

export interface Quiz {
  id: string;
  module_id: string;
  questions: QuizQuestion[];
}

export interface Progress {
  id: string;
  user_id: string;
  module_id: string;
  video_watched: boolean;
  article_read: boolean;
  quiz_completed: boolean;
  quiz_score: number | null;
  practice_completed: boolean;
  exercise_points: number;
  points_earned: number;
  completed_at: string | null;
  created_at: string;
}

export type ExerciseSubmissionStatus = "submitted" | "reviewed";

export interface ExerciseSubmission {
  id: string;
  user_id: string;
  module_id: string;
  answers: Record<string, string>;
  status: ExerciseSubmissionStatus;
  admin_feedback: string | null;
  points_awarded: number;
  ai_draft_feedback: string | null;
  ai_suggested_points: number | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  profiles?: { name: string; email: string } | null;
  modules?: { order_number: number; title_he: string } | null;
}

export interface Resource {
  id: string;
  title_he: string;
  description_he: string | null;
  category: ResourceCategory;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  module_id: string | null;
  is_published: boolean;
  created_at: string;
}

export interface DynamicFormulation {
  id: string;
  user_id: string;
  presenting_problem: string | null;
  triggering_situation: string | null;
  automatic_thoughts: string | null;
  emotions: string | null;
  physical_sensations: string | null;
  behaviors: string | null;
  core_beliefs_self: string | null;
  core_beliefs_others: string | null;
  core_beliefs_world: string | null;
  intermediate_beliefs: string | null;
  safety_behaviors: string | null;
  avoidance_patterns: string | null;
  cognitive_distortions: string[] | null;
  behavioral_experiments: BehavioralExperiment[] | null;
  therapy_goals: string | null;
  developmental_history: string | null;
  updated_at: string;
  created_at: string;
}

export interface BehavioralExperiment {
  hypothesis: string;
  experiment: string;
  result: string;
  conclusion: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Group chat message (stored in DB)
export interface GroupMessage {
  id: string;
  user_id: string;
  group_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  // joined from profiles
  profiles?: { name: string; email: string } | null;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  module_id: string;
  conversation: ChatMessage[];
  ai_feedback: string | null;
  created_at: string;
}

export type QuestionType = "technical" | "professional";
export type QuestionStatus = "pending" | "answered";

export interface Question {
  id: string;
  user_id: string;
  group_id: string | null;
  type: QuestionType;
  content: string;
  status: QuestionStatus;
  admin_reply: string | null;
  answered_at: string | null;
  created_at: string;
  profiles?: { name: string; email: string } | null;
}

// Points per activity
export const POINTS = {
  VIDEO: 10,
  ARTICLE: 10,
  QUIZ_MAX: 30,
  PRACTICE: 20,
} as const;
