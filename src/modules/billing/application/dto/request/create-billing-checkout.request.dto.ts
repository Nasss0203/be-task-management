import { IsUUID } from 'class-validator';

export class CreateBillingCheckoutRequestDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  planPriceId: string;
}
