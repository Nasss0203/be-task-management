import { FindMyNotificationsRepositoryInput } from '../../../domain/repositories/notification.repository';

type GetNotificationsFilters = Omit<
  FindMyNotificationsRepositoryInput,
  'receiverId'
>;

export class GetNotificationsQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: GetNotificationsFilters,
  ) {}
}
