import { IsEnum } from 'class-validator';

import { TemplatePurchaseProvider } from '../../../domain/aggregates/template-purchase/template-purchase.aggregate';

export class CreateTemplatePurchaseCheckoutDto {
  @IsEnum(TemplatePurchaseProvider)
  provider!: TemplatePurchaseProvider;
}
