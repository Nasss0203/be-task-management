import { randomUUID } from 'crypto';
import { PublishedSiteSubdomain } from '../value-objects/published-site-subdomain.vo';

type CreatePublishedSiteProps = {
  id?: string;
  workspaceId: string;
  rootPageId: string;
  subdomain: string;
  createdBy: string;
  allowUpdates?: boolean;
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
  allowUpdates?: boolean;
  seo?: PublishedSiteSeo;
  moderation?: PublishedSiteModeration | null;
};

export type PublishedSiteSeo = {
  title: string | null;
  description: string | null;
  indexing: boolean;
};

export type PublishedSiteSeoChanges = Partial<PublishedSiteSeo>;

const EMPTY_SEO: PublishedSiteSeo = {
  title: null,
  description: null,
  indexing: false,
};

function cleanText(value: string | null): string | null {
  return value?.trim() || null;
}

export type PublishedSiteModeration = {
  disabledAt: Date;
  disabledBy: string | null;
  reason: string | null;
};

export class PublishedSiteDisabledByAdminError extends Error {
  constructor() {
    super('Published site was disabled by an administrator');
    this.name = 'PublishedSiteDisabledByAdminError';
  }
}

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
    private allowUpdates: boolean,
    private seo: PublishedSiteSeo,
    private readonly moderation: PublishedSiteModeration | null = null,
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
      props.allowUpdates ?? false,
      EMPTY_SEO,
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
      props.allowUpdates ?? false,
      props.seo ?? EMPTY_SEO,
      props.moderation ?? null,
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
    if (this.isDisabledByAdmin()) throw new PublishedSiteDisabledByAdminError();
    this.disabledAt = null;
    this.updatedAt = new Date();
  }

  setAllowUpdates(allowUpdates: boolean): void {
    this.allowUpdates = allowUpdates;
    this.updatedAt = new Date();
  }

  updateSeo(changes: PublishedSiteSeoChanges): void {
    this.seo = {
      title:
        changes.title === undefined ? this.seo.title : cleanText(changes.title),
      description:
        changes.description === undefined
          ? this.seo.description
          : cleanText(changes.description),
      indexing: changes.indexing ?? this.seo.indexing,
    };
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
  getAllowUpdates(): boolean {
    return this.allowUpdates;
  }
  getSeo(): PublishedSiteSeo {
    return this.seo;
  }
  getModeration(): PublishedSiteModeration | null {
    return this.moderation;
  }
  isDisabledByAdmin(): boolean {
    return this.moderation !== null;
  }
}
