import { PickType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { ListPageTemplatesRequest } from './list-page-templates.request';

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
}
