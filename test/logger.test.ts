import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { logError, logger, redact, serializeError } from "@/lib/logger";

describe("redact — secret safety", () => {
  test("masks secret-shaped keys at any depth", () => {
    const result = redact({
      password: "hunter2",
      AUTH_SECRET: "super-secret-value",
      authorization: "Bearer abc",
      cookie: "session=abc",
      nested: { apiKey: "k", databaseUrl: "postgres://x", safe: "ok" },
    }) as Record<string, unknown>;

    assert.equal(result.password, "[redacted]");
    assert.equal(result.AUTH_SECRET, "[redacted]");
    assert.equal(result.authorization, "[redacted]");
    assert.equal(result.cookie, "[redacted]");
    const nested = result.nested as Record<string, unknown>;
    assert.equal(nested.apiKey, "[redacted]");
    assert.equal(nested.databaseUrl, "[redacted]");
    assert.equal(nested.safe, "ok");
  });

  test("strips credentials embedded in connection strings anywhere in a value", () => {
    const out = redact("failed to connect postgresql://wes:secret@db.example.com:5432/ams") as string;
    assert.ok(!out.includes("wes:secret"));
    assert.ok(out.includes("postgresql://[redacted]@db.example.com:5432/ams"));
  });

  test("truncates oversized strings", () => {
    const out = redact("x".repeat(5000)) as string;
    assert.ok(out.length < 600);
    assert.match(out, /truncated/);
  });

  test("caps array size and recursion depth", () => {
    const many = redact(Array.from({ length: 50 }, (_, i) => i)) as unknown[];
    assert.equal(many.length, 21); // 20 items + summary marker

    const deep = redact({ a: { b: { c: { d: { e: { f: "deep" } } } } } });
    assert.ok(JSON.stringify(deep).includes("depth-limited"));
  });

  test("never throws on cyclic input", () => {
    const cyclic: Record<string, unknown> = { name: "loop" };
    cyclic.self = cyclic;
    assert.doesNotThrow(() => redact(cyclic));
  });

  test("keeps booleans under sensitive keys (presence flags must stay visible)", () => {
    const out = redact({ authSecretConfigured: true, databaseConfigured: false }) as Record<
      string,
      unknown
    >;
    assert.equal(out.authSecretConfigured, true);
    assert.equal(out.databaseConfigured, false);
    // …while string values under the same keys are still masked.
    const masked = redact({ authSecretConfigured: "abc" }) as Record<string, unknown>;
    assert.equal(masked.authSecretConfigured, "[redacted]");
  });
});

describe("serializeError", () => {
  test("extracts only name/message/stack/digest", () => {
    const error = new Error("boom") as Error & { digest?: string };
    error.digest = "ERR-123";
    const out = serializeError(error);
    assert.equal(out.name, "Error");
    assert.equal(out.message, "boom");
    assert.equal(out.digest, "ERR-123");
    assert.ok(out.stack?.includes("Error: boom"));
  });

  test("scrubs connection-string credentials out of error messages", () => {
    const error = new Error("connect postgres://admin:hunter2@db:5432/x failed");
    assert.ok(!serializeError(error).message.includes("hunter2"));
  });

  test("handles non-Error throwables", () => {
    const out = serializeError("just a string");
    assert.equal(out.name, "NonError");
    assert.equal(out.message, "just a string");
  });
});

describe("logger output shape", () => {
  let lines: string[] = [];
  let errors: string[] = [];
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  const previousLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    lines = [];
    errors = [];
    process.env.LOG_LEVEL = "debug";
    originalLog = console.log;
    originalError = console.error;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    if (previousLevel === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = previousLevel;
  });

  test("emits one parseable JSON line per record", () => {
    logger.info("startup", "environment validated", { appUrl: "http://localhost:3000" });
    assert.equal(lines.length, 1);
    const record = JSON.parse(lines[0]);
    assert.equal(record.level, "info");
    assert.equal(record.scope, "startup");
    assert.equal(record.msg, "environment validated");
    assert.equal(record.meta.appUrl, "http://localhost:3000");
    assert.ok(!Number.isNaN(Date.parse(record.time)));
  });

  test("warnings and errors go to stderr", () => {
    logger.warn("db", "slow query");
    logger.error("db", "query failed");
    assert.equal(lines.length, 0);
    assert.equal(errors.length, 2);
  });

  test("respects LOG_LEVEL filtering", () => {
    process.env.LOG_LEVEL = "warn";
    logger.info("x", "should be dropped");
    logger.error("x", "should be kept");
    assert.equal(lines.length, 0);
    assert.equal(errors.length, 1);
  });

  test("logError attaches a serialized, secret-free error payload", () => {
    logError("guards", "denied", new Error("bad password: hunter2"), { password: "hunter2" });
    const record = JSON.parse(errors[0]);
    assert.equal(record.meta.password, "[redacted]");
    assert.ok(!JSON.stringify(record).includes("hunter2"));
    assert.equal(record.meta.error.name, "Error");
  });
});
