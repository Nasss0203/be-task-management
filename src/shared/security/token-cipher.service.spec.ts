import { randomBytes } from 'crypto';

import { TokenCipherService } from './token-cipher.service';

describe('TokenCipherService', () => {
  const originalKey = process.env.TOKEN_ENCRYPTION_KEY;
  const service = new TokenCipherService();

  const useKey = (key: string | undefined) => {
    if (key === undefined) {
      delete process.env.TOKEN_ENCRYPTION_KEY;
    } else {
      process.env.TOKEN_ENCRYPTION_KEY = key;
    }
  };

  beforeEach(() => useKey(randomBytes(32).toString('base64')));

  afterAll(() => useKey(originalKey));

  it('decrypts what it encrypted', () => {
    const encrypted = service.encrypt('1//refresh-token');

    expect(encrypted).not.toContain('refresh-token');
    expect(service.decrypt(encrypted)).toBe('1//refresh-token');
  });

  it('uses a fresh IV for every encryption', () => {
    expect(service.encrypt('same')).not.toBe(service.encrypt('same'));
  });

  it('rejects a tampered value', () => {
    const [version, iv, tag, data] = service.encrypt('secret').split('.');
    const flipped = `${data.startsWith('A') ? 'B' : 'A'}${data.slice(1)}`;

    expect(() =>
      service.decrypt([version, iv, tag, flipped].join('.')),
    ).toThrow();
  });

  it('rejects a value encrypted with another key', () => {
    const encrypted = service.encrypt('secret');
    useKey(randomBytes(32).toString('base64'));

    expect(() => service.decrypt(encrypted)).toThrow();
  });

  it.each([undefined, '', randomBytes(16).toString('base64')])(
    'refuses to encrypt with key %p',
    (key) => {
      useKey(key);

      expect(() => service.encrypt('secret')).toThrow('TOKEN_ENCRYPTION_KEY');
    },
  );
});
