export class UserProfileResponseDto {
  id: string;
  userId: string;

  displayName: string | null;
  fullName: string | null;
  bio: string | null;
  phoneNumber: string | null;
  location: string | null;
  jobTitle: string | null;
  website: string | null;
  coverUrl: string | null;
  timezone: string | null;
  language: string | null;

  createdAt: Date;
  updatedAt: Date;
}
