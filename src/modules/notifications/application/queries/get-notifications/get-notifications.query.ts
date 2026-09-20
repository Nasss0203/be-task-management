import { FindMyNotificationsRepositoryInput } from '../../../domain/repositories/notification.repository';

type GetNotificationsFilters = Omit<
  FindMyNotificationsRepositoryInput,
  'receiverId' | 'cursor' | 'limit'
> & {
  cursor?: string;
  limit?: string;
};

export class GetNotificationsQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: GetNotificationsFilters,
  ) {}
}
