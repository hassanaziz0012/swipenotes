import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db/client";
import { sessions, type Session } from "../db/models/session";

export interface DayStreakData {
  date: Date;
  dayAbbreviation: string;
  dayNumber: number;
  hasStudied: boolean;
}

/**
 * Normalizes a date to midnight (start of day) for consistent comparisons
 */
function normalizeToDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Gets the day abbreviation for a given date
 */
function getDayAbbreviation(date: Date): string {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return days[date.getDay()];
}

/**
 * Fetches completed sessions within a date range for a given user
 */
export async function getCompletedSessionsInRange(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<Session[]> {
  const start = normalizeToDate(startDate);
  const end = normalizeToDate(endDate);
  end.setHours(23, 59, 59, 999);

  const result = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.isActive, false),
        gte(sessions.startedAt, start),
        lte(sessions.startedAt, end)
      )
    );

  return result;
}

/**
 * Checks if any completed session exists on a specific date
 */
export function hasCompletedSessionOnDate(
  completedSessions: Session[],
  date: Date
): boolean {
  const targetDate = normalizeToDate(date);

  return completedSessions.some((session) => {
    const sessionDate = normalizeToDate(new Date(session.startedAt));
    return sessionDate.getTime() === targetDate.getTime();
  });
}

/**
 * Calculates the current streak (consecutive days with completed sessions ending today or yesterday)
 */
export async function calculateCurrentStreak(userId: number): Promise<number> {
  const today = normalizeToDate(new Date());
  let streak = 0;
  let checkDate = new Date(today);

  // Look back up to 365 days to find the streak
  const yearAgo = new Date(today);
  yearAgo.setDate(yearAgo.getDate() - 365);

  const completedSessions = await getCompletedSessionsInRange(
    userId,
    yearAgo,
    today
  );

  // First check if there's a session today
  const hasSessionToday = hasCompletedSessionOnDate(completedSessions, today);

  // If no session today, check yesterday as the starting point
  if (!hasSessionToday) {
    checkDate.setDate(checkDate.getDate() - 1);
    const hasSessionYesterday = hasCompletedSessionOnDate(
      completedSessions,
      checkDate
    );
    if (!hasSessionYesterday) {
      return 0; // No streak if no session today or yesterday
    }
  }

  // Count consecutive days backwards
  while (hasCompletedSessionOnDate(completedSessions, checkDate)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * Gets the streak data for the last 7 days starting from today
 */
export async function getWeekStreakData(
  userId: number
): Promise<DayStreakData[]> {
  const today = normalizeToDate(new Date());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const completedSessions = await getCompletedSessionsInRange(
    userId,
    weekAgo,
    today
  );

  const weekData: DayStreakData[] = [];

  // Generate data for each of the last 7 days (oldest first)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    weekData.push({
      date,
      dayAbbreviation: getDayAbbreviation(date),
      dayNumber: date.getDate(),
      hasStudied: hasCompletedSessionOnDate(completedSessions, date),
    });
  }

  return weekData;
}

/**
 * Gets the streak data for a specific month
 */
export async function getMonthStreakData(
  userId: number,
  year: number,
  month: number // 0-indexed (0 = January)
): Promise<DayStreakData[]> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0); // Last day of the month

  const completedSessions = await getCompletedSessionsInRange(
    userId,
    firstDay,
    lastDay
  );

  const monthData: DayStreakData[] = [];
  const daysInMonth = lastDay.getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    monthData.push({
      date,
      dayAbbreviation: getDayAbbreviation(date),
      dayNumber: day,
      hasStudied: hasCompletedSessionOnDate(completedSessions, date),
    });
  }

  return monthData;
}
