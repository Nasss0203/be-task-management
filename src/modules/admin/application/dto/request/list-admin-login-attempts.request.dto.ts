import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  LOGIN_ATTEMPT_METHODS,
  LOGIN_ATTEMPT_RESULTS,
  type LoginAttemptMethod,
  type LoginAttemptResult,
} from 'src/modules/identity/application/ports/login-attempt-recorder.port';

export class ListAdminLoginAttemptsRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsIn(LOGIN_ATTEMPT_RESULTS)
  result?: LoginAttemptResult;

  @IsOptional()
  @IsIn(LOGIN_ATTEMPT_METHODS)
  method?: LoginAttemptMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
