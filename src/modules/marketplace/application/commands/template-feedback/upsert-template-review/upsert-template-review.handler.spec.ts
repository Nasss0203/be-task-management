import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { TemplateReview } from '../../../../domain/entities/template-review.entity';
import { UpsertTemplateReviewCommand } from './upsert-template-review.command';
import { UpsertTemplateReviewHandler } from './upsert-template-review.handler';

describe('UpsertTemplateReviewHandler', () => {
  const found = {
    template: { getCreatedBy: () => 'creator-1' },
    version: { getId: () => 'version-2' },
  };
  let templates: { findPublicById: jest.Mock };
  let reviews: {
    findByTemplateAndUser: jest.Mock;
    save: jest.Mock;
  };
  let feedback: { hasEntitlement: jest.Mock };
  let handler: UpsertTemplateReviewHandler;

  beforeEach(() => {
    templates = { findPublicById: jest.fn().mockResolvedValue(found) };
    reviews = {
      findByTemplateAndUser: jest.fn().mockResolvedValue(null),
      save: jest.fn((review: TemplateReview) => Promise.resolve(review)),
    };
    feedback = { hasEntitlement: jest.fn().mockResolvedValue(false) };
    handler = new UpsertTemplateReviewHandler(
      templates as never,
      reviews as never,
      feedback as never,
    );
  });

  it('lets any signed-in user rate without owning the template', async () => {
    await expect(
      handler.execute(new UpsertTemplateReviewCommand('t1', 'user-1', 4)),
    ).resolves.toEqual({ rating: 4, body: null });
    expect(feedback.hasEntitlement).not.toHaveBeenCalled();
  });

  it('rejects a written review from a user who does not own the template', async () => {
    await expect(
      handler.execute(
        new UpsertTemplateReviewCommand('t1', 'user-1', 4, 'Nice'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(reviews.save).not.toHaveBeenCalled();
  });

  it('saves a written review from an owner on the current version', async () => {
    feedback.hasEntitlement.mockResolvedValue(true);

    await expect(
      handler.execute(
        new UpsertTemplateReviewCommand('t1', 'user-1', 5, ' Nice '),
      ),
    ).resolves.toEqual({ rating: 5, body: 'Nice' });
    expect(reviews.save).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 'version-2' }),
    );
  });

  it('updates the existing review instead of creating a second one', async () => {
    const existing = TemplateReview.create({
      templateId: 't1',
      userId: 'user-1',
      versionId: 'version-1',
      rating: 2,
    });
    reviews.findByTemplateAndUser.mockResolvedValue(existing);

    await handler.execute(new UpsertTemplateReviewCommand('t1', 'user-1', 5));

    expect(reviews.save).toHaveBeenCalledWith(existing);
    expect(existing.getRating()).toBe(5);
  });

  it('blocks the creator and unknown templates, and maps bad ratings to 400', async () => {
    await expect(
      handler.execute(new UpsertTemplateReviewCommand('t1', 'creator-1', 5)),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      handler.execute(new UpsertTemplateReviewCommand('t1', 'user-1', 9)),
    ).rejects.toBeInstanceOf(BadRequestException);

    templates.findPublicById.mockResolvedValue(null);
    await expect(
      handler.execute(new UpsertTemplateReviewCommand('t1', 'user-1', 5)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
