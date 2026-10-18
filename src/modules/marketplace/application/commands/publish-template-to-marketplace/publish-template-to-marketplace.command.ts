import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../domain/enums/template-preview-mode.enum';

export class PublishTemplateToMarketplaceCommand {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
    public readonly userId: string,
    public readonly offerType: TemplateOfferType,
    public readonly categoryIds?: string[],
    public readonly priceAmount?: number,
    public readonly currency?: string,
    public readonly previewMode?: TemplatePreviewMode,
    public readonly demoVersionId?: string | null,
    public readonly demoConfig?: Record<string, any> | null,
    public readonly tags?: string[],
  ) {}
}
