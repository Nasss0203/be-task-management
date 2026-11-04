import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';

import { AiGenerationResponseDto } from './ai-generation.response.dto';

function generation(capability: string, inputData: unknown) {
  return AiGeneration.create({
    userId: 'user-1',
    workspaceId: 'workspace-1',
    conversationId: 'conversation-1',
    capability,
    inputData: inputData as Record<string, unknown>,
  });
}

describe('AiGenerationResponseDto sources (M8)', () => {
  it('returns the source Pages saved with a modification draft', () => {
    const dto = AiGenerationResponseDto.fromDomain(
      generation(AI_MODIFICATION_PLAN_CAPABILITY, {
        pageId: 'page-target',
        instruction: 'thêm checklist',
        sources: [{ pageId: 'page-bugs', title: 'Bug tracker' }],
      }),
    );

    expect(dto.sources).toEqual([{ pageId: 'page-bugs', title: 'Bug tracker' }]);
  });

  it('omits sources when the draft had none', () => {
    const dto = AiGenerationResponseDto.fromDomain(
      generation(AI_MODIFICATION_PLAN_CAPABILITY, {
        pageId: 'page-target',
        instruction: 'thêm checklist',
      }),
    );

    expect(dto).not.toHaveProperty('sources');
  });

  it('drops malformed entries, extra keys and the target Page, and keeps at most 8', () => {
    const valid = Array.from({ length: 10 }, (_, index) => ({
      pageId: `page-${index}`,
      title: `Nguồn ${index}`,
      excerpt: 'không trả ra',
    }));
    const dto = AiGenerationResponseDto.fromDomain(
      generation(AI_MODIFICATION_PLAN_CAPABILITY, {
        pageId: 'page-target',
        sources: [
          { pageId: 'page-target', title: 'Trang đích' },
          { pageId: '', title: 'Rỗng' },
          { title: 'Thiếu id' },
          null,
          ...valid,
        ],
      }),
    );

    expect(dto.sources).toEqual(
      valid.slice(0, 4).map(({ pageId, title }) => ({ pageId, title })),
    );
  });

  it('never returns sources for other capabilities', () => {
    const dto = AiGenerationResponseDto.fromDomain(
      generation(PAGE_COMPOSITION_CAPABILITY, {
        sources: [{ pageId: 'page-bugs', title: 'Bug tracker' }],
      }),
    );

    expect(dto).not.toHaveProperty('sources');
  });
});
