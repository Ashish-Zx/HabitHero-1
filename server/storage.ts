import type { User, InsertUser, Habit, Completion } from "@shared/schema";
import { users, habits, completions } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getHabitById(id: number): Promise<Habit | undefined>;
  getHabitsByUserId(userId: number): Promise<Habit[]>;
  createHabit(habit: Omit<Habit, "id" | "currentStreak" | "bestStreak">): Promise<Habit>;
  completeHabit(habitId: number, userId: number): Promise<Completion>;
  deleteHabit(habitId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getHabitById(id: number): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit;
  }

  async getHabitsByUserId(userId: number): Promise<Habit[]> {
    return db.select().from(habits).where(eq(habits.userId, userId));
  }

  async createHabit(habit: Omit<Habit, "id" | "currentStreak" | "bestStreak">): Promise<Habit> {
    const [newHabit] = await db
      .insert(habits)
      .values({
        ...habit,
        currentStreak: 0,
        bestStreak: 0,
      })
      .returning();
    return newHabit;
  }

  async completeHabit(habitId: number, userId: number): Promise<Completion> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for existing completion
    const [existingCompletion] = await db
      .select()
      .from(completions)
      .where(eq(completions.habitId, habitId))
      .where(eq(completions.date, today.toISOString().split('T')[0]));

    if (existingCompletion) {
      return existingCompletion;
    }

    // Create new completion
    const [completion] = await db
      .insert(completions)
      .values({
        habitId,
        userId,
        date: today.toISOString().split('T')[0],
      })
      .returning();

    // Get habit details
    const habit = await this.getHabitById(habitId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    // Calculate streak
    const completionHistory = await db
      .select()
      .from(completions)
      .where(eq(completions.habitId, habitId))
      .orderBy(completions.date);

    let currentStreak = 0;
    let bestStreak = habit.bestStreak;

    if (completionHistory.length > 0) {
      // Sort completions by date
      const dates = completionHistory.map(c => new Date(c.date));
      dates.sort((a, b) => a.getTime() - b.getTime());

      // Calculate current streak
      currentStreak = 1; // Start with today's completion
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      for (let i = dates.length - 2; i >= 0; i--) {
        const currentDate = dates[i];
        const nextDate = dates[i + 1];

        // Check if dates are consecutive
        const diffInDays = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Update best streak if current streak is higher
      bestStreak = Math.max(bestStreak, currentStreak);
    }

    // Update habit streaks
    await db
      .update(habits)
      .set({
        currentStreak,
        bestStreak,
      })
      .where(eq(habits.id, habitId));

    return completion;
  }

  async deleteHabit(habitId: number): Promise<void> {
    await db.delete(habits).where(eq(habits.id, habitId));
  }
}

export const storage = new DatabaseStorage();