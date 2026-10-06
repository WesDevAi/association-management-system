import "server-only";

/**
 * Structured server-side logging (Phase 16).
 *
 * Everything is emitted as a single-line JSON object so that any log drain
 * (Vercel, CloudWatch, Loki, `grep`) can parse it without a custom parser:
 *
 *   {"time":"2026-10-06T02:00:00.000Z","level":"error","scope":"auth",
 *    "msg":"sign-in failed","meta":{...}}
 *
 * Non-negotiable rules enforced by this module:
 *   1. Secret-shaped keys (`password`, `secret`, `token`, `authorization`,
 *      `cookie`, `DATABASE_URL`, ...) are redacted before serialization.
 *   2. Connection-string style values are stripped of their credentials
 *      anywhere they appear (user:password@ → [redacted]@).
 *   3. Errors are serialized to name/message/stack/digest only — never the
 *      raw object, which could carry request bodies or query results.
 *   4. Strings and arrays are truncated so one bad record can't flood the log.
 *
 * Callers must still avoid putting private data (member names, emails, note
 * contents) into `meta` — see docs/monitoring.md.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Minimum level to emit. LOG_LEVEL=info by default, debug in development. */
function minLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw && raw in LEVEL_ORDER) return raw as LogLevel;
  return process.env.NODE_ENV === "development" ? "debug" : "info";
}

const SENSITIVE_KEY =
  /(pass(word|phrase)?|secret|token|auth|cookie|authorization|credential|api[-_]?key|connection|string|database[-_]?url|private[-_]?key|session)/i;

const MAX_STRING = 500;
const MAX_ARRAY = 20;
const MAX_DEPTH = 4;
const MAX_STACK_LINES = 12;

/** Masks credentials inside URLs: `postgres://user:pass@host` → `postgres://[redacted]@host`. */
function scrubUrlCredentials(value: string): string {
  return value.replace(
    /\b([a-z][a-z0-9+.-]*:\/\/)([^/\s@]+)@/gi,
    (_match, scheme: string) => `${scheme}[redacted]@`
  );
}

/**
 * Masks `secret: value` / `token=value` fragments that often appear verbatim
 * inside error messages (Prisma, Auth.js and fetch errors all interpolate
 * config into their messages).
 */
function scrubInlineSecrets(value: string): string {
  return value.replace(
    /\b(pass(?:word|phrase)?|secret|token|api[-_]?key|authorization|credential|auth[-_]?secret)(\s*[:=]\s*)([^\s,;'"]+)/gi,
    (_match, key: string, separator: string) => `${key}${separator}[redacted]`
  );
}

function scrub(value: string): string {
  return scrubInlineSecrets(scrubUrlCredentials(value));
}

function truncate(value: string): string {
  const scrubbed = scrub(value);
  return scrubbed.length > MAX_STRING
    ? `${scrubbed.slice(0, MAX_STRING)}…[truncated ${scrubbed.length - MAX_STRING} chars]`
    : scrubbed;
}

/**
 * Recursively redacts secret-shaped keys, scrubs credentials out of string
 * values, and caps size. Exported for reuse (and unit testing).
 */
export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") return truncate(value);
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (value instanceof Date) return value.toISOString();

  if (value instanceof Error) return serializeError(value);

  if (depth >= MAX_DEPTH) return "[depth-limited]";

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY).map((item) => redact(item, depth + 1));
    if (value.length > MAX_ARRAY) items.push(`[+${value.length - MAX_ARRAY} more]`);
    return items;
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      // Booleans can only ever encode presence/absence (e.g.
      // `authSecretConfigured: true`) — never the secret itself — so they are
      // kept even under a sensitive key. Redacting them would hide exactly the
      // operational signal the log exists to show.
      const keep = typeof val === "boolean";
      out[key] = keep || !SENSITIVE_KEY.test(key) ? redact(val, depth + 1) : "[redacted]";
    }
    return out;
  }

  return String(value);
}

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  digest?: string;
};

/** Normalizes any thrown value to a safe, loggable shape. */
export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const stack = error.stack
      ? error.stack.split("\n").slice(0, MAX_STACK_LINES + 1).join("\n")
      : undefined;
    const digest =
      "digest" in error && typeof (error as { digest?: unknown }).digest === "string"
        ? (error as { digest: string }).digest
        : undefined;
    return {
      name: error.name,
      message: truncate(error.message),
      ...(stack ? { stack } : {}),
      ...(digest ? { digest } : {}),
    };
  }
  return { name: "NonError", message: truncate(String(error)) };
}

type LogInput = Record<string, unknown> | undefined;

function emit(level: LogLevel, scope: string, msg: string, meta?: LogInput): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel()]) return;

  const record: Record<string, unknown> = {
    time: new Date().toISOString(),
    level,
    scope,
    msg: truncate(msg),
  };
  if (meta) record.meta = redact(meta);

  const line = JSON.stringify(record);
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

/**
 * Minimal logger: `logger.error("guards", "denied", { userId })`.
 * The `scope` argument is the module/subsystem name — keep it short and
 * stable so logs can be filtered by it.
 */
export const logger = {
  debug: (scope: string, msg: string, meta?: LogInput) => emit("debug", scope, msg, meta),
  info: (scope: string, msg: string, meta?: LogInput) => emit("info", scope, msg, meta),
  warn: (scope: string, msg: string, meta?: LogInput) => emit("warn", scope, msg, meta),
  error: (scope: string, msg: string, meta?: LogInput) => emit("error", scope, msg, meta),
};

/** Convenience: log an exception with a consistent shape. */
export function logError(scope: string, msg: string, error: unknown, meta?: LogInput): void {
  emit("error", scope, msg, { ...meta, error: serializeError(error) });
}
