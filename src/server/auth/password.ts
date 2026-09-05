import bcrypt from "bcryptjs";

/**
 * Password hashing wrapper. Uses bcryptjs — a well-established, pure-JS
 * bcrypt implementation (no native build step, portable across sandboxed
 * environments) — never a hand-rolled hashing scheme. Cost factor 12 is a
 * reasonable production default as of this writing; revisit if server
 * hardware changes significantly.
 */
const SALT_ROUNDS = 12;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
