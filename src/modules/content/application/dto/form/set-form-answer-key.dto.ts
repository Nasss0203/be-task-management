import { IsDefined, IsInt, Max, Min } from 'class-validator';

export class SetFormAnswerKeyDto {
  @IsDefined()
  correct_value: unknown;

  @IsInt()
  @Min(1)
  @Max(1000)
  points: number;
}
