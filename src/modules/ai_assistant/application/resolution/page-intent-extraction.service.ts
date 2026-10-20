import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import type { PageIntentExtractor } from './page-intent.port';

@Injectable()
export class PageIntentExtractionService {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.ports.PageIntentExtractor)
    private readonly extractor: PageIntentExtractor,
  ) {}

  extract(instruction: string) {
    if (typeof instruction !== 'string' || !instruction.trim() || instruction.length > 4000) {
      throw new BadRequestException('AI page instruction must be 1-4000 characters');
    }
    return this.extractor.extract(instruction);
  }
}
