import { randomUUID } from 'crypto';

import { AttachmentProvider } from '../enums/attachment-provider.enum';
import { AttachmentStatus } from '../enums/attachment-status.enum';

export type CreateAttachmentParams = {
  id?: string;
  workspaceId: string;
  taskId?: string | null;
  commentId?: string | null;
  pageBlockId?: string | null;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  size: number;
  provider: AttachmentProvider;
  storageKey?: string | null;
  publicId?: string | null;
  url?: string | null;
  secureUrl?: string | null;
  status?: AttachmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReconstituteAttachmentParams = {
  id: string;
  workspaceId: string;
  taskId: string | null;
  commentId: string | null;
  pageBlockId: string | null;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  size: number;
  provider: AttachmentProvider;
  storageKey: string | null;
  publicId: string | null;
  url: string | null;
  secureUrl: string | null;
  status: AttachmentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class AttachmentAggregate {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly taskId: string | null,
    private readonly commentId: string | null,
    private readonly pageBlockId: string | null,
    private readonly uploadedBy: string,
    private readonly fileName: string,
    private readonly mimeType: string,
    private readonly size: number,
    private readonly provider: AttachmentProvider,
    private readonly storageKey: string | null,
    private readonly publicId: string | null,
    private readonly url: string | null,
    private readonly secureUrl: string | null,
    private readonly status: AttachmentStatus,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(params: CreateAttachmentParams): AttachmentAggregate {
    const now = new Date();

    return new AttachmentAggregate(
      params.id ?? randomUUID(),
      params.workspaceId,
      params.taskId ?? null,
      params.commentId ?? null,
      params.pageBlockId ?? null,
      params.uploadedBy,
      params.fileName,
      params.mimeType,
      params.size,
      params.provider,
      params.storageKey ?? null,
      params.publicId ?? null,
      params.url ?? null,
      params.secureUrl ?? null,
      params.status ?? AttachmentStatus.READY,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static reconstitute(
    params: ReconstituteAttachmentParams,
  ): AttachmentAggregate {
    return new AttachmentAggregate(
      params.id,
      params.workspaceId,
      params.taskId,
      params.commentId,
      params.pageBlockId,
      params.uploadedBy,
      params.fileName,
      params.mimeType,
      params.size,
      params.provider,
      params.storageKey,
      params.publicId,
      params.url,
      params.secureUrl,
      params.status,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getTaskId(): string | null {
    return this.taskId;
  }

  getCommentId(): string | null {
    return this.commentId;
  }

  getPageBlockId(): string | null {
    return this.pageBlockId;
  }

  getUploadedBy(): string {
    return this.uploadedBy;
  }

  getFileName(): string {
    return this.fileName;
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getSize(): number {
    return this.size;
  }

  getProvider(): AttachmentProvider {
    return this.provider;
  }

  getStorageKey(): string | null {
    return this.storageKey;
  }

  getPublicId(): string | null {
    return this.publicId;
  }

  getUrl(): string | null {
    return this.url;
  }

  getSecureUrl(): string | null {
    return this.secureUrl;
  }

  getStatus(): AttachmentStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
