import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { POINTS, type Progress } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Calculate total points earned for a progress record */
export function calcPoints(progress: Partial<Progress>): number {
  let pts = 0;
  if (progress.video_watched) pts += POINTS.VIDEO;
  if (progress.article_read) pts += POINTS.ARTICLE;
  if (progress.quiz_completed && progress.quiz_score != null) {
    pts += Math.round((progress.quiz_score / 100) * POINTS.QUIZ_MAX);
  }
  if (progress.practice_completed) pts += POINTS.PRACTICE;
  return pts;
}

/** Returns completion percentage (0-100) for a module progress */
export function moduleCompletion(progress: Partial<Progress> | null): number {
  if (!progress) return 0;
  const steps = [
    progress.video_watched,
    progress.article_read,
    progress.quiz_completed,
    progress.practice_completed,
  ];
  const done = steps.filter(Boolean).length;
  return Math.round((done / steps.length) * 100);
}

/**
 * Calculate the default unlock date for a module based on group's course_start_date.
 * Module 1 unlocks 7 days BEFORE course_start_date.
 * Module N unlocks on course_start_date + (N-2) * 7 days.
 */
export function defaultUnlockDate(courseStartDate: string, orderNumber: number): Date {
  const start = new Date(courseStartDate + "T00:00:00");
  const daysOffset = (orderNumber - 2) * 7; // module 1 = -7, module 2 = 0, module 3 = +7 ...
  const unlock = new Date(start);
  unlock.setDate(unlock.getDate() + daysOffset);
  return unlock;
}

/**
 * Check if a module is unlocked for a group.
 * Returns { unlocked: boolean, unlockDate: Date | null }
 */
export function getModuleUnlockStatus(
  orderNumber: number,
  courseStartDate: string | null,
  overrideDate: string | null,
): { unlocked: boolean; unlockDate: Date | null } {
  if (!courseStartDate) return { unlocked: false, unlockDate: null };
  const unlockDate = overrideDate
    ? new Date(overrideDate + "T00:00:00")
    : defaultUnlockDate(courseStartDate, orderNumber);
  return { unlocked: new Date() >= unlockDate, unlockDate };
}

/** Format a number with thousands separator (Hebrew locale) */
export function formatPoints(n: number): string {
  return n.toLocaleString("he-IL");
}

/**
 * Returns whether a student can access this module.
 * Admins always get true. Logic per access_mode:
 *  - open:   always accessible
 *  - locked: never accessible (for students)
 *  - auto:   accessible if EITHER previous module is 100% complete
 *            OR today is within 7 days of meeting_date
 */
export function isModuleAccessible({
  accessMode,
  meetingDate,
  isAdmin,
  isFirst,
  prevPct,
}: {
  accessMode: "locked" | "open" | "auto";
  meetingDate: string | null;
  isAdmin: boolean;
  isFirst: boolean;
  prevPct: number; // completion % of previous module (0 if first)
}): boolean {
  if (isAdmin) return true;
  if (accessMode === "open") return true;
  if (accessMode === "locked") return false;

  // auto: first module is always open
  if (isFirst) return true;

  // auto: previous module fully completed → unlock
  if (prevPct === 100) return true;

  // auto: within 7 days of meeting date → unlock
  if (meetingDate) {
    const unlock = new Date(meetingDate + "T00:00:00");
    unlock.setDate(unlock.getDate() - 7);
    if (new Date() >= unlock) return true;
  }

  return false;
}
