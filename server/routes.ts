import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { usernameValidationSchema, bulkUsernameSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'));
    }
  },
});

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
    // Use Roblox auth validation endpoint for more accurate results
    const response = await fetch(`https://auth.roblox.com/v1/usernames/validate?username=${encodeURIComponent(username)}&birthday=2001-09-11`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Roblox API error: ${response.status}`);
    }

    const data = await response.json();
    
    // The auth API returns validation info
    // code: 0 means username is available
    // code: 1 means username is taken
    // code: 2 means username is invalid/filtered
    return data.code === 0;
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
      const validatedUsernames = [];
      const validationErrors = [];
      
      for (const username of usernames) {
        try {
          const validated = usernameValidationSchema.parse({ username }).username;
          validatedUsernames.push(validated);
        } catch (error) {
          validationErrors.push({
            username,
            error: "Invalid username format",
          });
        }
      }
      
      const results = [];
      let processed = 0;
      
      // Add validation errors to results
      results.push(...validationErrors.map(err => ({
        username: err.username,
        isAvailable: null,
        error: err.error,
        timestamp: new Date(),
      })));
      
      // Process valid usernames with delay to respect rate limits
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
          
          processed++;
          
          // Send progress update for large batches
          if (validatedUsernames.length > 10 && processed % 10 === 0) {
            // In a real implementation, you might use WebSockets for real-time progress
            console.log(`Processed ${processed}/${validatedUsernames.length} usernames`);
          }
          
          // Add delay between requests to avoid hitting Roblox rate limits
          if (processed < validatedUsernames.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          results.push({
            username,
            isAvailable: null,
            error: error instanceof Error ? error.message : "Failed to check username",
            timestamp: new Date(),
          });
          processed++;
        }
      }
      
      res.json({ 
        results,
        summary: {
          total: usernames.length,
          processed: validatedUsernames.length,
          errors: validationErrors.length,
          available: results.filter(r => r.isAvailable === true).length,
          taken: results.filter(r => r.isAvailable === false).length,
        }
      });
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

  // File upload for bulk username check
  app.post("/api/username/bulk-check-file", upload.single('file'), async (req, res) => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ 
          message: "Rate limit exceeded. Please wait before making more requests." 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          message: "No file uploaded" 
        });
      }

      // Parse the uploaded file
      const fileContent = req.file.buffer.toString('utf-8');
      const usernames = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 10000); // Limit to 10,000 usernames for safety

      if (usernames.length === 0) {
        return res.status(400).json({ 
          message: "No valid usernames found in file" 
        });
      }

      // Process the usernames using the same logic as bulk-check
      const validatedUsernames = [];
      const validationErrors = [];
      
      for (const username of usernames) {
        try {
          const validated = usernameValidationSchema.parse({ username }).username;
          validatedUsernames.push(validated);
        } catch (error) {
          validationErrors.push({
            username,
            error: "Invalid username format",
          });
        }
      }
      
      const results = [];
      let processed = 0;
      
      // Add validation errors to results
      results.push(...validationErrors.map(err => ({
        username: err.username,
        isAvailable: null,
        error: err.error,
        timestamp: new Date(),
      })));
      
      // Process valid usernames with delay to respect rate limits
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
          
          processed++;
          
          // Add delay between requests to avoid hitting Roblox rate limits
          if (processed < validatedUsernames.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          results.push({
            username,
            isAvailable: null,
            error: error instanceof Error ? error.message : "Failed to check username",
            timestamp: new Date(),
          });
          processed++;
        }
      }
      
      res.json({ 
        results,
        summary: {
          total: usernames.length,
          processed: validatedUsernames.length,
          errors: validationErrors.length,
          available: results.filter(r => r.isAvailable === true).length,
          taken: results.filter(r => r.isAvailable === false).length,
        },
        filename: req.file.originalname,
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process file" 
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
