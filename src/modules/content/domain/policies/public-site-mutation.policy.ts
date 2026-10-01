import { PublishedSite } from '../entities/published-site.entity';

export class PublicSiteMutationNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicSiteMutationNotAllowedError';
  }
}

/**
 * Checks only the site's public-mutation capability. Callers must still
 * authenticate, authorize, and validate the mutation command separately.
 */
export function assertPublicMutationAllowed(site: PublishedSite): void {
  if (site.getDisabledAt() !== null)
    throw new PublicSiteMutationNotAllowedError('Published site is inactive');
  if (!site.getAllowUpdates())
    throw new PublicSiteMutationNotAllowedError(
      'Public site updates are disabled',
    );
}
