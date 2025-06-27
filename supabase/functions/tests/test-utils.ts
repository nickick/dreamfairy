// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";
import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.220.0/assert/mod.ts";

export { assert, assertEquals, assertRejects };

// Mock Supabase client for testing
export function createMockSupabaseClient(authResponse: any) {
  return {
    auth: {
      getUser: () => Promise.resolve(authResponse)
    }
  };
}

// Helper to create test requests
export function createTestRequest(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
) {
  const url = `http://localhost:54321/functions/v1${path}`;
  const headers = new Headers(options.headers || {});
  
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Request(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

// Helper to create authenticated request
export function createAuthenticatedRequest(
  path: string,
  token: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
) {
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
  
  return createTestRequest(path, { ...options, headers });
}

// Mock user for testing
export const mockUser = {
  id: "test-user-123",
  email: "test@example.com",
  role: "authenticated",
};

// Mock tokens
export const validToken = "valid-test-token";
export const invalidToken = "invalid-test-token";

// Helper to test auth failures
export async function testAuthFailures(
  handler: (req: Request) => Promise<Response>,
  path: string
) {
  // Test without auth header
  const noAuthReq = createTestRequest(path, { method: "POST", body: {} });
  const noAuthRes = await handler(noAuthReq);
  assertEquals(noAuthRes.status, 401);
  const noAuthData = await noAuthRes.json();
  assertEquals(noAuthData.error, "No authorization header");

  // Test with invalid token
  const invalidAuthReq = createAuthenticatedRequest(path, "", {
    method: "POST",
    body: {},
  });
  const invalidAuthRes = await handler(invalidAuthReq);
  assertEquals(invalidAuthRes.status, 401);
  const invalidAuthData = await invalidAuthRes.json();
  assertEquals(invalidAuthData.error, "No token provided");
}

// Mock fetch for external API calls
export function mockFetch(responses: Map<string, Response>) {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlString: string;
    if (typeof input === "string") {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else if (input instanceof Request) {
      urlString = input.url;
    } else {
      urlString = String(input);
    }
    
    for (const [pattern, response] of responses) {
      if (urlString.includes(pattern)) {
        return Promise.resolve(response.clone());
      }
    }
    
    return Promise.reject(new Error(`No mock response for URL: ${urlString}`));
  };
}

// Helper to create mock responses
export function createMockResponse(
  body: any,
  options: { status?: number; headers?: Record<string, string> } = {}
) {
  return new Response(JSON.stringify(body), {
    status: options.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}