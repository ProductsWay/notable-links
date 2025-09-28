import { eq } from "drizzle-orm";
import { t } from "elysia";

import {
  AuthError,
  generateToken,
  generateUserId,
  hashPassword,
  verifyPassword,
  type UserPayload,
} from "./auth";
import { db } from "./db/connection";
import { users } from "./db/schema";

export type RegisterUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isAdmin: boolean;
  };
};

export const registerUser = async (
  input: RegisterUserInput,
): Promise<AuthResponse> => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new AuthError("Invalid email format", 400);
  }

  // Check if user already exists
  const existingUser = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new AuthError("User with this email already exists", 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(input.password);

  // Create user
  const userId = generateUserId();
  const userData = {
    id: userId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    hash: hashedPassword,
    isAdmin: 0, // Regular user by default
  };

  await db.insert(users).values(userData);

  // Return auth response
  const userPayload: UserPayload = {
    id: userId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    isAdmin: false,
  };

  const token = generateToken(userPayload);

  return {
    token,
    user: {
      id: userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      isAdmin: false,
    },
  };
};

export const signInUser = async (input: SignInInput): Promise<AuthResponse> => {
  // Find user by email
  const userResult = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      hash: users.hash,
      isAdmin: users.isAdmin,
    })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (userResult.length === 0) {
    throw new AuthError("Invalid email or password");
  }

  const user = userResult[0];

  // Verify password
  const isValidPassword = await verifyPassword(input.password, user.hash);
  if (!isValidPassword) {
    throw new AuthError("Invalid email or password");
  }

  // Generate token
  const userPayload: UserPayload = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isAdmin: user.isAdmin === 1,
  };

  const token = generateToken(userPayload);

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin === 1,
    },
  };
};

export const createAdminUser = async (
  input: RegisterUserInput,
): Promise<AuthResponse> => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new AuthError("Invalid email format", 400);
  }

  // Check if user already exists
  const existingUser = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new AuthError("User with this email already exists", 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(input.password);

  // Create admin user
  const userId = generateUserId();
  const userData = {
    id: userId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    hash: hashedPassword,
    isAdmin: 1, // Admin user
  };

  await db.insert(users).values(userData);

  // Return auth response
  const userPayload: UserPayload = {
    id: userId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    isAdmin: true,
  };

  const token = generateToken(userPayload);

  return {
    token,
    user: {
      id: userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      isAdmin: true,
    },
  };
};

// DTOs for Elysia validation
export const RegisterUserDTO = t.Object(
  {
    firstName: t.String({ minLength: 1, maxLength: 50 }),
    lastName: t.String({ minLength: 1, maxLength: 50 }),
    email: t.String(),
    password: t.String({ minLength: 8, maxLength: 100 }),
  },
  {
    description: "User registration data",
  },
);

export const SignInUserDTO = t.Object(
  {
    email: t.String(),
    password: t.String({ minLength: 1 }),
  },
  {
    description: "User sign-in data",
  },
);

export const AuthResponseDTO = t.Object(
  {
    token: t.String(),
    user: t.Object({
      id: t.String(),
      firstName: t.String(),
      lastName: t.String(),
      email: t.String(),
      isAdmin: t.Boolean(),
    }),
  },
  {
    description: "Authentication response",
  },
);