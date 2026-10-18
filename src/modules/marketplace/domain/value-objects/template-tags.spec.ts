import { normalizeTemplateTags } from './template-tags';

describe('normalizeTemplateTags', () => {
  it('normalizes to lowercase slugs and removes duplicates', () => {
    expect(
      normalizeTemplateTags([' Project Mgmt ', 'project-mgmt', 'CRM', 'sales__ops', '']),
    ).toEqual(['project-mgmt', 'crm', 'sales-ops']);
  });

  it('allows up to 10 tags', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `tag-${i}`);
    expect(normalizeTemplateTags(ten)).toHaveLength(10);
    expect(() => normalizeTemplateTags([...ten, 'tag-10'])).toThrow(
      'at most 10 tags',
    );
  });

  it.each(['a', 'x'.repeat(33), 'emoji-🎉', 'no/slash'])(
    'rejects "%s"',
    (tag) => {
      expect(() => normalizeTemplateTags([tag])).toThrow('Invalid tag');
    },
  );
});
