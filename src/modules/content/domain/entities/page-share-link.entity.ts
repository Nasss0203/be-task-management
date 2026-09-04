import { randomUUID } from 'crypto';

import { ResourceAccessLevel } from '../constants/resource-access-level.constant';

interface CreatePageShareLinkProps {
  pageId: string;
  tokenHash: string;
  accessLevel: ResourceAccessLevel;
  createdBy: string;
  expiresAt?: Date | null;
}

interface RestorePageShareLinkProps {
  id: string;
  pageId: string;
  tokenHash: string;
  accessLevel: ResourceAccessLevel;
  createdBy: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PageShareLink {
  private constructor(
    private readonly id: string,
    private readonly pageId: string,
    private readonly tokenHash: string,
    private readonly accessLevel: ResourceAccessLevel,
    private readonly createdBy: string,
    private readonly expiresAt: Date | null,
    private readonly revokedAt: Date | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(props: CreatePageShareLinkProps): PageShareLink {
    const now = new Date();

    return new PageShareLink(
      randomUUID(),
      props.pageId,
      props.tokenHash,
      props.accessLevel,
      props.createdBy,
      props.expiresAt ?? null,
      null,
      now,
      now,
    );
  }

  static restore(props: RestorePageShareLinkProps): PageShareLink {
    return new PageShareLink(
      props.id,
      props.pageId,
      props.tokenHash,
      props.accessLevel,
      props.createdBy,
      props.expiresAt,
      props.revokedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getPageId(): string {
    return this.pageId;
  }

  getTokenHash(): string {
    return this.tokenHash;
  }

  getAccessLevel(): ResourceAccessLevel {
    return this.accessLevel;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getExpiresAt(): Date | null {
    return this.expiresAt;
  }

  getRevokedAt(): Date | null {
    return this.revokedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
