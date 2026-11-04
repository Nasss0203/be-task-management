import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

const EMBED_BLOCK_TYPES = new Set<PageBlockType>([
  PageBlockType.EMBED,
  PageBlockType.FIGMA,
  PageBlockType.GOOGLE_MAPS,
  PageBlockType.GITHUB_GIST,
  PageBlockType.TWEET,
]);

// Keep in sync with fe-task-management resolve-embed.ts
const ALLOWED_EMBED_HOSTS = new Set([
  'figma.com',
  'maps.google.com',
  'gist.github.com',
  'twitter.com',
  'x.com',
  'vimeo.com',
  'player.vimeo.com',
  'loom.com',
  'open.spotify.com',
]);

export function isAllowedEmbedUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;

  let parsed: URL;

  try {
    parsed = new URL(url.trim());
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'google.com') {
    return parsed.pathname.split('/').filter(Boolean)[0] === 'maps';
  }

  return ALLOWED_EMBED_HOSTS.has(host);
}

export function isAllowedEmbedContent(
  type: PageBlockType,
  content: unknown,
): boolean {
  if (!EMBED_BLOCK_TYPES.has(type)) return true;

  const url =
    content && typeof content === 'object' && !Array.isArray(content)
      ? (content as { url?: unknown }).url
      : undefined;

  // A freshly created embed block has no url until the user pastes one
  if (url === undefined || url === null || url === '') return true;

  return isAllowedEmbedUrl(url);
}
