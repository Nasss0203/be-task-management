import { RESERVED_PUBLISHED_SITE_SUBDOMAINS } from '../constants/published-site.constant';

export class PublishedSiteSubdomain {
  private constructor(private readonly value: string) {}

  static create(value: string): PublishedSiteSubdomain {
    const normalized = PublishedSiteSubdomain.normalize(value);
    const violation = PublishedSiteSubdomain.findViolation(normalized);

    if (violation) {
      throw new Error(violation);
    }

    return new PublishedSiteSubdomain(normalized);
  }

  static tryCreate(value: string): PublishedSiteSubdomain | null {
    const normalized = PublishedSiteSubdomain.normalize(value);

    return PublishedSiteSubdomain.findViolation(normalized)
      ? null
      : new PublishedSiteSubdomain(normalized);
  }

  getValue(): string {
    return this.value;
  }

  private static normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private static findViolation(normalized: string): string | null {
    if (
      normalized.length === 0 ||
      normalized.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalized)
    ) {
      return 'Invalid published site subdomain';
    }

    if (RESERVED_PUBLISHED_SITE_SUBDOMAINS.has(normalized)) {
      return 'Published site subdomain is reserved';
    }

    return null;
  }
}
