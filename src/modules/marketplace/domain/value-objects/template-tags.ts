export const MAX_TEMPLATE_TAGS = 10;

const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Creator free-form tags, normalized to lowercase slugs ("Project Mgmt" ->
 * "project-mgmt") and de-duplicated. Same rule as the DB CHECK constraint.
 */
export function normalizeTemplateTags(raw: readonly string[]): string[] {
  const tags = [
    ...new Set(
      raw
        .map((tag) =>
          tag
            .trim()
            .toLowerCase()
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, ''),
        )
        .filter(Boolean),
    ),
  ];

  if (tags.length > MAX_TEMPLATE_TAGS) {
    throw new Error(`A listing can have at most ${MAX_TEMPLATE_TAGS} tags`);
  }
  for (const tag of tags) {
    if (tag.length < 2 || tag.length > 32 || !TAG_PATTERN.test(tag)) {
      throw new Error(
        `Invalid tag "${tag}": use 2-32 letters, numbers or dashes`,
      );
    }
  }
  return tags;
}
