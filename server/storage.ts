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
      .where(eq(completions.date, today));

    if (existingCompletion) {
      return existingCompletion;
    }

    // Create new completion
    const [completion] = await db
      .insert(completions)
      .values({
        habitId,
        userId,
        date: today,
      })
      .returning();

    // Update streak
    const habit = await this.getHabitById(habitId);
    if (habit) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const [yesterdayCompletion] = await db
        .select()
        .from(completions)
        .where(eq(completions.habitId, habitId))
        .where(eq(completions.date, yesterday));

      const newStreak = yesterdayCompletion ? habit.currentStreak + 1 : 1;
      await db
        .update(habits)
        .set({
          currentStreak: newStreak,
          bestStreak: Math.max(habit.bestStreak, newStreak),
        })
        .where(eq(habits.id, habitId));
    }

    return completion;
  }
}

export const storage = new DatabaseStorage();