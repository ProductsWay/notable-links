import { Elysia } from "elysia";

import { AuthError, verifyToken } from "./auth";

export type AuthContext = {
  user: {
    userId: string;
    email: string;
    isAdmin: boolean;
  };
};

export const authMiddleware = () =>
  new Elysia({ name: "auth" })
    .derive(({ headers }) => {
      const { authorization } = headers;
      
      if (!authorization || !authorization.startsWith("Bearer ")) {
        throw new AuthError("Authorization token required");
      }

      const token = authorization.substring(7);
      
      try {
        const payload = verifyToken(token);

        return {
          user: {
            userId: payload.userId,
            email: payload.email,
            isAdmin: payload.isAdmin,
          },
        };
      } catch (error) {
        throw new AuthError("Invalid or expired token");
      }
    });

export const adminMiddleware = () =>
  new Elysia({ name: "admin" })
    .use(authMiddleware())
    .derive(({ user }) => {
      if (!user.isAdmin) {
        throw new AuthError("Admin access required", 403);
      }

      return { user };
    });