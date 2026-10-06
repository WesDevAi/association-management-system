import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { EnvValidationError, parseEnv } from "@/lib/env";

const production = { nodeEnv: "production" as const };

/** Returns a copy of `source` with one key removed (avoids unused-var lint noise). */
function withoutKey(source: Record<string, string | undefined>, key: string) {
  const copy: Record<string, string | undefined> = { ...source };
  delete copy[key];
  return copy;
}

const validProductionEnv = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://user:password@db.example.com:5432/ams?sslmode=require",
  AUTH_SECRET: "a".repeat(48),
  NEXT_PUBLIC_APP_URL: "https://ams.example.com",
  DEFAULT_CURRENCY: "NGN",
};

describe("parseEnv — production", () => {
  test("accepts a complete, valid production environment", () => {
    const env = parseEnv(validProductionEnv, production);
    assert.equal(env.nodeEnv, "production");
    assert.equal(env.DATABASE_URL, validProductionEnv.DATABASE_URL);
    assert.equal(env.NEXT_PUBLIC_APP_URL, "https://ams.example.com");
    assert.equal(env.DEFAULT_CURRENCY, "NGN");
    assert.equal(env.AUTH_SECRET, "a".repeat(48));
  });

  test("AUTH_SECRET is required in production", () => {
    assert.throws(
      () => parseEnv(withoutKey(validProductionEnv, "AUTH_SECRET"), production),
      (error: unknown) => {
        assert.ok(error instanceof EnvValidationError);
        assert.match(error.message, /AUTH_SECRET is required in production/);
        // The message must tell the operator how to fix it.
        assert.match(error.message, /openssl rand -base64 32/);
        return true;
      }
    );
  });

  test("AUTH_SECRET must be at least 32 characters in production", () => {
    assert.throws(
      () => parseEnv({ ...validProductionEnv, AUTH_SECRET: "too-short" }, production),
      /at least 32 characters in production/
    );
  });

  test("DATABASE_URL is required and must be a postgres URL", () => {
    assert.throws(
      () => parseEnv(withoutKey(validProductionEnv, "DATABASE_URL"), production),
      /DATABASE_URL is required/
    );

    assert.throws(
      () => parseEnv({ ...validProductionEnv, DATABASE_URL: "mysql://host/db" }, production),
      /DATABASE_URL must be a postgres/
    );
  });

  test("NEXT_PUBLIC_APP_URL is required and must be absolute", () => {
    assert.throws(
      () => parseEnv(withoutKey(validProductionEnv, "NEXT_PUBLIC_APP_URL"), production),
      /NEXT_PUBLIC_APP_URL is required/
    );

    assert.throws(
      () => parseEnv({ ...validProductionEnv, NEXT_PUBLIC_APP_URL: "ams.example.com" }, production),
      /absolute http/
    );
  });

  test("plain http app URLs are rejected outside localhost in production", () => {
    assert.throws(
      () => parseEnv({ ...validProductionEnv, NEXT_PUBLIC_APP_URL: "http://ams.example.com" }, production),
      /must use https/
    );
    // localhost over http is still fine (staging on a private network).
    assert.doesNotThrow(() =>
      parseEnv({ ...validProductionEnv, NEXT_PUBLIC_APP_URL: "http://localhost:3000" }, production)
    );
  });

  test("reports every problem at once instead of one at a time", () => {
    try {
      parseEnv({ NODE_ENV: "production" }, production);
      assert.fail("should have thrown");
    } catch (error) {
      assert.ok(error instanceof EnvValidationError);
      assert.ok(error.issues.length >= 3, `expected >=3 issues, got ${error.issues.length}`);
      assert.match(error.message, /DATABASE_URL/);
      assert.match(error.message, /AUTH_SECRET/);
      assert.match(error.message, /NEXT_PUBLIC_APP_URL/);
      // Actionable footer pointing at the docs.
      assert.match(error.message, /deployment-checklist/);
    }
  });

  test("a stray AUTH_URL must still be a valid URL", () => {
    assert.throws(
      () => parseEnv({ ...validProductionEnv, AUTH_URL: "not-a-url" }, production),
      /AUTH_URL/
    );
  });
});

describe("parseEnv — development", () => {
  const devSource = {
    NODE_ENV: "development",
    DATABASE_URL: "postgresql://postgres@localhost:5432/ams_dev",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  };

  test("AUTH_SECRET is optional in development (Auth.js generates a dev secret)", () => {
    assert.doesNotThrow(() => parseEnv(devSource, { nodeEnv: "development" }));
  });

  test("DEFAULT_CURRENCY falls back to NGN and normalizes case", () => {
    const env = parseEnv(devSource, { nodeEnv: "development" });
    assert.equal(env.DEFAULT_CURRENCY, "NGN");

    const custom = parseEnv({ ...devSource, DEFAULT_CURRENCY: "usd" }, { nodeEnv: "development" });
    assert.equal(custom.DEFAULT_CURRENCY, "USD");
  });

  test("a set-but-invalid DEFAULT_CURRENCY fails loudly", () => {
    assert.throws(
      () => parseEnv({ ...devSource, DEFAULT_CURRENCY: "Naira" }, { nodeEnv: "development" }),
      /3-letter ISO currency code/
    );
  });

  test("returns a frozen object (callers cannot mutate shared config)", () => {
    const env = parseEnv(devSource, { nodeEnv: "development" });
    assert.ok(Object.isFrozen(env));
  });
});
