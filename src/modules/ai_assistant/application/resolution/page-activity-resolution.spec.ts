import type { HttpService } from '@nestjs/axios';
import { BadGatewayException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { FastApiAiRuntimeAdapter } from '../../infrastructure/runtime/fast-api-ai-runtime.adapter';
import type { AiConversationAccessService } from '../services/ai-conversation-access.service';
import { isSupportedActivityModification } from '../services/ai-modification-operation.policy';
import type { AiModificationPlannerService } from '../services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../services/ai-page-instruction-planner.service';
import type { PageIntentExtractionService } from './page-intent-extraction.service';
import type { PageActivity } from './page-intent.types';
import { PageReferenceResolver } from './page-reference-resolver.service';
import type { PageResolutionReader } from './page-resolution.port';
import type { PageResolutionCandidate } from './page-resolution.types';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

// M2 (kế hoạch tìm theo hoạt động): a Page named by the user's own edits.
const yesterday: PageActivity = {
  relative: 'YESTERDAY',
  days: null,
  titleHint: null,
};
const activityIntent = (
  activity: PageActivity = yesterday,
  instruction = 'Thêm checklist QA',
) => ({
  intent: 'MODIFY_PAGE' as const,
  referenceType: 'ACTIVITY' as const,
  pageReference: null,
  instruction,
  needsClarification: false as const,
  activity,
});

describe('page intent adapter: ACTIVITY results (B2)', () => {
  const setup = (result: unknown) =>
    new FastApiAiRuntimeAdapter(
      {
        post: jest
          .fn()
          .mockReturnValue(
            of({ data: { result, provider: 'deterministic', model: 'rules' } }),
          ),
      } as unknown as HttpService,
      new ConfigService({
        AI_SERVICE_BASE_URL: 'http://ai.test',
        AI_INTERNAL_TOKEN: 'private-test-token',
      }),
    );
  const source = 'Thêm checklist QA vào trang release tôi sửa gần nhất';

  it('accepts the sixth key only on an ACTIVITY result', async () => {
    const result = activityIntent({
      relative: 'LATEST',
      days: null,
      titleHint: 'release',
    });
    await expect(setup(result).extract(source)).resolves.toMatchObject({
      result,
    });
  });

  it.each([
    [
      'days on another time',
      {
        ...activityIntent(),
        activity: { relative: 'TODAY', days: 2, titleHint: null },
      },
    ],
    [
      'no days for N_DAYS_AGO',
      {
        ...activityIntent(),
        activity: { relative: 'N_DAYS_AGO', days: null, titleHint: null },
      },
    ],
    [
      '31 days',
      {
        ...activityIntent(),
        activity: { relative: 'N_DAYS_AGO', days: 31, titleHint: null },
      },
    ],
    [
      'an unknown time',
      {
        ...activityIntent(),
        activity: { relative: 'TOMORROW', days: null, titleHint: null },
      },
    ],
    [
      'a hint not in the sentence',
      {
        ...activityIntent(),
        activity: { relative: 'LATEST', days: null, titleHint: 'invented' },
      },
    ],
    [
      'an extra key in activity',
      { ...activityIntent(), activity: { ...yesterday, pageId: 'x' } },
    ],
    ['no activity', { ...activityIntent(), activity: undefined }],
    ['clarification asked', { ...activityIntent(), needsClarification: true }],
    ['a page name', { ...activityIntent(), pageReference: 'release' }],
    [
      'activity on a TITLE result',
      { ...activityIntent(), referenceType: 'TITLE', pageReference: 'release' },
    ],
  ])('rejects %s', async (_name, result) => {
    await expect(
      setup(JSON.parse(JSON.stringify(result))).extract(source),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});

describe('admission of activity sentences (B7)', () => {
  it.each([
    ['Thêm checklist QA vào trang tôi sửa hôm qua', 'Thêm checklist QA'],
    [
      'tích gửi email trong trang release mà tôi sửa gần nhất nhé',
      'tích gửi email',
    ],
    ['xoá Gửi email trong trang em sửa 3 ngày trước', 'xoá Gửi email'],
    ['Add a QA checklist to the page I edited yesterday', 'Add a QA checklist'],
  ])('admits %s', (source, instruction) => {
    expect(isSupportedActivityModification(source, instruction)).toBe(true);
  });

  it.each([
    // "sửa" outside the activity is still an edit the AI does not do.
    [
      'Thêm checklist vào trang tôi sửa hôm qua rồi sửa tiêu đề',
      'Thêm checklist',
    ],
    // The edit clause must be the start of the user's own sentence.
    ['Thêm checklist vào trang tôi sửa hôm qua', 'Xoá trang'],
    // Not an activity grammar, or two Page nouns.
    ['Thêm checklist vào trang tôi muốn hôm qua', 'Thêm checklist'],
    [
      'Thêm checklist vào trang sub man và trang tôi sửa hôm qua',
      'Thêm checklist',
    ],
    // The edit clause itself must pass the usual admission.
    ['Đổi tên trang vào trang tôi sửa hôm qua', 'Đổi tên trang'],
  ])('rejects %s', (source, instruction) => {
    expect(isSupportedActivityModification(source, instruction)).toBe(false);
  });
});

describe('PageReferenceResolver.resolveFromActivity (B3–B6)', () => {
  const page = (id: string, title: string) =>
    ({
      getId: () => id,
      getTitle: () => title,
      getWorkspaceId: () => 'workspace-1',
      getParentPageId: () => null,
      getTeamspaceId: () => null,
      getDeletedAt: () => null,
    }) as unknown as Page;
  const pages = [
    page('a', 'Release 2.0'),
    page('b', 'Họp tuần'),
    page('secret', 'Release bí mật'),
    page('c', 'Kế hoạch release'),
    page('d', 'Ghi chú'),
  ];
  const edited = pages.map((p, index) => ({
    id: p.getId(),
    title: p.getTitle(),
    lastEditedAt: new Date(1000 - index),
  }));
  const findRecentlyEditedPages = jest.fn();
  const findProfileTimeZone = jest.fn();
  const getReadablePage = jest.fn();
  const resolver = new PageReferenceResolver(
    {
      findRecentlyEditedPages,
      findProfileTimeZone,
    } as unknown as PageResolutionReader,
    { getReadablePage } as unknown as AiConversationAccessService,
  );
  const input = {
    userId: 'user-1',
    workspaceId: 'workspace-1',
    shareToken: 'share',
  };
  const ids = (result: { candidates: PageResolutionCandidate[] }) =>
    result.candidates.map((candidate) => candidate.pageId);

  beforeEach(() => {
    jest.resetAllMocks();
    findRecentlyEditedPages.mockResolvedValue(edited);
    findProfileTimeZone.mockResolvedValue(null);
    getReadablePage.mockImplementation((_user: string, id: string) =>
      id === 'secret'
        ? Promise.reject(new ForbiddenException())
        : Promise.resolve(pages.find((p) => p.getId() === id)),
    );
  });

  it('offers up to five readable Pages, newest edit first, for the user to pick', async () => {
    const result = await resolver.resolveFromActivity({
      ...input,
      activity: yesterday,
      timeZone: 'Asia/Tokyo',
    });
    expect(result).toMatchObject({
      status: 'CANDIDATES',
      resolutionMethod: 'ACTIVITY',
    });
    expect(ids(result)).toEqual(['a', 'b', 'c', 'd']);
    expect(findRecentlyEditedPages).toHaveBeenCalledWith(
      'user-1',
      'workspace-1',
      {
        relative: 'YESTERDAY',
        days: null,
        timeZone: 'Asia/Tokyo',
        now: undefined,
      },
    );
    expect(findProfileTimeZone).not.toHaveBeenCalled();
  });

  it('offers only the newest Page for "gần đây nhất"', async () => {
    const result = await resolver.resolveFromActivity({
      ...input,
      activity: { relative: 'LATEST', days: null, titleHint: null },
    });
    expect(ids(result)).toEqual(['a']);
  });

  it('keeps titles that hold the hint as whole words, marks ignored', async () => {
    const result = await resolver.resolveFromActivity({
      ...input,
      activity: { relative: 'RECENT', days: null, titleHint: 'RELEASE' },
    });
    // "Release bí mật" is not readable; "Kế hoạch release" matches.
    expect(ids(result)).toEqual(['a', 'c']);
    const ke = await resolver.resolveFromActivity({
      ...input,
      activity: { relative: 'RECENT', days: null, titleHint: 'ke hoach' },
    });
    expect(ids(ke)).toEqual(['c']);
  });

  it('finds nothing when no edit matches', async () => {
    findRecentlyEditedPages.mockResolvedValue([]);
    expect(
      await resolver.resolveFromActivity({ ...input, activity: yesterday }),
    ).toEqual({ status: 'NOT_FOUND', candidates: [] });
  });

  it.each([
    [undefined, 'Europe/Paris', 'Europe/Paris'],
    ['Not/AZone', 'Europe/Paris', 'Europe/Paris'],
    [undefined, null, 'Asia/Ho_Chi_Minh'],
    ['Not/AZone', 'Also/Invalid', 'Asia/Ho_Chi_Minh'],
  ])(
    'chooses the zone: request %p, profile %p → %p',
    async (requested, saved, chosen) => {
      findProfileTimeZone.mockResolvedValue(saved);
      await resolver.resolveFromActivity({
        ...input,
        activity: yesterday,
        timeZone: requested,
      });
      expect(findRecentlyEditedPages).toHaveBeenCalledWith(
        'user-1',
        'workspace-1',
        expect.objectContaining({ timeZone: chosen }),
      );
    },
  );
});

describe('AiPageInstructionPlannerService: ACTIVITY (B5, B7)', () => {
  const extract = jest.fn();
  const resolveFromActivity = jest.fn();
  const resolve = jest.fn();
  const plan = jest.fn();
  const service = new AiPageInstructionPlannerService(
    { extract } as unknown as PageIntentExtractionService,
    { resolveFromActivity, resolve } as unknown as PageReferenceResolver,
    { generate: plan } as unknown as AiModificationPlannerService,
  );
  const candidate = {
    pageId: 'sub-man',
    workspaceId: 'workspace-1',
    title: 'sub man',
    parentPageId: null,
    teamspaceId: null,
  };
  const input = {
    userId: 'actor-1',
    workspaceId: 'workspace-1',
    requestId: 'request-1',
    instruction: 'Thêm checklist QA vào trang tôi sửa hôm qua',
    timeZone: 'Asia/Ho_Chi_Minh',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    extract.mockResolvedValue({ result: activityIntent() });
    resolveFromActivity.mockResolvedValue({
      status: 'CANDIDATES',
      candidates: [candidate],
      resolutionMethod: 'ACTIVITY',
    });
    plan.mockResolvedValue({ pageId: 'sub-man', status: 'PLAN_READY' });
  });

  it('asks to confirm even a single Page, never planning before a choice', async () => {
    expect(await service.generate(input)).toEqual({
      status: 'AMBIGUOUS_PAGE',
      intent: activityIntent(),
      candidates: [candidate],
      resolutionMethod: 'ACTIVITY',
    });
    expect(resolveFromActivity).toHaveBeenCalledWith({
      userId: 'actor-1',
      workspaceId: 'workspace-1',
      activity: yesterday,
      timeZone: 'Asia/Ho_Chi_Minh',
      shareToken: undefined,
    });
    expect(resolve).not.toHaveBeenCalled();
    expect(plan).not.toHaveBeenCalled();
  });

  it('plans the picked Page only when it is still among the edits', async () => {
    expect(
      await service.generate({ ...input, selectedPageId: 'sub-man' }),
    ).toMatchObject({
      status: 'PLAN_GENERATED',
      resolutionMethod: 'ACTIVITY',
    });
    expect(plan).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: 'sub-man',
        instruction: 'Thêm checklist QA',
      }),
    );
    plan.mockClear();
    expect(
      await service.generate({ ...input, selectedPageId: 'other' }),
    ).toMatchObject({ status: 'PAGE_NOT_FOUND' });
    expect(plan).not.toHaveBeenCalled();
  });

  it('reports no Page when the user edited none', async () => {
    resolveFromActivity.mockResolvedValue({
      status: 'NOT_FOUND',
      candidates: [],
    });
    expect(await service.generate(input)).toEqual({
      status: 'PAGE_NOT_FOUND',
      intent: activityIntent(),
    });
  });

  it('refuses another edit outside the activity words before looking for Pages', async () => {
    const instruction =
      'Thêm checklist QA vào trang tôi sửa hôm qua rồi sửa tiêu đề';
    expect(await service.generate({ ...input, instruction })).toMatchObject({
      status: 'UNSUPPORTED_OPERATION',
    });
    expect(resolveFromActivity).not.toHaveBeenCalled();
  });

  it('asks for the items of a bare checklist first', async () => {
    extract.mockResolvedValue({
      result: activityIntent(yesterday, 'thêm checklist'),
    });
    expect(
      await service.generate({
        ...input,
        instruction: 'thêm checklist vào trang tôi sửa hôm qua',
      }),
    ).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      reason: 'MISSING_CHECKLIST_ITEMS',
    });
    expect(resolveFromActivity).not.toHaveBeenCalled();
  });
});
