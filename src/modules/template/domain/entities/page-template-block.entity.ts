import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';

export class PageTemplateBlock {
  private constructor(
    private readonly id: string,
    private readonly versionId: string,
    private parentBlockId: string | null,
    private readonly type: PageBlockType,
    private title: string | null,
    private positionX: number | null,
    private positionY: number | null,
    private width: number | null,
    private height: number | null,
    private orderIndex: number,
    private content: PageBlockJson,
    private styleConfig: PageBlockStyleConfig,
    private dataConfig: PageBlockJson,
    private readonly createdBy: string,
    private isOpen: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: {
    id?: string;
    versionId: string;
    parentBlockId?: string | null;
    type: PageBlockType;
    createdBy: string;
    title?: string | null;
    positionX?: number | null;
    positionY?: number | null;
    width?: number | null;
    height?: number | null;
    orderIndex?: number;
    content?: PageBlockJson;
    styleConfig?: PageBlockStyleConfig;
    dataConfig?: PageBlockJson;
    isOpen?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): PageTemplateBlock {
    const now = new Date();
    return new PageTemplateBlock(
      params.id ?? crypto.randomUUID(),
      params.versionId,
      params.parentBlockId ?? null,
      params.type,
      params.title ?? null,
      params.positionX ?? null,
      params.positionY ?? null,
      params.width ?? null,
      params.height ?? null,
      params.orderIndex ?? 0,
      params.content ?? null,
      params.styleConfig ?? null,
      params.dataConfig ?? null,
      params.createdBy,
      params.isOpen ?? true,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static restore(params: {
    id: string;
    versionId: string;
    parentBlockId: string | null;
    type: PageBlockType;
    title: string | null;
    positionX: number | null;
    positionY: number | null;
    width: number | null;
    height: number | null;
    orderIndex: number;
    content: PageBlockJson;
    styleConfig: PageBlockStyleConfig;
    dataConfig: PageBlockJson;
    createdBy: string;
    isOpen: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): PageTemplateBlock {
    return new PageTemplateBlock(
      params.id,
      params.versionId,
      params.parentBlockId,
      params.type,
      params.title,
      params.positionX,
      params.positionY,
      params.width,
      params.height,
      params.orderIndex,
      params.content,
      params.styleConfig,
      params.dataConfig,
      params.createdBy,
      params.isOpen,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }
  getVersionId(): string {
    return this.versionId;
  }
  getParentBlockId(): string | null {
    return this.parentBlockId;
  }
  getType(): PageBlockType {
    return this.type;
  }
  getTitle(): string | null {
    return this.title;
  }
  getPositionX(): number | null {
    return this.positionX;
  }
  getPositionY(): number | null {
    return this.positionY;
  }
  getWidth(): number | null {
    return this.width;
  }
  getHeight(): number | null {
    return this.height;
  }
  getOrderIndex(): number {
    return this.orderIndex;
  }
  getContent(): PageBlockJson {
    return this.content;
  }
  getStyleConfig(): PageBlockStyleConfig {
    return this.styleConfig;
  }
  getDataConfig(): PageBlockJson {
    return this.dataConfig;
  }
  getCreatedBy(): string {
    return this.createdBy;
  }
  getIsOpen(): boolean {
    return this.isOpen;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  updateContent(params: {
    title?: string | null;
    content?: PageBlockJson;
    isOpen?: boolean;
  }): void {
    if (params.title !== undefined) this.title = params.title;
    if (params.content !== undefined) this.content = params.content;
    if (params.isOpen !== undefined) this.isOpen = params.isOpen;
    this.updatedAt = new Date();
  }

  updateLayout(params: {
    positionX?: number | null;
    positionY?: number | null;
    width?: number | null;
    height?: number | null;
    orderIndex?: number;
  }): void {
    if (params.positionX !== undefined) this.positionX = params.positionX;
    if (params.positionY !== undefined) this.positionY = params.positionY;
    if (params.width !== undefined) this.width = params.width;
    if (params.height !== undefined) this.height = params.height;
    if (params.orderIndex !== undefined) this.orderIndex = params.orderIndex;
    this.updatedAt = new Date();
  }

  updateStyle(styleConfig: PageBlockStyleConfig): void {
    this.styleConfig = styleConfig;
    this.updatedAt = new Date();
  }

  updateConfig(dataConfig: PageBlockJson): void {
    this.dataConfig = dataConfig;
    this.updatedAt = new Date();
  }

  move(parentBlockId: string | null, orderIndex?: number): void {
    // A snapshot keeps hierarchy and sibling ordering together when moved.
    this.parentBlockId = parentBlockId;
    if (orderIndex !== undefined) this.orderIndex = orderIndex;
    this.updatedAt = new Date();
  }
}
