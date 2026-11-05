import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

@Injectable()
export class TokenCipherService {
  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key(), iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);

    return [
      VERSION,
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      data.toString('base64url'),
    ].join('.');
  }

  decrypt(value: string): string {
    const [version, iv, tag, data] = value.split('.');

    if (version !== VERSION || !iv || !tag || !data) {
      throw new Error('Invalid encrypted token');
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      this.key(),
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private key(): Buffer {
    const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY ?? '', 'base64');

    if (key.length !== 32) {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY must be 32 bytes encoded in base64',
      );
    }

    return key;
  }
}
