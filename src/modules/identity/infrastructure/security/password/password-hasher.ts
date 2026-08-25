import { compareSync, genSaltSync, hashSync } from 'bcrypt';

export function hashIdentityPassword(password: string): string {
  const salt = genSaltSync as unknown as (rounds: number) => string;
  const hash = hashSync as unknown as (value: string, digest: string) => string;
  return hash(password, salt(10));
}

export function verifyIdentityPassword(
  password: string,
  hash: string,
): boolean {
  const compare: (value: string, digest: string) => boolean =
    compareSync as unknown as (value: string, digest: string) => boolean;
  return compare(password, hash);
}
