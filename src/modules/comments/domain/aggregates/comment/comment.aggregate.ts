import { CommentTargetType } from '../../enums/comment-target-type.enum';

export class Comment {
  constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly pageId: string,
    private readonly targetType: CommentTargetType,
    private readonly targetId: string,
    private readonly parentCommentId: string | null,
    private readonly authorId: string,
    private body: string,
    private resolvedAt: Date | null,
    private resolvedBy: string | null,
    private editedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null,
  ) {}

  static create(params: {
    workspaceId: string;
    pageId: string;
    targetType: CommentTargetType;
    targetId: string;
    parentCommentId?: string | null;
    authorId: string;
    body: string;
  }): Comment {
    const now = new Date();

    return new Comment(
      crypto.randomUUID(),
      params.workspaceId,
      params.pageId,
      params.targetType,
      params.targetId,
      params.parentCommentId ?? null,
      params.authorId,
      params.body,
      null,
      null,
      null,
      now,
      now,
      null,
    );
  }

  static restore(params: {
    id: string;
    workspaceId: string;
    pageId: string;
    targetType: CommentTargetType;
    targetId: string;
    parentCommentId: string | null;
    authorId: string;
    body: string;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    editedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Comment {
    return new Comment(
      params.id,
      params.workspaceId,
      params.pageId,
      params.targetType,
      params.targetId,
      params.parentCommentId,
      params.authorId,
      params.body,
      params.resolvedAt,
      params.resolvedBy,
      params.editedAt,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
    );
  }

  isReply(): boolean {
    return this.parentCommentId !== null;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  edit(body: string): void {
    this.body = body;
    this.editedAt = new Date();
    this.updatedAt = this.editedAt;
  }

  /** Đánh dấu thread đã xong (chỉ comment gốc) hoặc mở lại. */
  setResolved(resolved: boolean, userId: string): void {
    this.resolvedAt = resolved ? new Date() : null;
    this.resolvedBy = resolved ? userId : null;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getPageId(): string {
    return this.pageId;
  }

  getTargetType(): CommentTargetType {
    return this.targetType;
  }

  getTargetId(): string {
    return this.targetId;
  }

  getParentCommentId(): string | null {
    return this.parentCommentId;
  }

  getAuthorId(): string {
    return this.authorId;
  }

  getBody(): string {
    return this.body;
  }

  getResolvedAt(): Date | null {
    return this.resolvedAt;
  }

  getResolvedBy(): string | null {
    return this.resolvedBy;
  }

  getEditedAt(): Date | null {
    return this.editedAt;
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
}
