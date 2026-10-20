import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { AiPageInstructionPlannerService } from './ai-page-instruction-planner.service';
import { AiModificationPlannerService } from './ai-modification-planner.service';
import { PageIntentExtractionService } from '../resolution/page-intent-extraction.service';
import { PageReferenceResolver } from '../resolution/page-reference-resolver.service';

describe('AiPageInstructionPlannerService', () => {
  const extract = jest.fn();
  const resolve = jest.fn();
  const plan = jest.fn();
  const service = new AiPageInstructionPlannerService(
    { extract } as unknown as PageIntentExtractionService,
    { resolve } as unknown as PageReferenceResolver,
    { generate: plan } as unknown as AiModificationPlannerService,
  );
  const input = {
    userId: 'actor-1',
    workspaceId: 'workspace-1',
    requestId: 'request-1',
    instruction: 'Thêm checklist vào page Release 2.0',
    currentPageId: 'wrong-page',
    shareToken: 'share-token',
  };
  const intent = {
    intent: 'MODIFY_PAGE',
    referenceType: 'TITLE',
    pageReference: 'Release 2.0',
    instruction: 'Thêm checklist',
    needsClarification: false,
  };
  const candidate = {
    pageId: 'page-1',
    workspaceId: 'workspace-1',
    title: 'Release 2.0',
    parentPageId: null,
    teamspaceId: null,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    extract.mockResolvedValue({ result: intent });
    resolve.mockResolvedValue({
      status: 'RESOLVED', page: candidate,
      resolutionMethod: 'EXACT_TITLE', confidence: 1,
    });
    plan.mockResolvedValue({
      pageId: 'page-1', status: 'PLAN_READY',
      generationId: 'generation-1', conversationId: 'conversation-1',
    });
  });

  it('resolves explicit title rather than an unrelated current page and generates preview', async () => {
    const result = await service.generate(input);
    expect(result.status).toBe('PLAN_GENERATED');
    expect(resolve).toHaveBeenCalledWith({
      userId: 'actor-1', workspaceId: 'workspace-1',
      title: 'Release 2.0', shareToken: 'share-token',
    });
    expect(plan).toHaveBeenCalledWith({
      userId: 'actor-1', requestId: 'request-1', pageId: 'page-1',
      instruction: 'Thêm checklist', shareToken: 'share-token',
    });
  });

  it('resolves current page only when currentPageId is supplied', async () => {
    extract.mockResolvedValue({ result: {
      ...intent, referenceType: 'CURRENT_PAGE', pageReference: null,
    } });
    await service.generate(input);
    expect(resolve).toHaveBeenCalledWith({
      userId: 'actor-1', workspaceId: 'workspace-1',
      currentPageId: 'wrong-page', shareToken: 'share-token',
    });
  });

  it('accepts explicit user selection only from authorized ambiguous candidates', async () => {
    const second = { ...candidate, pageId: 'page-2' };
    resolve.mockResolvedValue({ status: 'AMBIGUOUS', candidates: [candidate, second] });
    plan.mockResolvedValue({ pageId: 'page-2', status: 'PLAN_READY' });
    const result = await service.generate({ ...input, selectedPageId: 'page-2' });
    expect(result.status).toBe('PLAN_GENERATED');
    expect(plan).toHaveBeenCalledWith(expect.objectContaining({ pageId: 'page-2' }));
  });

  it('does not plan a selected ID outside authorized candidates', async () => {
    resolve.mockResolvedValue({ status: 'AMBIGUOUS', candidates: [candidate] });
    const result = await service.generate({ ...input, selectedPageId: 'private-page' });
    expect(result.status).toBe('PAGE_NOT_FOUND');
    expect(plan).not.toHaveBeenCalled();
  });

  it('does not plan a selected ID that differs from a unique resolved Page', async () => {
    const result = await service.generate({ ...input, selectedPageId: 'different-page' });
    expect(result.status).toBe('PAGE_NOT_FOUND');
    expect(plan).not.toHaveBeenCalled();
  });

  it('rejects selection without an explicit title', async () => {
    extract.mockResolvedValue({ result: { ...intent, referenceType: 'CURRENT_PAGE', pageReference: null } });
    await expect(service.generate({ ...input, selectedPageId: 'page-1' }))
      .rejects.toThrow(BadRequestException);
    expect(plan).not.toHaveBeenCalled();
  });

  it('returns a distinct non-executable result for NEED_MORE_CONTEXT', async () => {
    plan.mockResolvedValue({
      pageId: 'page-1', status: 'NEED_MORE_CONTEXT',
      operations: [],
      contextRequests: [{ reason: 'MISSING_DETAILS', description: 'More information needed' }],
      generationId: 'generation-1', conversationId: 'conversation-1',
    });
    const result = await service.generate(input);
    expect(result.status).toBe('PLAN_NEEDS_MORE_CONTEXT');
    if (result.status === 'PLAN_NEEDS_MORE_CONTEXT') {
      expect(result.plan.operations).toEqual([]);
      expect(result.plan.generationId).toBe('generation-1');
    }
  });

  it('rejects unknown planner status', async () => {
    plan.mockResolvedValue({ pageId: 'page-1', status: 'EXECUTED' });
    await expect(service.generate(input)).rejects.toThrow(BadGatewayException);
  });

  it('does not plan when current page is missing', async () => {
    extract.mockResolvedValue({ result: {
      ...intent, referenceType: 'CURRENT_PAGE', pageReference: null,
    } });
    expect(await service.generate({ ...input, currentPageId: undefined }))
      .toMatchObject({ status: 'NEEDS_CLARIFICATION', reason: 'MISSING_CURRENT_PAGE' });
    expect(resolve).not.toHaveBeenCalled();
    expect(plan).not.toHaveBeenCalled();
  });

  it.each([
    [{ intent: 'OTHER', referenceType: 'UNRESOLVED', pageReference: null, instruction: null, needsClarification: false }, 'NOT_A_PAGE_MODIFICATION'],
    [{ intent: 'UNCLEAR', referenceType: 'UNRESOLVED', pageReference: null, instruction: null, needsClarification: true }, 'NEEDS_CLARIFICATION'],
    [{ ...intent, referenceType: 'UNRESOLVED', pageReference: null, needsClarification: true }, 'NEEDS_CLARIFICATION'],
  ])('does not resolve or plan when intent is %j', async (extraction, status) => {
    extract.mockResolvedValue({ result: extraction });
    expect(await service.generate(input)).toMatchObject({ status });
    expect(resolve).not.toHaveBeenCalled();
    expect(plan).not.toHaveBeenCalled();
  });

  it.each(['NOT_FOUND', 'AMBIGUOUS'])('never plans when resolution is %s', async (status) => {
    resolve.mockResolvedValue({
      status, candidates: status === 'AMBIGUOUS' ? [candidate] : [],
    });
    expect(await service.generate(input)).toMatchObject({
      status: status === 'NOT_FOUND' ? 'PAGE_NOT_FOUND' : 'AMBIGUOUS_PAGE',
    });
    expect(plan).not.toHaveBeenCalled();
  });

  it('rejects a draft that changes resolved pageId', async () => {
    plan.mockResolvedValue({ pageId: 'different-page' });
    await expect(service.generate(input)).rejects.toThrow(BadGatewayException);
  });

  it('propagates resolver denial without planning', async () => {
    const denial = new Error('Forbidden');
    resolve.mockRejectedValue(denial);
    await expect(service.generate(input)).rejects.toBe(denial);
    expect(plan).not.toHaveBeenCalled();
  });

  it('rejects bad input before calling AI', async () => {
    await expect(service.generate({ ...input, userId: '' })).rejects.toThrow(BadRequestException);
    expect(extract).not.toHaveBeenCalled();
  });
});
