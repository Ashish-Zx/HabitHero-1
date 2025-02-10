import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import type { User, InsertUser } from '@shared/schema';
import { db, pool } from './db';

class DatabaseStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresStore = pgSession(session);
    this.sessionStore = new PostgresStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();