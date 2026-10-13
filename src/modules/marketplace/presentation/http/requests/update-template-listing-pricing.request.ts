import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';

export class UpdateTemplateListingPricingRequest {
  @IsEnum(TemplateOfferType)
  offer_type: TemplateOfferType;

  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  price_amount: number;

  @IsString()
  currency: string;
}
