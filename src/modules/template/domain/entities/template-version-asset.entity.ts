import { randomUUID } from 'crypto';

import { TemplateVersionAssetProvider } from '../enums/template-version-asset-provider.enum';
import { TemplateVersionAssetStatus } from '../enums/template-version-asset-status.enum';
import { TemplateVersionAssetType } from '../enums/template-version-asset-type.enum';

export type CreateTemplateVersionAssetParams = {
  id?: string;
  templateVersionId: string;
  assetType: TemplateVersionAssetType;
  provider: TemplateVersionAssetProvider;
  storageKey: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RestoreTemplateVersionAssetParams = {
  id: string;
  templateVersionId: string;
  assetType: TemplateVersionAssetType;
  provider: TemplateVersionAssetProvider;
  storageKey: string;
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  status: TemplateVersionAssetStatus;
  generatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class TemplateVersionAsset {
  private constructor(
    private readonly id: string,
    private readonly templateVersionId: string,
    private readonly assetType: TemplateVersionAssetType,
    private readonly provider: TemplateVersionAssetProvider,
    private readonly storageKey: string,
    private mimeType: string | null,
    private fileSize: number | null,
    private width: number | null,
    private height: number | null,
    private status: TemplateVersionAssetStatus,
    private generatedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    if (!templateVersionId.trim()) {
      throw new Error('Template version id is required');
    }
    if (!storageKey.trim()) {
      throw new Error('Storage key is required');
    }
  }

  static create(
    params: CreateTemplateVersionAssetParams,
  ): TemplateVersionAsset {
    const now = new Date();

    return new TemplateVersionAsset(
      params.id ?? randomUUID(),
      params.templateVersionId,
      params.assetType,
      params.provider,
      params.storageKey,
      null,
      null,
      null,
      null,
      TemplateVersionAssetStatus.PENDING,
      null,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static restore(
    params: RestoreTemplateVersionAssetParams,
  ): TemplateVersionAsset {
    return new TemplateVersionAsset(
      params.id,
      params.templateVersionId,
      params.assetType,
      params.provider,
      params.storageKey,
      params.mimeType,
      params.fileSize,
      params.width,
      params.height,
      params.status,
      params.generatedAt,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplateVersionId(): string {
    return this.templateVersionId;
  }

  getAssetType(): TemplateVersionAssetType {
    return this.assetType;
  }

  getProvider(): TemplateVersionAssetProvider {
    return this.provider;
  }

  getStorageKey(): string {
    return this.storageKey;
  }

  getMimeType(): string | null {
    return this.mimeType;
  }

  getFileSize(): number | null {
    return this.fileSize;
  }

  getWidth(): number | null {
    return this.width;
  }

  getHeight(): number | null {
    return this.height;
  }

  getStatus(): TemplateVersionAssetStatus {
    return this.status;
  }

  getGeneratedAt(): Date | null {
    return this.generatedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  markReady(params: {
    mimeType: string;
    fileSize: number;
    width: number;
    height: number;
    generatedAt?: Date;
  }): void {
    if (!params.mimeType.trim()) {
      throw new Error('Mime type is required for a ready asset');
    }
    if (params.fileSize < 0) {
      throw new Error('File size cannot be negative');
    }
    if (params.width <= 0 || params.height <= 0) {
      throw new Error('Ready asset dimensions must be greater than zero');
    }

    this.mimeType = params.mimeType;
    this.fileSize = params.fileSize;
    this.width = params.width;
    this.height = params.height;
    this.status = TemplateVersionAssetStatus.READY;
    this.generatedAt = params.generatedAt ?? new Date();
    this.updatedAt = new Date();
  }

  markFailed(): void {
    this.status = TemplateVersionAssetStatus.FAILED;
    this.generatedAt = null;
    this.updatedAt = new Date();
  }

  markPending(): void {
    if (this.status !== TemplateVersionAssetStatus.FAILED) {
      throw new Error('Only a failed template version asset can be retried');
    }

    this.status = TemplateVersionAssetStatus.PENDING;
    this.mimeType = null;
    this.fileSize = null;
    this.width = null;
    this.height = null;
    this.generatedAt = null;
    this.updatedAt = new Date();
  }
}
