import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  test("hash is never equal to the plaintext password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.notEqual(hash, "correct horse battery staple");
  });

  test("verifyPassword succeeds for the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  });

  test("verifyPassword fails for an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.equal(await verifyPassword("wrong password", hash), false);
  });

  test("hashing the same password twice produces different hashes (salted)", async () => {
    const hashOne = await hashPassword("same-password");
    const hashTwo = await hashPassword("same-password");
    assert.notEqual(hashOne, hashTwo);
  });
});
