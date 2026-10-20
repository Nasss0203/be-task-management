export interface AiHistoryPageResponseDto<T> {
  items: T[];
  nextCursor: string | null;
}
