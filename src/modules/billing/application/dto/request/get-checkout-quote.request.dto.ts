import { IsUUID } from 'class-validator';

export class GetCheckoutQuoteRequestDto {
  @IsUUID()
  planPriceId: string;
}
