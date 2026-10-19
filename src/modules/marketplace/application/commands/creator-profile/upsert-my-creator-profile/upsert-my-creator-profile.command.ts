import type { CreatorProfileDetails } from '../../../../domain/entities/creator-profile.entity';

export class UpsertMyCreatorProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly details: CreatorProfileDetails,
  ) {}
}
