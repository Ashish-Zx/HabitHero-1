import { Database } from 'better-sqlite3';
import SqliteStore from 'better-sqlite3-session-store';
import session from 'express-session';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import type { User, InsertUser } from '@shared/schema';

class DatabaseStorage {
  db: Database;
  sessionStore: session.Store;

  constructor() {
    this.db = new Database('db.sqlite');
    const Store = SqliteStore(session);
    this.sessionStore = new Store({
      client: this.db,
      expired: {
        clear: true,
        intervalMs: 900000
      }
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const db = drizzle(this.db);
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = drizzle(this.db);
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async createUser(user: InsertUser): Promise<User> {
    const db = drizzle(this.db);
    const result = db.insert(users).values(user).run();
    return { ...user, id: result.lastInsertRowid as number };
  }
}

export const storage = new DatabaseStorage();