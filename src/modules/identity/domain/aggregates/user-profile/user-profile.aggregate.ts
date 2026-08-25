export class UserProfileAggregate {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public displayName: string | null,
    public fullName: string | null,
    public bio: string | null,
    public phoneNumber: string | null,
    public location: string | null,
    public jobTitle: string | null,
    public website: string | null,
    public coverUrl: string | null,
    public timezone: string | null,
    public language: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
