import { randomUUID } from 'crypto';
import { PublishedSiteSubdomain } from '../value-objects/published-site-subdomain.vo';

type CreatePublishedSiteProps = {
  id?: string;
  workspaceId: string;
  rootPageId: string;
  subdomain: string;
  createdBy: string;
};

type RestorePublishedSiteProps = {
  id: string;
  workspaceId: string;
  rootPageId: string;
  subdomain: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  disabledAt: Date | null;
};

export class PublishedSite {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly rootPageId: string,
    private subdomain: PublishedSiteSubdomain,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private disabledAt: Date | null,
  ) {}

  static create(props: CreatePublishedSiteProps): PublishedSite {
    const now = new Date();

    return new PublishedSite(
      props.id ?? randomUUID(),
      props.workspaceId,
      props.rootPageId,
      PublishedSiteSubdomain.create(props.subdomain),
      props.createdBy,
      now,
      now,
      null,
    );
  }

  static restore(props: RestorePublishedSiteProps): PublishedSite {
    return new PublishedSite(
      props.id,
      props.workspaceId,
      props.rootPageId,
      PublishedSiteSubdomain.create(props.subdomain),
      props.createdBy,
      props.createdAt,
      props.updatedAt,
      props.disabledAt,
    );
  }

  changeSubdomain(subdomain: string): void {
    this.subdomain = PublishedSiteSubdomain.create(subdomain);
    this.updatedAt = new Date();
  }

  disable(disabledAt = new Date()): void {
    this.disabledAt = disabledAt;
    this.updatedAt = disabledAt;
  }

  enable(): void {
    this.disabledAt = null;
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }
  getWorkspaceId(): string {
    return this.workspaceId;
  }
  getRootPageId(): string {
    return this.rootPageId;
  }
  getSubdomain(): string {
    return this.subdomain.getValue();
  }
  getCreatedBy(): string {
    return this.createdBy;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDisabledAt(): Date | null {
    return this.disabledAt;
  }
}
