export interface GoogleUserPayload {
  subject: string;
  email: string | null;
  emailVerified: boolean;
  fullName?: string;
  avatarUrl?: string;
}
