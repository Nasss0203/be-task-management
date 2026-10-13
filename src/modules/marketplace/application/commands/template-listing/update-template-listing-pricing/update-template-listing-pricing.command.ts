import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';

export class UpdateTemplateListingPricingCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
    public readonly offerType: TemplateOfferType,
    public readonly priceAmount: number,
    public readonly currency: string,
  ) {}
}
