import bcrypt from 'bcrypt';
import { env } from '../config/env';

// ─── Password Hashing ─────────────────────────────────────────────────────────

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, env.bcrypt.saltRounds);
}

export async function comparePassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// ─── Token Hashing ────────────────────────────────────────────────────────────
// Store a hash of the refresh token in the DB instead of the token itself.
// If the DB is compromised, tokens remain unusable.

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function compareToken(
  token: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
