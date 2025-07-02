import { usernameChecks, type UsernameCheck, type InsertUsernameCheck } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  // Username check methods
  saveUsernameCheck(check: InsertUsernameCheck): Promise<UsernameCheck>;
  getRecentChecks(limit?: number): Promise<UsernameCheck[]>;
  getUsageStats(): Promise<{
    totalChecks: number;
    availableCount: number;
    takenCount: number;
    avgResponseTime: number;
  }>;
  clearUsernameChecks(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<any | undefined> {
    // User functionality not implemented in current schema
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    // User functionality not implemented in current schema
    return undefined;
  }

  async createUser(insertUser: any): Promise<any> {
    // User functionality not implemented in current schema
    return insertUser;
  }

  async saveUsernameCheck(insertCheck: InsertUsernameCheck): Promise<UsernameCheck> {
    const [check] = await db
      .insert(usernameChecks)
      .values(insertCheck)
      .returning();
    return check;
  }

  async getRecentChecks(limit = 10): Promise<UsernameCheck[]> {
    const checks = await db
      .select()
      .from(usernameChecks)
      .orderBy(desc(usernameChecks.checkedAt))
      .limit(limit);
    return checks;
  }

  async getUsageStats(): Promise<{
    totalChecks: number;
    availableCount: number;
    takenCount: number;
    avgResponseTime: number;
  }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(usernameChecks);
    
    const [availableResult] = await db
      .select({ count: count() })
      .from(usernameChecks)
      .where(eq(usernameChecks.isAvailable, true));
    
    const [takenResult] = await db
      .select({ count: count() })
      .from(usernameChecks)
      .where(eq(usernameChecks.isAvailable, false));
    
    return {
      totalChecks: totalResult.count,
      availableCount: availableResult.count,
      takenCount: takenResult.count,
      avgResponseTime: 0.8, // Mock average response time
    };
  }

  async clearUsernameChecks(): Promise<void> {
    await db.delete(usernameChecks);
  }
}

export const storage = new DatabaseStorage();
