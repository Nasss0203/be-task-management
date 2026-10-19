import { PickType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ListPageTemplatesRequest } from '../../../../template/presentation/http/requests/list-page-templates.request';

export class ListPublicTemplatesRequest extends PickType(
  ListPageTemplatesRequest,
  ['search', 'cursor', 'limit'] as const,
) {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(100)
  @Matches(
    /^(?![0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$)[a-z0-9]+(?:-[a-z0-9]+)*$/,
  )
  category?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  tag?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(['FREE', 'PAID'])
  offer_type?: 'FREE' | 'PAID';

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(['newest', 'top_rated', 'most_liked'])
  sort?: 'newest' | 'top_rated' | 'most_liked';
}
