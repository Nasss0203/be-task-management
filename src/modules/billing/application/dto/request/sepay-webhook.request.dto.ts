import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SePayWebhookRequestDto {
  @IsInt()
  @Min(0)
  id: number;

  @IsString()
  gateway: string;

  @IsString()
  transactionDate: string;

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  subAccount?: string | null;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsString()
  content: string;

  @IsIn(['in', 'out'])
  transferType: 'in' | 'out';

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsInt()
  @Min(1)
  transferAmount: number;

  @IsInt()
  @Min(0)
  accumulated: number;

  @IsString()
  referenceCode: string;
}
