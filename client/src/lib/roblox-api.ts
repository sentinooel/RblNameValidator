// Roblox API utilities and types
export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
}

export interface RobloxUsernameResponse {
  data: RobloxUser[];
}

// Roblox username validation rules
export const ROBLOX_USERNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/,
  noConsecutiveUnderscores: /^(?!.*__).*$/,
  noStartEndUnderscore: /^(?!_).*(?<!_)$/,
};

export function validateRobloxUsername(username: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (username.length < ROBLOX_USERNAME_RULES.minLength) {
    errors.push(`Username must be at least ${ROBLOX_USERNAME_RULES.minLength} characters`);
  }

  if (username.length > ROBLOX_USERNAME_RULES.maxLength) {
    errors.push(`Username must be at most ${ROBLOX_USERNAME_RULES.maxLength} characters`);
  }

  if (!ROBLOX_USERNAME_RULES.pattern.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  if (!ROBLOX_USERNAME_RULES.noConsecutiveUnderscores.test(username)) {
    errors.push("Username cannot contain consecutive underscores");
  }

  if (!ROBLOX_USERNAME_RULES.noStartEndUnderscore.test(username)) {
    errors.push("Username cannot start or end with underscore");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
