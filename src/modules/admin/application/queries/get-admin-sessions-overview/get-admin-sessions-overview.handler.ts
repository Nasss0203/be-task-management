import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import type {
  AdminSessionReader,
  AdminSessionsOverview,
} from '../../ports/admin-session-reader.port';

@Injectable()
export class GetAdminSessionsOverviewHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.SessionReader)
    private readonly sessionReader: AdminSessionReader,
  ) {}

  execute(): Promise<AdminSessionsOverview> {
    return this.sessionReader.getOverview();
  }
}
