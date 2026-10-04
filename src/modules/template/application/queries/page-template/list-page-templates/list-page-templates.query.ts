import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';

export class ListPageTemplatesQuery {
  constructor(
    public readonly userId: string,
    public readonly scope: TemplateListScope,
    public readonly workspaceId?: string,
    public readonly search?: string,
    public readonly cursor?: string,
    public readonly limit?: number,
  ) {}
}
