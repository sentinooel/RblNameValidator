import { validateRobloxUsername } from "./roblox-api";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
}

export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      errors: ["Username is required"],
    };
  }

  const trimmedUsername = username.trim();
  const robloxValidation = validateRobloxUsername(trimmedUsername);

  if (!robloxValidation.isValid) {
    return {
      isValid: false,
      errors: robloxValidation.errors,
      suggestions: generateUsernameSuggestions(trimmedUsername),
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

export function generateUsernameSuggestions(username: string): string[] {
  const suggestions: string[] = [];
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '');

  if (cleanUsername.length >= 3) {
    // Add numbers to the end
    for (let i = 1; i <= 3; i++) {
      const suggestion = cleanUsername + Math.floor(Math.random() * 1000);
      if (suggestion.length <= 20) {
        suggestions.push(suggestion);
      }
    }

    // Add common suffixes
    const suffixes = ['123', '2024', 'Pro', 'Gaming'];
    for (const suffix of suffixes) {
      const suggestion = cleanUsername + suffix;
      if (suggestion.length <= 20) {
        suggestions.push(suggestion);
      }
    }
  }

  return suggestions.slice(0, 5); // Return max 5 suggestions
}

export function sanitizeUsernames(input: string): string[] {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 10); // Max 10 usernames
}
