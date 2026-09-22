import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import { BillingWebhookStatus } from 'src/modules/billing/domain/constants/billing-webhook-status.constant';

export class ListAdminBillingWebhookEventsRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsEnum(BillingProvider)
  provider?: BillingProvider;

  @IsOptional()
  @IsEnum(BillingWebhookStatus)
  status?: BillingWebhookStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  eventType?: string;
}
