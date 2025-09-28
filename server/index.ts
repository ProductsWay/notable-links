import { Elysia, t } from "elysia";

import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";

import { AuthError } from "./auth";
import logger from "./logger";
import { adminMiddleware, authMiddleware } from "./middleware";
import { SignInDTO, UserTokenDTO, signIn } from "./signIn";
import {
  AuthResponseDTO,
  RegisterUserDTO,
  SignInUserDTO,
  createAdminUser,
  registerUser,
  signInUser,
} from "./userService";

const port = process.env.PORT ?? 3000;
const app = new Elysia()
  .use(staticPlugin())
  .use(
    // @ts-expect-error No overload matches this call.
    swagger({
      documentation: {
        info: {
          title: "Notable Links API",
          description: "API for sharing and managing notable links",
          version: "1.0.0",
        },
        tags: [
          { name: "App", description: "General endpoints" },
          { name: "Auth", description: "Authentication endpoints" },
        ],
      },
    }),
  )
  // @ts-expect-error No overload matches this call.
  .use(cors())
  .onError(({ code, error, set }) => {
    logger.error(error);
    
    if (error instanceof AuthError) {
      set.status = error.statusCode;
      return {
        error: error.message,
        code: error.statusCode,
      };
    }
    
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "Invalid input data",
        code: 400,
      };
    }
    
    if (code === "NOT_FOUND") {
      set.status = 404;
      return "NOT_FOUND";
    }
    
    set.status = 500;
    return {
      error: "Internal server error",
      code: 500,
    };
  })
  .get("/", () => "Hello Elysia", {
    response: t.String({
      description: "Returns a string",
    }),
    detail: {
      description: "The root endpoint",
      tags: ["App"],
    },
  })
  .post("/auth/register", async ({ body }) => registerUser(body), {
    body: RegisterUserDTO,
    response: AuthResponseDTO,
    detail: {
      description: "Register a new user",
      tags: ["Auth"],
    },
  })
  .post("/auth/sign-in", async ({ body }) => signInUser(body), {
    body: SignInUserDTO,
    response: AuthResponseDTO,
    detail: {
      description: "Sign in with email and password",
      tags: ["Auth"],
    },
  })
  .post("/auth/admin/register", async ({ body }) => createAdminUser(body), {
    body: RegisterUserDTO,
    response: AuthResponseDTO,
    detail: {
      description: "Register a new admin user (for setup purposes)",
      tags: ["Auth"],
    },
  })
  .post("/sign-in", ({ body }) => signIn(body), {
    body: SignInDTO,
    response: UserTokenDTO,
    detail: {
      description: "Legacy sign in with username and password (deprecated)",
      tags: ["Auth"],
    },
  })
  .group("/api", (app) =>
    app
      .use(authMiddleware())
      .get("/profile", ({ user }) => ({
        message: "Profile accessed successfully",
        user,
      }), {
        detail: {
          description: "Get current user profile (requires authentication)",
          tags: ["Auth"],
        },
      })
      .group("/admin", (app) =>
        app
          .use(adminMiddleware())
          .get("/dashboard", ({ user }) => ({
            message: "Admin dashboard accessed successfully",
            user,
            adminFeatures: [
              "User management",
              "Link verification",
              "System settings",
            ],
          }), {
            detail: {
              description: "Access admin dashboard (requires admin role)",
              tags: ["Auth"],
            },
          })
      )
  )
  .listen(port);

logger.info(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);

export { app };
export type App = typeof app;
