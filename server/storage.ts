import type { User, InsertUser, Habit, Completion } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private completions: Map<number, Completion>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.completions = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getHabitById(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async getHabitsByUserId(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      (habit) => habit.userId === userId,
    );
  }

  async createHabit(habit: Omit<Habit, "id" | "currentStreak" | "bestStreak">): Promise<Habit> {
    const id = this.currentId++;
    const newHabit: Habit = {
      ...habit,
      id,
      currentStreak: 0,
      bestStreak: 0,
    };
    this.habits.set(id, newHabit);
    return newHabit;
  }

  async completeHabit(habitId: number, userId: number): Promise<Completion> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completion: Completion = {
      id: this.currentId++,
      habitId,
      userId,
      date: today,
    };
    this.completions.set(completion.id, completion);

    // Update streak
    const habit = await this.getHabitById(habitId);
    if (habit) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const hasYesterdayCompletion = Array.from(this.completions.values()).some(
        (c) =>
          c.habitId === habitId &&
          c.date.getTime() === yesterday.getTime()
      );

      const hasTodayCompletion = Array.from(this.completions.values()).some(
        (c) =>
          c.habitId === habitId &&
          c.date.getTime() === today.getTime()
      );

      if (!hasTodayCompletion) {
        const newStreak = hasYesterdayCompletion ? habit.currentStreak + 1 : 1;
        const updatedHabit: Habit = {
          ...habit,
          currentStreak: newStreak,
          bestStreak: Math.max(habit.bestStreak, newStreak),
        };
        this.habits.set(habitId, updatedHabit);
      }
    }

    return completion;
  }
}

export const storage = new MemStorage();