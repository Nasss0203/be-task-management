import { AttachmentProvider } from '../enums/attachment-provider.enum';
import { AttachmentStatus } from '../enums/attachment-status.enum';
import { AttachmentAggregate } from './attachment.aggregate';

describe('AttachmentAggregate', () => {
  it('creates a READY aggregate with generated identity and timestamps', () => {
    const attachment = AttachmentAggregate.create({
      workspaceId: 'ws-1',
      taskId: 'task-1',
      uploadedBy: 'user-1',
      fileName: 'file.pdf',
      mimeType: 'application/pdf',
      size: 100,
      provider: AttachmentProvider.R2,
      storageKey: 'key',
    });

    expect(attachment.getId()).toMatch(/^[0-9a-f-]{36}$/i);
    expect(attachment.getStatus()).toBe(AttachmentStatus.READY);
    expect(attachment.getCommentId()).toBeNull();
    expect(attachment.getCreatedAt()).toBeInstanceOf(Date);
    expect(attachment.getUpdatedAt()).toEqual(attachment.getCreatedAt());
  });

  it('preserves nullable Cloudinary and R2 locator fields', () => {
    const attachment = AttachmentAggregate.create({
      workspaceId: 'ws-1',
      commentId: 'comment-1',
      uploadedBy: 'user-1',
      fileName: 'image.png',
      mimeType: 'image/png',
      size: 100,
      provider: AttachmentProvider.CLOUDINARY,
      publicId: 'public-id',
      url: 'http://url',
      secureUrl: 'https://url',
    });

    expect(attachment.getTaskId()).toBeNull();
    expect(attachment.getStorageKey()).toBeNull();
    expect(attachment.getPublicId()).toBe('public-id');
  });

  it('reconstitutes persistence state without changing it', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const attachment = AttachmentAggregate.reconstitute({
      id: 'att-1',
      workspaceId: 'ws-1',
      taskId: 'task-1',
      commentId: null,
      uploadedBy: 'user-1',
      fileName: 'file.pdf',
      mimeType: 'application/pdf',
      size: 100,
      provider: AttachmentProvider.R2,
      storageKey: 'key',
      publicId: null,
      url: null,
      secureUrl: null,
      status: AttachmentStatus.FAILED,
      createdAt,
      updatedAt,
    });

    expect(attachment.getId()).toBe('att-1');
    expect(attachment.getStatus()).toBe(AttachmentStatus.FAILED);
    expect(attachment.getCreatedAt()).toBe(createdAt);
    expect(attachment.getUpdatedAt()).toBe(updatedAt);
  });
});
