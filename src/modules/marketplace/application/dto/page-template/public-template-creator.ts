import type { TemplateCreatorProfile } from '../../ports/template-creator-reader.port';

export type PublicTemplateCreatorDto = {
  username: string;
  avatar_url: string | null;
};

/** Public byline of a template: no id, email or account data. */
export function toPublicCreator(
  profile: TemplateCreatorProfile | undefined,
): PublicTemplateCreatorDto | null {
  return profile
    ? { username: profile.username, avatar_url: profile.avatarUrl }
    : null;
}
