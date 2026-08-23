export enum PageBlockType {
  TEXT = 'TEXT',
  HEADER = 'HEADER',
  QUOTE = 'QUOTE',
  DIVIDER = 'DIVIDER',
  CODE = 'CODE',
  TODO = 'TODO',

  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  BOOKMARK = 'BOOKMARK',

  EMBED = 'EMBED',
  FIGMA = 'FIGMA',
  GITHUB_GIST = 'GITHUB_GIST',
  GOOGLE_MAPS = 'GOOGLE_MAPS',
  TWEET = 'TWEET',

  DATABASE_VIEW = 'DATABASE_VIEW',
  TABLE_SIMPLE = 'TABLE_SIMPLE',
  MERMAID = 'MERMAID',
  BUTTON = 'BUTTON',
}

export type PageBlockDatabaseViewDataConfig = {
  database_id: string;
  view_id: string;
};

export type PageBlockJson =
  | Record<string, unknown>
  | unknown[]
  | PageBlockDatabaseViewDataConfig
  | null;
export type PageBlockStyleConfig = Record<string, unknown> | null;

export class PageBlock {
  constructor(
    private readonly id: string,
    private pageId: string,
    private parentBlockId: string | null,
    private type: PageBlockType,
    private title: string | null,
    private positionX: number | null,
    private positionY: number | null,
    private width: number | null,
    private height: number | null,
    private orderIndex: number,
    private content: PageBlockJson,
    private styleConfig: PageBlockStyleConfig,
    private dataConfig: PageBlockJson,
    private createdBy: string,
    private isOpen: boolean,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
    private deletedBy: string | null = null,
  ) {}

  static restore(params: {
    id: string;
    pageId: string;
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
    deletedAt: Date | null;
    deletedBy: string | null;
  }): PageBlock {
    return new PageBlock(
      params.id,
      params.pageId,
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
      params.deletedAt,
      params.deletedBy,
    );
  }

  static create(params: {
    pageId: string;
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
  }): PageBlock {
    return new PageBlock(
      crypto.randomUUID(),
      params.pageId,
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
      new Date(),
      new Date(),
    );
  }

  getId(): string {
    return this.id;
  }
  getPageId(): string {
    return this.pageId;
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
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }
  getDeletedBy(): string | null {
    return this.deletedBy;
  }

  update(params: {
    title?: string | null;
    positionX?: number | null;
    positionY?: number | null;
    width?: number | null;
    height?: number | null;
    content?: PageBlockJson;
    styleConfig?: PageBlockStyleConfig;
    dataConfig?: PageBlockJson;
    isOpen?: boolean;
  }) {
    if (params.title !== undefined) this.title = params.title;
    if (params.positionX !== undefined) this.positionX = params.positionX;
    if (params.positionY !== undefined) this.positionY = params.positionY;
    if (params.width !== undefined) this.width = params.width;
    if (params.height !== undefined) this.height = params.height;
    if (params.content !== undefined) this.content = params.content;
    if (params.styleConfig !== undefined) this.styleConfig = params.styleConfig;
    if (params.dataConfig !== undefined) this.dataConfig = params.dataConfig;
    if (params.isOpen !== undefined) this.isOpen = params.isOpen;
    this.updatedAt = new Date();
  }

  moveToParent(parentBlockId: string | null) {
    this.parentBlockId = parentBlockId;
    this.updatedAt = new Date();
  }

  changeOrder(orderIndex: number) {
    this.orderIndex = orderIndex;
    this.updatedAt = new Date();
  }

  markAsDeleted(deletedBy: string) {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.updatedAt = new Date();
  }

  restoreDeleted() {
    this.deletedAt = null;
    this.deletedBy = null;
    this.updatedAt = new Date();
  }
}
