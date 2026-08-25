export class UserProfileModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,

    public readonly displayName: string | null,
    public readonly fullName: string | null,
    public readonly bio: string | null,
    public readonly phoneNumber: string | null,
    public readonly location: string | null,
    public readonly jobTitle: string | null,
    public readonly website: string | null,
    public readonly coverUrl: string | null,
    public readonly timezone: string | null,
    public readonly language: string | null,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
