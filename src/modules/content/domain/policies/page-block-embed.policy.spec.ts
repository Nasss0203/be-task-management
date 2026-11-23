import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import {
  isAllowedEmbedUrl,
  normalizeEmbedBlock,
  resolveEmbedProvider,
} from './page-block-embed.policy';

describe('page-block-embed.policy', () => {
  describe('isAllowedEmbedUrl', () => {
    it.each([
      'https://www.figma.com/file/abc',
      'https://www.google.com/maps/place/Hanoi',
      'https://maps.google.com/?q=Hanoi',
      'https://gist.github.com/user/123',
      'https://twitter.com/user/status/1',
      'https://x.com/user/status/1',
      'https://vimeo.com/76979871',
      'https://player.vimeo.com/video/76979871',
      'https://www.loom.com/share/abc123',
      'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    ])('accepts %s', (url) => {
      expect(isAllowedEmbedUrl(url)).toBe(true);
    });

    it.each([
      'http://figma.com/file/abc',
      'https://evil.com',
      'https://evilfigma.com/file/abc',
      'https://spotify.com/track/1',
      'https://figma.com.evil.com/file/abc',
      'javascript:alert(1)',
      'https://google.com/search?q=x',
      'not a url',
      '',
      123,
      null,
      undefined,
    ])('rejects %p', (url) => {
      expect(isAllowedEmbedUrl(url)).toBe(false);
    });
  });

  describe('resolveEmbedProvider', () => {
    it.each([
      ['https://www.figma.com/design/abc123/x', 'FIGMA', null],
      ['https://www.google.com/maps/place/Hanoi', 'GOOGLE_MAPS', null],
      ['https://maps.google.com/?q=Hanoi', 'GOOGLE_MAPS', null],
      [
        'https://gist.github.com/octocat/6cad326836d38bd3a7ae',
        'GITHUB_GIST',
        '6cad326836d38bd3a7ae',
      ],
      ['https://twitter.com/jack/status/20', 'X', '20'],
      ['https://x.com/jack', 'X', null],
      ['https://vimeo.com/76979871', 'VIMEO', '76979871'],
      ['https://player.vimeo.com/video/76979871', 'VIMEO', '76979871'],
      ['https://www.loom.com/share/0281766fa2d0', 'LOOM', '0281766fa2d0'],
      [
        'https://open.spotify.com/intl-vi/track/4uLU6hMCjMI75M1A2tKUQC?si=x',
        'SPOTIFY',
        'track/4uLU6hMCjMI75M1A2tKUQC',
      ],
    ])('maps %s', (url, provider, externalId) => {
      expect(resolveEmbedProvider(url)).toEqual({ provider, externalId });
    });

    it('returns null for a host outside the list', () => {
      expect(resolveEmbedProvider('https://evil.com/x')).toBeNull();
    });
  });

  describe('normalizeEmbedBlock', () => {
    it('leaves non-embed blocks alone', () => {
      const content = { url: 'https://evil.com' };

      expect(normalizeEmbedBlock(PageBlockType.TEXT, content)).toEqual({
        type: PageBlockType.TEXT,
        content,
      });
    });

    it.each([undefined, {}, null, { url: '' }, { url: null }])(
      'keeps an embed block without url: %p',
      (content) => {
        expect(normalizeEmbedBlock(PageBlockType.FIGMA, content)).toEqual({
          type: PageBlockType.EMBED,
          content,
        });
      },
    );

    it('rejects an embed block with a foreign url', () => {
      expect(
        normalizeEmbedBlock(PageBlockType.EMBED, { url: 'https://evil.com' }),
      ).toBeNull();
    });

    it('stores the provider computed from the url as EMBED', () => {
      expect(
        normalizeEmbedBlock(PageBlockType.TWEET, {
          url: 'https://x.com/user/status/1',
          provider: 'LOOM',
        }),
      ).toEqual({
        type: PageBlockType.EMBED,
        content: {
          url: 'https://x.com/user/status/1',
          provider: 'X',
          externalId: '1',
        },
      });
    });
  });
});
