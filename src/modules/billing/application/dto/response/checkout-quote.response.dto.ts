import type { PlanChangeBlock } from '../../services/plan-change-quote.service';

export class CheckoutQuoteResponseDto {
  planPriceId: string;
  listAmount: number;
  creditAmount: number;
  amount: number;
  currency: string;
  blocked: PlanChangeBlock | null;
}
