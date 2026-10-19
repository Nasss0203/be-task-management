import { CreatorProfile } from './creator-profile.entity';

describe('CreatorProfile', () => {
  it('normalizes the handle and trims text fields', () => {
    const profile = CreatorProfile.create('user-1', {
      handle: '  Nam-Design ',
      displayName: '  Nam  ',
      headline: '   ',
      links: { website: ' https://nam.dev ' },
    });

    expect(profile.getHandle()).toBe('nam-design');
    expect(profile.getDisplayName()).toBe('Nam');
    expect(profile.getHeadline()).toBeNull();
    expect(profile.getLinks()).toEqual({
      website: 'https://nam.dev',
      x: null,
      github: null,
      linkedin: null,
      youtube: null,
      facebook: null,
    });
  });

  it.each(['ab', '-nam', 'nam-', 'nam_design', 'a'.repeat(31), 'Nam Design'])(
    'rejects handle %p',
    (handle) => {
      expect(() => CreatorProfile.create('user-1', { handle })).toThrow(
        'Handle must be 3-30 characters',
      );
    },
  );

  it.each(['javascript:alert(1)', 'not a url', 'ftp://files.example'])(
    'rejects link %p',
    (website) => {
      expect(() =>
        CreatorProfile.create('user-1', { handle: 'nam', links: { website } }),
      ).toThrow('website link');
    },
  );

  it('rejects a bio over 1000 characters', () => {
    expect(() =>
      CreatorProfile.create('user-1', { handle: 'nam', bio: 'a'.repeat(1001) }),
    ).toThrow('Bio must be at most 1000 characters');
  });

  it('keeps image keys separately per kind', () => {
    const profile = CreatorProfile.create('user-1', { handle: 'nam' });

    profile.setImageKey('avatar', 'creators/user-1/avatar.png');

    expect(profile.getAvatarKey()).toBe('creators/user-1/avatar.png');
    expect(profile.getCoverKey()).toBeNull();
  });
});
