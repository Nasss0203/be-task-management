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

  // null clears the demo version.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUUID()
  demo_version_id?: string | null;

  // null clears the config; the schema is validated by TemplateDemoConfig.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsObject()
  demo_config?: Record<string, any> | null;
}
