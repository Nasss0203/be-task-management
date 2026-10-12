import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
export class PublishTemplateToMarketplaceRequest {
  @IsNotEmpty()
  @IsUUID()
  version_id: string;

  @IsNotEmpty()
  @IsEnum(TemplateOfferType)
  offer_type: TemplateOfferType;

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsUUID('all', { each: true })
  category_ids?: string[];
}
