import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Phase 3 input: the client never supplies a target pageId. */
export class GenerateAiPagePlanFromInstructionRequestDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  instruction: string;

  /** Only used when the instruction explicitly refers to the current Page. */
  @IsOptional()
  @IsUUID()
  currentPageId?: string;

  /** Explicit user choice after AMBIGUOUS_PAGE; never inferred by AI. */
  @IsOptional()
  @IsUUID()
  selectedPageId?: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
