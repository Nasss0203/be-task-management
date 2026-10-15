import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  IsInt,
  IsString,
  Min,
  Max,
  ValidateIf,
  IsObject,
} from 'class-validator';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../domain/enums/template-preview-mode.enum';

export class PublishTemplateToMarketplaceRequest {
  @IsNotEmpty()
  @IsUUID()
  version_id: string;

  @IsNotEmpty()
  @IsEnum(TemplateOfferType)
  offer_type: TemplateOfferType;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  price_amount?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  currency?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsUUID('all', { each: true })
  category_ids?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TemplatePreviewMode)
  preview_mode?: TemplatePreviewMode;

  @ValidateIf((_, value) => value !== undefined)
  @IsUUID()
  demo_version_id?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsObject()
  demo_config?: Record<string, any>;
}
