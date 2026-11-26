import { isValidEmail, isValidPhone, isValidUrl } from './contact-value-format';

describe('contact value format', () => {
  it.each([
    'https://example.com',
    'http://docs.example.com/a?b=1#c',
    'example.com/docs',
    'www.taskmanly.vn',
  ])('accepts the link %s', (value) => {
    expect(isValidUrl(value)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'ftp://example.com',
    'http://localhost',
    'localhost:3000',
    'v1.2',
    'not a link.com',
    'https://',
  ])('rejects the link %s', (value) => {
    expect(isValidUrl(value)).toBe(false);
  });

  it.each(['lan@test.dev', 'a.b+c@mail.example.vn'])(
    'accepts the email %s',
    (value) => {
      expect(isValidEmail(value)).toBe(true);
    },
  );

  it.each(['abc', 'a@b', 'a b@c.com', 'a@@c.com'])(
    'rejects the email %s',
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    },
  );

  it.each(['+84 912 345 678', '(028) 3822-1234', '0912.345.678', '1234567'])(
    'accepts the phone %s',
    (value) => {
      expect(isValidPhone(value)).toBe(true);
    },
  );

  it.each(['12ab', '123456', '1234567890123456', '84+912345678', ''])(
    'rejects the phone %s',
    (value) => {
      expect(isValidPhone(value)).toBe(false);
    },
  );
});
