export const CREATOR_HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
export const MAX_DISPLAY_NAME_LENGTH = 60;
export const MAX_HEADLINE_LENGTH = 120;
export const MAX_BIO_LENGTH = 1000;
export const MAX_LINK_LENGTH = 255;

export const CREATOR_LINK_KEYS = [
  'website',
  'x',
  'github',
  'linkedin',
  'youtube',
  'facebook',
] as const;

export type CreatorLinkKey = (typeof CREATOR_LINK_KEYS)[number];
export type CreatorLinks = Record<CreatorLinkKey, string | null>;

export type CreatorImageKind = 'avatar' | 'cover';

export interface CreatorProfileDetails {
  handle: string;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  links?: Partial<CreatorLinks>;
}

export interface ReconstituteCreatorProfileParams {
  userId: string;
  handle: string;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  links: CreatorLinks;
  avatarKey: string | null;
  coverKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function text(
  value: string | null | undefined,
  max: number,
  field: string,
): string | null {
  const trimmed = value?.trim() ?? '';

  if (trimmed.length > max) {
    throw new Error(`${field} must be at most ${max} characters`);
  }

  return trimmed || null;
}

function link(value: string | null | undefined, field: string): string | null {
  const trimmed = text(value, MAX_LINK_LENGTH, field);
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${field} must be a valid URL`);
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${field} must start with http:// or https://`);
  }

  return trimmed;
}

function normalizeHandle(handle: string): string {
  const normalized = handle?.trim().toLowerCase() ?? '';

  if (!CREATOR_HANDLE_PATTERN.test(normalized)) {
    throw new Error(
      'Handle must be 3-30 characters: lowercase letters, numbers and hyphens, not starting or ending with a hyphen',
    );
  }

  return normalized;
}

function normalizeLinks(
  links: Partial<CreatorLinks> | undefined,
): CreatorLinks {
  return Object.fromEntries(
    CREATOR_LINK_KEYS.map((key) => [key, link(links?.[key], `${key} link`)]),
  ) as CreatorLinks;
}

export class CreatorProfile {
  private constructor(
    private readonly userId: string,
    private handle: string,
    private displayName: string | null,
    private headline: string | null,
    private bio: string | null,
    private links: CreatorLinks,
    private avatarKey: string | null,
    private coverKey: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(
    userId: string,
    details: CreatorProfileDetails,
  ): CreatorProfile {
    if (!userId) {
      throw new Error('Creator profile user is required');
    }

    const now = new Date();
    const profile = new CreatorProfile(
      userId,
      '',
      null,
      null,
      null,
      normalizeLinks(undefined),
      null,
      null,
      now,
      now,
    );
    profile.update(details);

    return profile;
  }

  static reconstitute(
    params: ReconstituteCreatorProfileParams,
  ): CreatorProfile {
    return new CreatorProfile(
      params.userId,
      params.handle,
      params.displayName,
      params.headline,
      params.bio,
      params.links,
      params.avatarKey,
      params.coverKey,
      params.createdAt,
      params.updatedAt,
    );
  }

  update(details: CreatorProfileDetails): void {
    this.handle = normalizeHandle(details.handle);
    this.displayName = text(
      details.displayName,
      MAX_DISPLAY_NAME_LENGTH,
      'Display name',
    );
    this.headline = text(details.headline, MAX_HEADLINE_LENGTH, 'Headline');
    this.bio = text(details.bio, MAX_BIO_LENGTH, 'Bio');
    this.links = normalizeLinks(details.links);
    this.updatedAt = new Date();
  }

  setImageKey(kind: CreatorImageKind, key: string | null): void {
    if (kind === 'avatar') {
      this.avatarKey = key;
    } else {
      this.coverKey = key;
    }
    this.updatedAt = new Date();
  }

  getImageKey(kind: CreatorImageKind): string | null {
    return kind === 'avatar' ? this.avatarKey : this.coverKey;
  }

  getUserId(): string {
    return this.userId;
  }

  getHandle(): string {
    return this.handle;
  }

  getDisplayName(): string | null {
    return this.displayName;
  }

  getHeadline(): string | null {
    return this.headline;
  }

  getBio(): string | null {
    return this.bio;
  }

  getLinks(): CreatorLinks {
    return { ...this.links };
  }

  getAvatarKey(): string | null {
    return this.avatarKey;
  }

  getCoverKey(): string | null {
    return this.coverKey;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
