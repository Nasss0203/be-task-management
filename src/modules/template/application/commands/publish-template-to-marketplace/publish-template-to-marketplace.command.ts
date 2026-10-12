import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
export class PublishTemplateToMarketplaceCommand {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
    public readonly userId: string,
    public readonly offerType: TemplateOfferType,
    public readonly categoryIds?: string[],
  ) {}
}
