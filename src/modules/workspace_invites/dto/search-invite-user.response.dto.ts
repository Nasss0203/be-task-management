export enum InviteSuggestionType {
  USER = 'USER',
  EMAIL = 'EMAIL',
}

export enum InviteSuggestionStatus {
  CAN_INVITE = 'CAN_INVITE',
  MEMBER = 'MEMBER',
  PENDING_INVITE = 'PENDING_INVITE',
}

export class SearchInviteUserResponseDto {
  type: InviteSuggestionType;

  user_id: string | null;

  username: string | null;

  email: string;

  full_name: string | null;

  avatar_url: string | null;

  status: InviteSuggestionStatus;
}
