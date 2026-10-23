import { createHash, randomBytes } from 'crypto';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createTeamspaceInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

export function isTeamspaceInviteToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function hashTeamspaceInviteToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
