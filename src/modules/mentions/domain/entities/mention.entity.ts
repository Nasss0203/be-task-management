import { MentionEntityType } from '../enums/mention-entity-type.enum';
import { MentionSourceType } from '../enums/mention-source-type.enum';

export class Mention {
  constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly mentionerId: string,
    private readonly mentionedUserId: string,
    private readonly sourceType: MentionSourceType,
    private readonly sourceId: string,
    private readonly entityType: MentionEntityType,
    private readonly entityId: string,
    private notificationId: string | null,
    private readonly createdAt: Date,
  ) {}

  static create(params: {
    workspaceId: string;
    mentionerId: string;
    mentionedUserId: string;
    sourceType: MentionSourceType;
    sourceId: string;
    entityType: MentionEntityType;
    entityId: string;
  }): Mention {
    return new Mention(
      crypto.randomUUID(),
      params.workspaceId,
      params.mentionerId,
      params.mentionedUserId,
      params.sourceType,
      params.sourceId,
      params.entityType,
      params.entityId,
      null,
      new Date(),
    );
  }

  static restore(params: {
    id: string;
    workspaceId: string;
    mentionerId: string;
    mentionedUserId: string;
    sourceType: MentionSourceType;
    sourceId: string;
    entityType: MentionEntityType;
    entityId: string;
    notificationId: string | null;
    createdAt: Date;
  }): Mention {
    return new Mention(
      params.id,
      params.workspaceId,
      params.mentionerId,
      params.mentionedUserId,
      params.sourceType,
      params.sourceId,
      params.entityType,
      params.entityId,
      params.notificationId,
      params.createdAt,
    );
  }

  attachNotification(notificationId: string): void {
    this.notificationId = notificationId;
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getMentionerId(): string {
    return this.mentionerId;
  }

  getMentionedUserId(): string {
    return this.mentionedUserId;
  }

  getSourceType(): MentionSourceType {
    return this.sourceType;
  }

  getSourceId(): string {
    return this.sourceId;
  }

  getEntityType(): MentionEntityType {
    return this.entityType;
  }

  getEntityId(): string {
    return this.entityId;
  }

  getNotificationId(): string | null {
    return this.notificationId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
