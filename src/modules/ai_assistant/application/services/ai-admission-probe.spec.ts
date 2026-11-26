import {
  probe,
  probeTitles,
  probeWriting,
} from '../../../../../scripts/ai-admission-probe';

const MEETING = '00000000-0000-4000-8000-00000000000a';
const NEAR = '00000000-0000-4000-8000-00000000000b';
const OPEN = '00000000-0000-4000-8000-00000000000c';
const PAGES = [
  { id: MEETING, title: 'Hội họp tuần' },
  { id: NEAR, title: 'Hội họp' },
  { id: OPEN, title: 'Nhật ký cá nhân' },
];
const SENTENCE = 'thêm việc gọi khách vào trang Hội họp tuần';

function intent(referenceType: string, pageReference: string | null) {
  return {
    intent: 'MODIFY_PAGE',
    referenceType,
    pageReference,
    instruction: 'thêm việc gọi khách',
    confidence: 1,
    needsClarification: false,
  };
}

describe('ai-admission-probe', () => {
  it('gives the planner the Page the sentence names', async () => {
    const result = await probe({
      id: 'a',
      instruction: SENTENCE,
      pageTitle: 'Hội họp tuần',
      pages: PAGES,
      currentPageId: OPEN,
      pageIntent: intent('TITLE', 'Hội họp tuần'),
    });
    expect(result.stage).toBe('admitted');
    expect(result.pageTitle).toBe('Hội họp tuần');
  });

  it('shows a Page with a nearly equal name when that is what was read', async () => {
    const result = await probe({
      id: 'b',
      instruction: 'thêm việc gọi khách vào trang Hội họp',
      pageTitle: 'Hội họp tuần',
      pages: PAGES,
      pageIntent: intent('TITLE', 'Hội họp'),
    });
    expect(result.pageTitle).toBe('Hội họp');
  });

  it('shows the open Page when the sentence was read as the current Page', async () => {
    const result = await probe({
      id: 'c',
      instruction: 'thêm việc gọi khách vào trang này',
      pageTitle: 'Hội họp tuần',
      pages: PAGES,
      currentPageId: OPEN,
      pageIntent: intent('CURRENT_PAGE', null),
    });
    expect(result.stage).toBe('admitted');
    expect(result.pageTitle).toBe('Nhật ký cá nhân');
  });

  it('keeps working with one sample Page', async () => {
    const result = await probe({
      id: 'd',
      instruction: SENTENCE,
      pageTitle: 'Hội họp tuần',
      pageIntent: intent('TITLE', 'Hội họp tuần'),
    });
    expect(result.stage).toBe('admitted');
    expect(result.pageTitle).toBe('Hội họp tuần');
  });

  it('refuses before a draft exists', async () => {
    const result = await probe({
      id: 'e',
      instruction: 'chia sẻ trang Hội họp tuần cho cả nhóm',
      pageTitle: 'Hội họp tuần',
      pages: PAGES,
      pageIntent: {
        ...intent('TITLE', 'Hội họp tuần'),
        instruction: 'chia sẻ trang Hội họp tuần cho cả nhóm',
      },
    });
    expect(result.stage).toBe('refused');
  });

  it.each([
    ['ollama', { stage: 'clarify', reason: 'RULE_DRAFT_REQUIRED' }],
    ['rules', { stage: 'admitted' }],
  ])(
    'takes a %s draft of a sentence only the A4 additions admit (A4c)',
    async (planProvider, expected) => {
      const result = await probe({
        id: 'g',
        instruction: 'ghi việc gọi khách vào trang Hội họp tuần',
        pageTitle: 'Hội họp tuần',
        pages: PAGES,
        pageIntent: {
          ...intent('TITLE', 'Hội họp tuần'),
          instruction: 'ghi việc gọi khách',
        },
        plan: { status: 'PLAN_READY', operations: [{ type: 'INSERT_BLOCKS' }] },
        planProvider,
      });
      expect(result).toMatchObject(expected);
    },
  );

  it('admits such a sentence before any draft is made (A4c)', async () => {
    const result = await probe({
      id: 'g0',
      instruction: 'ghi việc gọi khách vào trang Hội họp tuần',
      pageTitle: 'Hội họp tuần',
      pages: PAGES,
      pageIntent: {
        ...intent('TITLE', 'Hội họp tuần'),
        instruction: 'ghi việc gọi khách',
      },
    });
    expect(result).toMatchObject({ stage: 'admitted' });
  });

  it.each([
    ['ghi việc gọi khách vào trang Hội họp tuần', 'ghi việc gọi khách', true],
    ['thêm việc gọi thợ vào trang Hội họp tuần', 'thêm việc gọi thợ', false],
  ])(
    'tells whether "%s" is admitted only by the A4 additions (A4d)',
    async (instruction, command, relaxedOnly) => {
      const result = await probe({
        id: 'r',
        instruction,
        pageTitle: 'Hội họp tuần',
        pages: PAGES,
        pageIntent: {
          ...intent('TITLE', 'Hội họp tuần'),
          instruction: command,
        },
      });
      expect(result).toMatchObject({ stage: 'admitted', relaxedOnly });
    },
  );

  it('says why a sentence was refused (A4)', async () => {
    const result = await probe({
      id: 'f',
      instruction: 'chia sẻ trang Hội họp tuần cho cả nhóm',
      pageTitle: 'Hội họp tuần',
      pages: PAGES,
      pageIntent: {
        ...intent('TITLE', 'Hội họp tuần'),
        instruction: 'chia sẻ trang Hội họp tuần cho cả nhóm',
      },
    });
    expect(result).toMatchObject({
      status: 'UNSUPPORTED_OPERATION',
      why: 'BLOCKED_WORD',
    });
  });

  const writing = {
    intent: 'WRITING',
    writingAction: 'SUMMARIZE',
    language: null,
    confidence: 1,
  };

  it('takes the selected text', () => {
    expect(
      probeWriting({
        id: 'f',
        kind: 'writing',
        instruction: 'tóm tắt đoạn này',
        selectedText: 'Cả nhóm họp xong sớm.',
        intent: writing,
      }).source,
    ).toEqual({ text: 'Cả nhóm họp xong sớm.' });
  });

  it('takes the words of a sentence written in one go', () => {
    expect(
      probeWriting({
        id: 'g',
        kind: 'writing',
        instruction: 'tóm tắt khách hàng rất hài lòng với bản demo',
        selectedText: null,
        intent: writing,
      }).source,
    ).toEqual({ text: 'khách hàng rất hài lòng với bản demo' });
  });

  it('finds no text when there is none', () => {
    expect(
      probeWriting({
        id: 'h',
        kind: 'writing',
        instruction: 'tóm tắt đoạn này',
        selectedText: null,
        intent: writing,
      }).source,
    ).toBeNull();
  });

  it('gives the real titles in the sentence like NestJS does (G2a)', () => {
    expect(
      probeTitles({
        id: 'i',
        kind: 'titles',
        instruction: 'trang Hội họp tuần họp lúc mấy giờ',
        pages: PAGES,
      }).titles,
    ).toEqual(['Hội họp tuần']);
  });
});
