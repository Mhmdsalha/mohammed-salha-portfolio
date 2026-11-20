import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { middleware } from "@/middleware";
import { TEST_SECRET, forgedTokens, validToken } from "./helpers";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : undefined
  });
}

function isLoginRedirect(response: Response) {
  return (
    response.status === 307 &&
    new URL(response.headers.get("location") ?? "").pathname === "/dashboard/login"
  );
}

const originalSecret = process.env.SESSION_SECRET;
beforeAll(() => {
  process.env.SESSION_SECRET = TEST_SECRET;
});
afterAll(() => {
  process.env.SESSION_SECRET = originalSecret;
});

describe("middleware dashboard gate (D1-1)", () => {
  const protectedPaths = ["/dashboard", "/dashboard/projects", "/dashboard/settings"];

  it("redirects to login without a cookie", async () => {
    for (const path of protectedPaths) {
      expect(isLoginRedirect(await middleware(request(path))), path).toBe(true);
    }
  });

  it("redirects every forged session cookie to login and clears it", async () => {
    for (const [name, token] of Object.entries(await forgedTokens())) {
      const response = await middleware(request("/dashboard", `dashboard_session=${token}`));
      expect(isLoginRedirect(response), name).toBe(true);
      expect(response.headers.get("set-cookie") ?? "", name).toContain("dashboard_session=;");
    }
  });

  it("ignores the old dashboard_token=authenticated cookie", async () => {
    const response = await middleware(request("/dashboard", "dashboard_token=authenticated"));
    expect(isLoginRedirect(response)).toBe(true);
  });

  it("lets a valid session through", async () => {
    const response = await middleware(
      request("/dashboard/projects", `dashboard_session=${await validToken()}`)
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("fails closed when SESSION_SECRET is missing", async () => {
    const token = await validToken();
    delete process.env.SESSION_SECRET;
    try {
      const response = await middleware(request("/dashboard", `dashboard_session=${token}`));
      expect(isLoginRedirect(response)).toBe(true);
    } finally {
      process.env.SESSION_SECRET = TEST_SECRET;
    }
  });

  it("leaves the login page and public pages alone", async () => {
    for (const path of ["/dashboard/login", "/ar", "/en/projects/x"]) {
      expect((await middleware(request(path))).headers.get("x-middleware-next"), path).toBe("1");
    }
  });
});
