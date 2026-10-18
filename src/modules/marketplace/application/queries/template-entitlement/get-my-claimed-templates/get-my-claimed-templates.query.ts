import type { TemplateEntitlementSource } from '../../../../domain/enums/template-entitlement-source.enum';

export class GetMyClaimedTemplatesQuery {
  constructor(
    public readonly userId: string,
    public readonly cursor?: string,
    public readonly limit?: number,
    public readonly source?: TemplateEntitlementSource,
  ) {}
}
