import { usernameChecks, type UsernameCheck, type InsertUsernameCheck } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private usernameChecks: Map<number, UsernameCheck>;
  private currentUserId: number;
  private currentCheckId: number;

  constructor() {
    this.users = new Map();
    this.usernameChecks = new Map();
    this.currentUserId = 1;
    this.currentCheckId = 1;
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveUsernameCheck(insertCheck: InsertUsernameCheck): Promise<UsernameCheck> {
    const id = this.currentCheckId++;
    const check: UsernameCheck = {
      ...insertCheck,
      id,
      checkedAt: new Date(),
    };
    this.usernameChecks.set(id, check);
    return check;
  }

  async getRecentChecks(limit = 10): Promise<UsernameCheck[]> {
    const checks = Array.from(this.usernameChecks.values())
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
      .slice(0, limit);
    return checks;
  }

  async getUsageStats(): Promise<{
    totalChecks: number;
    availableCount: number;
    takenCount: number;
    avgResponseTime: number;
  }> {
    const checks = Array.from(this.usernameChecks.values());
    const totalChecks = checks.length;
    const availableCount = checks.filter(c => c.isAvailable).length;
    const takenCount = checks.filter(c => !c.isAvailable).length;
    
    return {
      totalChecks,
      availableCount,
      takenCount,
      avgResponseTime: 0.8, // Mock average response time
    };
  }
}

export const storage = new MemStorage();
