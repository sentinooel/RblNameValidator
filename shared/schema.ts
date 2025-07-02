import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const usernameChecks = pgTable("username_checks", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  isAvailable: boolean("is_available").notNull(),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

// Simple schema definitions to avoid type inference issues
export const insertUsernameCheckSchema = z.object({
  username: z.string(),
  isAvailable: z.boolean(),
});

export type InsertUsernameCheck = {
  username: string;
  isAvailable: boolean;
};

export type UsernameCheck = {
  id: number;
  username: string;
  isAvailable: boolean;
  checkedAt: Date;
};

export const usernameValidationSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .refine((val) => !/^_|_$/.test(val), "Username cannot start or end with underscore")
    .refine((val) => !/__/.test(val), "Username cannot contain consecutive underscores"),
});

export const bulkUsernameSchema = z.object({
  usernames: z.array(z.string()).min(1, "At least one username required"),
});
