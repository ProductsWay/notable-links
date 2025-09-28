import { describe, expect, it } from "bun:test";

import { app } from ".";

describe("Elysia", () => {
  it("return a response", async () => {
    const response = await app
      .handle(new Request("http://localhost/"))
      .then(async (res) => res.text());

    expect(response).toBe("Hello Elysia");
  });

  it("return a 404 response", async () => {
    const response = await app
      .handle(new Request("http://localhost/404"))
      .then(async (res) => res.text());

    expect(response).toBe("NOT_FOUND");
  });

  it("should access the swagger  ui", async () => {
    const response = await app
      .handle(new Request("http://localhost/swagger"))
      .then(async (res) => res.text());
    expect(response).toContain("Elysia API Documentation");
  });
});
