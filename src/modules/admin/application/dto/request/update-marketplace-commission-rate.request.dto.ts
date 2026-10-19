import { IsInt, Max, Min } from 'class-validator';

export class UpdateMarketplaceCommissionRateRequestDto {
  @IsInt()
  @Min(0)
  @Max(10000)
  rateBps: number;
}
