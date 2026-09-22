import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminBillingWebhookEventListResponseDto } from '../../dto/response/admin-billing-webhook-event-list.response.dto';
import type { AdminBillingWebhookReader } from '../../ports/admin-billing-webhook-reader.port';
import { ListAdminBillingWebhookEventsQuery } from './list-admin-billing-webhook-events.query';

@Injectable()
export class ListAdminBillingWebhookEventsHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.BillingWebhookReader)
    private readonly adminBillingWebhookReader: AdminBillingWebhookReader,
  ) {}

  async execute(
    query: ListAdminBillingWebhookEventsQuery,
  ): Promise<AdminBillingWebhookEventListResponseDto> {
    const result = await this.adminBillingWebhookReader.listWebhookEvents({
      page: query.page,
      limit: query.limit,
      search: query.search,
      provider: query.provider,
      status: query.status,
      eventType: query.eventType,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages:
        result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
    };
  }
}
