import { BadRequestException } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ImportColumnMapping } from 'src/modules/database/application/commands/import-database-rows/import-database-rows.command';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

export class ImportDatabaseRowsRequest {
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  mapping?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  dryRun?: string;
}

const isColumnMapping = (item: unknown): item is ImportColumnMapping =>
  item === null ||
  typeof item === 'string' ||
  (typeof item === 'object' &&
    !Array.isArray(item) &&
    Object.keys(item).join() === 'type' &&
    Object.values(PropertyType).includes(
      (item as { type: PropertyType }).type,
    ));

export function parseMapping(
  mapping: string | undefined,
): ImportColumnMapping[] | null {
  if (mapping === undefined) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(mapping);
  } catch {
    parsed = undefined;
  }
  if (!Array.isArray(parsed) || !parsed.every(isColumnMapping)) {
    throw new BadRequestException(
      'mapping must be a JSON array of property ids, null or { "type": "<property type>" }',
    );
  }

  return parsed;
}
