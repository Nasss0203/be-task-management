import {
  AdminTemplateOfferFilter,
  AdminTemplateStatusFilter,
} from '../../ports/admin-template-reader.port';

export class ListAdminTemplatesQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly status: AdminTemplateStatusFilter = AdminTemplateStatusFilter.ALL,
    public readonly offerType: AdminTemplateOfferFilter = AdminTemplateOfferFilter.ALL,
    public readonly categoryId?: string,
  ) {}
}
