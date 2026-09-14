import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export interface SepayPgOrderPayload {
  id: string;
  order_id: string;
  order_status: string;
  order_currency: string;
  order_amount: string;
  order_invoice_number: string;
  custom_data?: unknown;
  user_agent?: string | null;
  ip_address?: string | null;
  order_description?: string | null;
}

export interface SepayPgTransactionPayload {
  id: string;
  payment_method: string;
  transaction_id: string;
  transaction_type: string;
  transaction_date: string;
  transaction_status: string;
  transaction_amount: string;
  transaction_currency: string;
  authentication_status?: string | null;
  card_number?: string | null;
  card_holder_name?: string | null;
  card_expiry?: string | null;
  card_funding_method?: string | null;
  card_brand?: string | null;
}

export interface SepayPgCustomerPayload {
  id: string;
  customer_id: string;
}

export class SepayPgIpnRequestDto {
  @IsInt()
  @Min(1)
  timestamp!: number;

  @IsString()
  @IsNotEmpty()
  notification_type!: string;

  @IsObject()
  order!: SepayPgOrderPayload;

  @IsObject()
  transaction!: SepayPgTransactionPayload;

  @IsOptional()
  @IsObject()
  customer?: SepayPgCustomerPayload | null;

  @IsOptional()
  @IsObject()
  agreement?: Record<string, unknown> | null;
}
