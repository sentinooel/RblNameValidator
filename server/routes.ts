import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { usernameValidationSchema, bulkUsernameSchema } from "@shared/schema";
import { z } from "zod";

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

async function checkRobloxUsername(username: string): Promise<boolean> {
  try {
    // Check if username exists by trying to get user info
    const response = await fetch(`https://users.roblox.com/v1/usernames/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false
      })
    });

    if (!response.ok) {
      throw new Error(`Roblox API error: ${response.status}`);
    }

    const data = await response.json();
    
    // If the API returns data for this username, it's taken
    // If it returns empty data, it's available
    return !data.data || data.data.length === 0;
  } catch (error) {
    console.error('Error checking Roblox username:', error);
    throw new Error('Failed to check username availability');
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Check single username
  app.post("/api/username/check", async (req, res) => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ 
          message: "Rate limit exceeded. Please wait before making more requests." 
        });
      }

      const { username } = usernameValidationSchema.parse(req.body);
      
      const isAvailable = await checkRobloxUsername(username);
      
      // Save the check to storage
      const check = await storage.saveUsernameCheck({
        username,
        isAvailable,
      });
      
      res.json({
        username,
        isAvailable,
        timestamp: check.checkedAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid username format",
          errors: error.errors 
        });
      }
      
      console.error('Username check error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to check username" 
      });
    }
  });

  // Bulk username check
  app.post("/api/username/bulk-check", async (req, res) => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ 
          message: "Rate limit exceeded. Please wait before making more requests." 
        });
      }

      const { usernames } = bulkUsernameSchema.parse(req.body);
      
      // Validate each username
      const validatedUsernames = usernames.map(username => 
        usernameValidationSchema.parse({ username }).username
      );
      
      const results = [];
      
      // Process usernames with delay to respect rate limits
      for (const username of validatedUsernames) {
        try {
          const isAvailable = await checkRobloxUsername(username);
          
          const check = await storage.saveUsernameCheck({
            username,
            isAvailable,
          });
          
          results.push({
            username,
            isAvailable,
            timestamp: check.checkedAt,
          });
          
          // Add delay between requests to avoid hitting Roblox rate limits
          if (validatedUsernames.indexOf(username) < validatedUsernames.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          results.push({
            username,
            isAvailable: null,
            error: error instanceof Error ? error.message : "Failed to check username",
            timestamp: new Date(),
          });
        }
      }
      
      res.json({ results });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input",
          errors: error.errors 
        });
      }
      
      console.error('Bulk check error:', error);
      res.status(500).json({ 
        message: "Failed to process bulk check" 
      });
    }
  });

  // Get recent checks
  app.get("/api/username/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recentChecks = await storage.getRecentChecks(limit);
      res.json(recentChecks);
    } catch (error) {
      console.error('Recent checks error:', error);
      res.status(500).json({ message: "Failed to get recent checks" });
    }
  });

  // Get usage stats
  app.get("/api/username/stats", async (req, res) => {
    try {
      const stats = await storage.getUsageStats();
      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: "Failed to get usage stats" });
    }
  });

  // API status endpoint
  app.get("/api/status", (req, res) => {
    res.json({ 
      status: "Connected",
      timestamp: new Date().toISOString() 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
