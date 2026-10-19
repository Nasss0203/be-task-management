import { TemplateReview } from './template-review.entity';

const base = {
  templateId: 'template-1',
  userId: 'user-1',
  versionId: 'version-1',
};

describe('TemplateReview', () => {
  it('keeps a rating with a trimmed body, or null when blank', () => {
    expect(
      TemplateReview.create({
        ...base,
        rating: 5,
        body: '  Great  ',
      }).getBody(),
    ).toBe('Great');
    expect(
      TemplateReview.create({ ...base, rating: 4, body: '   ' }).getBody(),
    ).toBeNull();
  });

  it.each([0, 6, 2.5, Number.NaN])('rejects rating %p', (rating) => {
    expect(() => TemplateReview.create({ ...base, rating })).toThrow(
      'Rating must be an integer from 1 to 5',
    );
  });

  it('rejects a body longer than 2000 characters', () => {
    expect(() =>
      TemplateReview.create({ ...base, rating: 3, body: 'a'.repeat(2001) }),
    ).toThrow('at most 2000');
  });

  it('updates rating, body and version', () => {
    const review = TemplateReview.create({ ...base, rating: 2 });

    review.update({ versionId: 'version-2', rating: 5, body: 'Better now' });

    expect(review.getRating()).toBe(5);
    expect(review.getBody()).toBe('Better now');
    expect(review.getVersionId()).toBe('version-2');
  });
});
