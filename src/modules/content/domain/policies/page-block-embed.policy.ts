import { BadRequestException } from '@nestjs/common';
import type { PageBlockJson } from 'src/shared/domain/page-block.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

const EMBED_BLOCK_TYPES = new Set<PageBlockType>([
  PageBlockType.EMBED,
  PageBlockType.FIGMA,
  PageBlockType.GOOGLE_MAPS,
  PageBlockType.GITHUB_GIST,
  PageBlockType.TWEET,
]);

export enum EmbedProvider {
  FIGMA = 'FIGMA',
  GOOGLE_MAPS = 'GOOGLE_MAPS',
  GITHUB_GIST = 'GITHUB_GIST',
  X = 'X',
  VIMEO = 'VIMEO',
  LOOM = 'LOOM',
  SPOTIFY = 'SPOTIFY',
}

export interface EmbedSource {
  provider: EmbedProvider;
  externalId: string | null;
}

const matchId = (value: string | undefined, pattern: RegExp) =>
  value && pattern.test(value) ? value : null;

// Keep in sync with fe-task-management resolve-embed.ts
export function resolveEmbedProvider(url: unknown): EmbedSource | null {
  if (typeof url !== 'string') return null;

  let parsed: URL;

  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;

  const host = parsed.hostname.replace(/^www\./, '');
  const segments = parsed.pathname.split('/').filter(Boolean);

  switch (host) {
    case 'figma.com':
      return { provider: EmbedProvider.FIGMA, externalId: null };
    case 'maps.google.com':
      return { provider: EmbedProvider.GOOGLE_MAPS, externalId: null };
    case 'google.com':
      return segments[0] === 'maps'
        ? { provider: EmbedProvider.GOOGLE_MAPS, externalId: null }
        : null;
    case 'gist.github.com':
      return {
        provider: EmbedProvider.GITHUB_GIST,
        externalId: matchId(segments[1], /^[0-9a-f]+$/i),
      };
    case 'twitter.com':
    case 'x.com':
      return {
        provider: EmbedProvider.X,
        externalId:
          segments[1] === 'status' ? matchId(segments[2], /^\d+$/) : null,
      };
    case 'vimeo.com':
      return {
        provider: EmbedProvider.VIMEO,
        externalId: matchId(segments[0], /^\d+$/),
      };
    case 'player.vimeo.com':
      return {
        provider: EmbedProvider.VIMEO,
        externalId:
          segments[0] === 'video' ? matchId(segments[1], /^\d+$/) : null,
      };
    case 'loom.com':
      return {
        provider: EmbedProvider.LOOM,
        externalId: ['share', 'embed'].includes(segments[0])
          ? matchId(segments[1], /^[0-9a-f]+$/i)
          : null,
      };
    case 'open.spotify.com': {
      const [kind, id] = segments[0]?.startsWith('intl-')
        ? segments.slice(1)
        : segments;

      return {
        provider: EmbedProvider.SPOTIFY,
        externalId:
          kind && matchId(id, /^[A-Za-z0-9]+$/) ? `${kind}/${id}` : null,
      };
    }
    default:
      return null;
  }
}

export function isAllowedEmbedUrl(url: unknown): boolean {
  return resolveEmbedProvider(url) !== null;
}

export const MAX_EMBED_CAPTION_LENGTH = 500;

export function normalizeEmbedBlock(
  type: PageBlockType,
  content: PageBlockJson | undefined,
): { type: PageBlockType; content: PageBlockJson | undefined } | null {
  if (!EMBED_BLOCK_TYPES.has(type)) return { type, content };

  const fields =
    content && typeof content === 'object' && !Array.isArray(content)
      ? (content as Record<string, unknown>)
      : null;
  const caption = fields?.caption;

  if (
    caption !== undefined &&
    caption !== null &&
    (typeof caption !== 'string' || caption.length > MAX_EMBED_CAPTION_LENGTH)
  ) {
    throw new BadRequestException(
      `caption must be text of at most ${MAX_EMBED_CAPTION_LENGTH} characters`,
    );
  }

  const url = fields?.url;

  // A freshly created embed block has no url until the user pastes one
  if (url === undefined || url === null || url === '') {
    return { type: PageBlockType.EMBED, content };
  }

  const source = resolveEmbedProvider(url);

  return source
    ? { type: PageBlockType.EMBED, content: { ...fields, url, ...source } }
    : null;
}
