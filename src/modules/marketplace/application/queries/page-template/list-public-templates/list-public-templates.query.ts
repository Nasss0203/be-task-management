import type { PublicTemplateSort } from 'src/modules/template/domain/repositories/page-template.repository';

export class ListPublicTemplatesQuery {
  constructor(
    public readonly search?: string,
    public readonly cursor?: string,
    public readonly limit?: number,
    public readonly category?: string,
    public readonly tag?: string,
    public readonly offerType?: 'FREE' | 'PAID',
    public readonly sort: PublicTemplateSort = 'newest',
    public readonly creator?: string,
  ) {}
}
