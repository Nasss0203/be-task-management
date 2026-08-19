export class PageTemplateBlock {
  constructor(
    private readonly id: string,
    private templateId: string,
    private parentBlockId: string | null,
    private type: string,
    private content: Record<string, unknown> | null,
    private orderIndex: number,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {}

  static restore(params: {
    id: string;
    templateId: string;
    parentBlockId: string | null;
    type: string;
    content: Record<string, unknown> | null;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): PageTemplateBlock {
    return new PageTemplateBlock(
      params.id,
      params.templateId,
      params.parentBlockId,
      params.type,
      params.content,
      params.orderIndex,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
    );
  }

  static create(params: {
    templateId: string;
    type: string;
    parentBlockId?: string | null;
    content?: Record<string, unknown> | null;
    orderIndex?: number;
  }): PageTemplateBlock {
    return new PageTemplateBlock(
      crypto.randomUUID(),
      params.templateId,
      params.parentBlockId ?? null,
      params.type,
      params.content ?? null,
      params.orderIndex ?? 0,
      new Date(),
      new Date(),
    );
  }

  getId(): string {
    return this.id;
  }
  getTemplateId(): string {
    return this.templateId;
  }
  getParentBlockId(): string | null {
    return this.parentBlockId;
  }
  getType(): string {
    return this.type;
  }
  getContent(): Record<string, unknown> | null {
    return this.content;
  }
  getOrderIndex(): number {
    return this.orderIndex;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  update(params: {
    parentBlockId?: string | null;
    type?: string;
    content?: Record<string, unknown> | null;
    orderIndex?: number;
  }) {
    if (params.parentBlockId !== undefined) this.parentBlockId = params.parentBlockId;
    if (params.type !== undefined) this.type = params.type;
    if (params.content !== undefined) this.content = params.content;
    if (params.orderIndex !== undefined) this.orderIndex = params.orderIndex;
    this.updatedAt = new Date();
  }

  markAsDeleted() {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }
}
