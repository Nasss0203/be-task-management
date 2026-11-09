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
  STORAGE_FILE_SORTS,
  STORAGE_FILE_STATUSES,
  STORAGE_FILE_TYPES,
  type StorageFileSort,
  type StorageFileStatus,
  type StorageFileType,
} from '../../../application/ports/workspace-storage-reader.port';
import { STORAGE_FILES_MAX_PAGE_SIZE } from '../../../application/queries/list-workspace-storage-files/list-workspace-storage-files.handler';

export class ListWorkspaceStorageFilesRequest {
  @IsOptional()
  @IsIn(STORAGE_FILE_TYPES)
  type?: StorageFileType;

  @IsOptional()
  @IsIn(STORAGE_FILE_STATUSES)
  status?: StorageFileStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(STORAGE_FILE_SORTS)
  sort?: StorageFileSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(STORAGE_FILES_MAX_PAGE_SIZE)
  pageSize?: number;
}
