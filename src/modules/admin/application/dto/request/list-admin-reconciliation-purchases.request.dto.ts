import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  ADMIN_RECONCILIATION_STATUSES,
  type AdminReconciliationStatus,
} from '../../ports/admin-marketplace-sales-reader.port';

export class ListAdminReconciliationPurchasesRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsIn(ADMIN_RECONCILIATION_STATUSES)
  status: AdminReconciliationStatus = 'RECONCILIATION_REQUIRED';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
