import { RESERVED_PUBLISHED_SITE_SUBDOMAINS } from '../constants/published-site.constant';

export class PublishedSiteSubdomain {
  private constructor(private readonly value: string) {}

  static create(value: string): PublishedSiteSubdomain {
    const normalized = value.trim().toLowerCase();

    if (
      normalized.length === 0 ||
      normalized.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalized)
    ) {
      throw new Error('Invalid published site subdomain');
    }

    if (RESERVED_PUBLISHED_SITE_SUBDOMAINS.has(normalized)) {
      throw new Error('Published site subdomain is reserved');
    }

    return new PublishedSiteSubdomain(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
