import { genSaltSync, hashSync } from 'bcrypt';
import { createHash } from 'crypto';

const hashPassword = (password: string) => {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  return hash;
};

const hashToken = (v: string) => {
  return createHash('sha256').update(v).digest('hex');
};

export { hashPassword, hashToken };
