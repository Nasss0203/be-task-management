import { BadRequestException } from '@nestjs/common';
import { TemplateListing } from '../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateOfferType } from '../../domain/enums/template-offer-type.enum';
import { TemplatePrice } from '../../domain/value-objects/template-price.vo';

export function resolveTemplateListingPricing(
  offerType: TemplateOfferType = TemplateOfferType.FREE,
  amount?: number,
  currency?: string,
): { offerType: TemplateOfferType; price: TemplatePrice } {
  try {
    if (
      offerType === TemplateOfferType.PAID &&
      (amount === undefined || currency === undefined)
    ) {
      throw new Error('Paid listings require price_amount and currency');
    }
    const price = TemplatePrice.create({
      amount: amount === undefined ? 0 : amount,
      currency: currency === undefined ? 'VND' : currency,
    });
    TemplateListing.validateOfferPrice(offerType, price);
    return { offerType, price };
  } catch (error) {
    throw new BadRequestException(
      error instanceof Error ? error.message : 'Invalid template pricing',
    );
  }
}
