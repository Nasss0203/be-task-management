import { PublishedSiteSubdomain } from './published-site-subdomain.vo';

describe('PublishedSiteSubdomain', () => {
  it('normalizes a valid subdomain', () => {
    expect(PublishedSiteSubdomain.create('  My-Site ').getValue()).toBe(
      'my-site',
    );
    expect(PublishedSiteSubdomain.tryCreate('  My-Site ')?.getValue()).toBe(
      'my-site',
    );
  });

  it.each(['', 'abc_', '-abc', 'abc-', 'a'.repeat(64), 'a.b'])(
    'rejects malformed subdomain %p',
    (value) => {
      expect(() => PublishedSiteSubdomain.create(value)).toThrow(
        'Invalid published site subdomain',
      );
      expect(PublishedSiteSubdomain.tryCreate(value)).toBeNull();
    },
  );

  it('rejects reserved subdomain', () => {
    expect(() => PublishedSiteSubdomain.create('www')).toThrow(
      'Published site subdomain is reserved',
    );
    expect(PublishedSiteSubdomain.tryCreate('WWW')).toBeNull();
  });

  it('accepts a 63-character subdomain', () => {
    expect(PublishedSiteSubdomain.tryCreate('a'.repeat(63))).not.toBeNull();
  });
});
