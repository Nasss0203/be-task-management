import { IsEnum, IsInt, IsString, Max, Min, ValidateIf } from 'class-validator';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';

export class CreateTemplateListingRequest {
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TemplateOfferType)
  offer_type?: TemplateOfferType;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  price_amount?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  currency?: string;
}
