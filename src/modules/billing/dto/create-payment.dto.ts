import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum CheckoutProvider {
  VNPAY = 'VNPAY',
  STRIPE = 'STRIPE',
}

export class CreatePaymentDto {
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsUUID()
  targetWorkspaceId?: string;

  @IsOptional()
  @IsEnum(CheckoutProvider)
  provider?: CheckoutProvider;
}
