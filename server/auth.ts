import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET ?? "notable-links-secret-key";
const SALT_ROUNDS = 12;

export type UserPayload = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

export type TokenPayload = {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
};

export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(password, hash);

export const generateToken = (user: UserPayload): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, JWT_SECRET) as TokenPayload;

export const generateUserId = (): string => uuidv4();

export class AuthError extends Error {
  constructor(message: string, public statusCode = 401) {
    super(message);
    this.name = "AuthError";
  }
}