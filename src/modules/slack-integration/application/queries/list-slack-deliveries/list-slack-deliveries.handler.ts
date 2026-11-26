import { Inject, Injectable } from '@nestjs/common';

import type {
  SlackDelivery,
  SlackDeliveryLog,
} from '../../../domain/repositories/slack-delivery-log.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import { ListSlackDeliveriesQuery } from './list-slack-deliveries.query';

export type SlackDeliveriesPage = {
  items: SlackDelivery[];
  nextCursor: string | null;
};

@Injectable()
export class ListSlackDeliveriesHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackDeliveryLog)
    private readonly log: SlackDeliveryLog,
  ) {}

  async execute(query: ListSlackDeliveriesQuery): Promise<SlackDeliveriesPage> {
    const rows = await this.log.listByUser(
      query.userId,
      query.cursor,
      query.limit + 1,
    );
    const items = rows.slice(0, query.limit);

    return {
      items,
      nextCursor: rows.length > query.limit ? items[items.length - 1].id : null,
    };
  }
}
