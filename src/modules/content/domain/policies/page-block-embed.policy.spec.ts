import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import {
  isAllowedEmbedContent,
  isAllowedEmbedUrl,
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
    ])('accepts %s', (url) => {
      expect(isAllowedEmbedUrl(url)).toBe(true);
    });

    it.each([
      'http://figma.com/file/abc',
      'https://evil.com',
      'https://evilfigma.com/file/abc',
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

  describe('isAllowedEmbedContent', () => {
    it('ignores non-embed blocks', () => {
      expect(
        isAllowedEmbedContent(PageBlockType.TEXT, { url: 'https://evil.com' }),
      ).toBe(true);
    });

    it.each([{}, null, { url: '' }, { url: null }])(
      'allows an embed block without url: %p',
      (content) => {
        expect(isAllowedEmbedContent(PageBlockType.EMBED, content)).toBe(true);
      },
    );

    it('rejects an embed block with a foreign url', () => {
      expect(
        isAllowedEmbedContent(PageBlockType.FIGMA, { url: 'https://evil.com' }),
      ).toBe(false);
    });

    it('accepts an embed block with an allowed url', () => {
      expect(
        isAllowedEmbedContent(PageBlockType.TWEET, {
          url: 'https://x.com/user/status/1',
        }),
      ).toBe(true);
    });
  });
});
