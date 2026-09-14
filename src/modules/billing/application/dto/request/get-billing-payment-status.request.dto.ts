import { IsUUID } from 'class-validator';

export class GetBillingPaymentStatusRequestDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  paymentOrderId: string;
}
