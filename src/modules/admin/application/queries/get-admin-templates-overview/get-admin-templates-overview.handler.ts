import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import type {
  AdminTemplateReader,
  AdminTemplatesOverview,
} from '../../ports/admin-template-reader.port';

@Injectable()
export class GetAdminTemplatesOverviewHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.TemplateReader)
    private readonly templateReader: AdminTemplateReader,
  ) {}

  execute(): Promise<AdminTemplatesOverview> {
    return this.templateReader.getOverview();
  }
}
