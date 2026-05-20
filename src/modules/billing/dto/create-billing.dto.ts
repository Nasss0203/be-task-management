export class CreateBillingDto {}

import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TestCreateVnpayPaymentDto {
  @IsInt()
  @Min(1000)
  amount: number;

  @IsOptional()
  @IsString()
  orderInfo?: string;
}
