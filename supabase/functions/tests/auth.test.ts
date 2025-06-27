import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { requireAuth } from "../_shared/auth.ts";

// Simple test for auth module
Deno.test("requireAuth: throws 401 for missing auth header", async () => {
  const req = new Request("http://localhost:54321/test", {
    method: "POST",
  });

  try {
    await requireAuth(req);
    throw new Error("Should have thrown");
  } catch (error) {
    if (error instanceof Response) {
      assertEquals(error.status, 401);
      const data = await error.json();
      assertEquals(data.error, "No authorization header");
    } else {
      throw error;
    }
  }
});

Deno.test("requireAuth: throws 401 for missing token", async () => {
  const req = new Request("http://localhost:54321/test", {
    method: "POST",
    headers: {
      Authorization: "Bearer ",
    },
  });

  try {
    await requireAuth(req);
    throw new Error("Should have thrown");
  } catch (error) {
    if (error instanceof Response) {
      assertEquals(error.status, 401);
      const data = await error.json();
      assertEquals(data.error, "Invalid token");
    } else {
      throw error;
    }
  }
});