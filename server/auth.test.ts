import { describe, expect, it } from "bun:test";

import { app } from ".";

describe("Authentication", () => {
  const generateUniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  
  const testUser = {
    firstName: "John",
    lastName: "Doe",
    password: "securePassword123",
  };

  it("should register a new user", async () => {
    const email = generateUniqueEmail();
    const response = await app
      .handle(
        new Request("http://localhost/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...testUser,
            email,
          }),
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("token");
    expect(response.data).toHaveProperty("user");
    expect(response.data.user.email).toBe(email);
    expect(response.data.user.firstName).toBe(testUser.firstName);
    expect(response.data.user.lastName).toBe(testUser.lastName);
    expect(response.data.user.isAdmin).toBe(false);
    expect(typeof response.data.token).toBe("string");
  });

  it("should not register user with duplicate email", async () => {
    const email = generateUniqueEmail();
    
    // First registration
    await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testUser,
          email,
        }),
      })
    );

    // Attempt duplicate registration
    const response = await app
      .handle(
        new Request("http://localhost/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...testUser,
            email,
          }),
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(409);
    expect(response.data).toHaveProperty("error");
  });

  it("should sign in with valid credentials", async () => {
    const email = generateUniqueEmail();
    
    // Register user first
    await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testUser,
          email,
        }),
      })
    );

    // Sign in
    const response = await app
      .handle(
        new Request("http://localhost/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: testUser.password,
          }),
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("token");
    expect(response.data).toHaveProperty("user");
    expect(response.data.user.email).toBe(email);
    expect(typeof response.data.token).toBe("string");
  });

  it("should not sign in with invalid email", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "somepassword",
          }),
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(401);
    expect(response.data).toHaveProperty("error");
  });

  it("should not sign in with invalid password", async () => {
    const email = generateUniqueEmail();
    
    // Register user first
    await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testUser,
          email,
        }),
      })
    );

    // Try sign in with wrong password
    const response = await app
      .handle(
        new Request("http://localhost/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: "wrongpassword",
          }),
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(401);
    expect(response.data).toHaveProperty("error");
  });

  it("should validate registration input", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: "",
            lastName: "Doe",
            email: "invalid-email",
            password: "123", // Too short
          }),
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty("error");
  });

  it("should access protected profile route with valid token", async () => {
    const email = generateUniqueEmail();
    
    // Register user
    const registerResponse = await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testUser,
          email,
        }),
      })
    );
    const { token } = await registerResponse.json() ;

    // Access protected route
    const response = await app
      .handle(
        new Request("http://localhost/api/profile", {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`,
          },
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("message");
    expect(response.data).toHaveProperty("user");
    expect(response.data.user.email).toBe(email);
  });

  it("should reject access to protected route without token", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/profile", {
          method: "GET",
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(401);
    expect(response.data).toHaveProperty("error");
  });

  it("should reject access to admin route for regular user", async () => {
    const email = generateUniqueEmail();
    
    // Register regular user
    const registerResponse = await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testUser,
          email,
        }),
      })
    );
    const { token } = await registerResponse.json() ;

    // Try to access admin route
    const response = await app
      .handle(
        new Request("http://localhost/api/admin/dashboard", {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`,
          },
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(403);
    expect(response.data).toHaveProperty("error");
  });

  it("should allow admin access to admin route", async () => {
    const email = generateUniqueEmail();
    
    // Register admin user
    const registerResponse = await app.handle(
      new Request("http://localhost/auth/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testUser,
          email,
        }),
      })
    );
    const { token } = await registerResponse.json() ;

    // Access admin route
    const response = await app
      .handle(
        new Request("http://localhost/api/admin/dashboard", {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`,
          },
        })
      )
      .then(async (res) => ({
        status: res.status,
        data: await res.json(),
      }));

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("message");
    expect(response.data).toHaveProperty("adminFeatures");
    expect(response.data.user.isAdmin).toBe(true);
  });
});