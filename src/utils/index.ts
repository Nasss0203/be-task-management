import { genSaltSync, hashSync } from 'bcrypt';
import { createHash } from 'crypto';
import slugify from 'slugify';

const hashPassword = (password: string) => {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  return hash;
};

const hashToken = (v: string) => {
  return createHash('sha256').update(v).digest('hex');
};
const generateSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    locale: 'vi',
    strict: true,
  });
};

export { generateSlug, hashPassword, hashToken };
