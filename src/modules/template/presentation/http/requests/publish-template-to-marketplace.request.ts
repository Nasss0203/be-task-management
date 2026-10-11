import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
export class PublishTemplateToMarketplaceRequest {
  @IsNotEmpty() @IsUUID() version_id: string;
  @IsNotEmpty() @IsEnum(TemplateOfferType) offer_type: TemplateOfferType;
}
