import { PickType } from '@nestjs/mapped-types';
import { ListPageTemplatesRequest } from './list-page-templates.request';

export class ListPublicTemplatesRequest extends PickType(
  ListPageTemplatesRequest,
  ['search', 'cursor', 'limit'] as const,
) {}
