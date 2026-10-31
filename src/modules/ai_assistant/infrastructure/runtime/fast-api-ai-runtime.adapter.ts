import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../application/constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../../application/constants/page-composition.constant';
import type {
  EmbeddingBatch,
  EmbeddingKind,
  TextEmbedder,
} from '../../application/embedding/page-embedding.port';
import type {
  AiRuntimePort,
  AiRuntimeRequest,
  AiRuntimeResult,
} from '../../application/ports/ai-runtime.port';
import type { PageIntentExtractor } from '../../application/resolution/page-intent.port';
import type { PageIntentResult } from '../../application/resolution/page-intent.types';
import {
  AI_INTENTS,
  WRITING_ACTIONS,
} from '../../application/ports/ai-intent.port';
import type {
  AiIntentPort,
  AiIntentRequest,
  AiIntentResult,
} from '../../application/ports/ai-intent.port';
import { hasSourceBackedCurrentPage } from '../../application/services/ai-modification-operation.policy';

type WritingAction =
  | 'IMPROVE'
  | 'SHORTEN'
  | 'EXPAND'
  | 'SUMMARIZE'
  | 'TRANSLATE'
  | 'CONTINUE';

interface FastApiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface FastApiWritingRequest {
  action: WritingAction;
  text: string;
  language?: string | null;
}

interface FastApiWritingResponse {
  result: string;
  provider: string;
  model: string;
  usage?: FastApiUsage;
}

interface FastApiPageCompositionRequest {
  instruction: string;
  context?: Record<string, unknown>;
}

interface FastApiPageCompositionResponse {
  result: Record<string, unknown>;
  provider: string;
  model: string;
  usage?: FastApiUsage;
}

interface FastApiModificationPlannerRequest {
  instruction: string;
  context: Record<string, unknown>;
  /** M8 (I4): passages of other Pages, read only; only when there are any. */
  references?: unknown[];
}

interface FastApiModificationPlannerResponse {
  result: Record<string, unknown>;
  provider: string;
  model: string;
  usage?: FastApiUsage;
}

const WRITING_CAPABILITIES: Record<string, WritingAction> = {
  'writing.improve': 'IMPROVE',
  'writing.shorten': 'SHORTEN',
  'writing.expand': 'EXPAND',
  'writing.summarize': 'SUMMARIZE',
  'writing.translate': 'TRANSLATE',
  'writing.continue': 'CONTINUE',
};

const ACTIVITY_RELATIVES = new Set([
  'LATEST',
  'TODAY',
  'YESTERDAY',
  'N_DAYS_AGO',
  'LAST_WEEK',
  'RECENT',
]);

/** M4: names from the user's own sentence; at least one place. */
function isPageScope(value: unknown, instruction: string): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const scope = value as Record<string, unknown>;
  if (Object.keys(scope).sort().join(',') !== 'parentTitle,teamspaceName')
    return false;
  const sentence = instruction.normalize('NFC').toLocaleLowerCase('vi');
  const named = (name: unknown) =>
    typeof name === 'string' &&
    !!name.trim() &&
    name.length <= 255 &&
    sentence.includes(name.normalize('NFC').toLocaleLowerCase('vi'));
  return (
    (scope.parentTitle === null || named(scope.parentTitle)) &&
    (scope.teamspaceName === null || named(scope.teamspaceName)) &&
    (scope.parentTitle !== null || scope.teamspaceName !== null)
  );
}

/** M6 / M7: a description or topic is the user's own words, never invented. */
function isPageDescription(value: unknown, instruction: string): boolean {
  return (
    typeof value === 'string' &&
    !!value.trim() &&
    value.length <= 255 &&
    instruction
      .normalize('NFC')
      .toLocaleLowerCase('vi')
      .includes(value.normalize('NFC').toLocaleLowerCase('vi'))
  );
}

/** M2: words of the user's own sentence only; NestJS computes the dates. */
function isPageActivity(value: unknown, instruction: string): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const activity = value as Record<string, unknown>;
  if (Object.keys(activity).sort().join(',') !== 'days,relative,titleHint')
    return false;
  const { relative, days, titleHint } = activity;
  const nDays =
    typeof days === 'number' &&
    Number.isInteger(days) &&
    days >= 1 &&
    days <= 30;
  return (
    typeof relative === 'string' &&
    ACTIVITY_RELATIVES.has(relative) &&
    (relative === 'N_DAYS_AGO' ? nDays : days === null) &&
    (titleHint === null ||
      (typeof titleHint === 'string' &&
        !!titleHint.trim() &&
        titleHint.length <= 255 &&
        // A hint is the user's own words, never invented by the service.
        instruction
          .normalize('NFC')
          .toLocaleLowerCase('vi')
          .includes(titleHint.normalize('NFC').toLocaleLowerCase('vi'))))
  );
}

const AI_RETRY_DELAY_MS = 1500;

/** No answer at all, or the AI service's own 503 (Ollama unavailable). */
function isBrieflyUnavailable(error: unknown): boolean {
  return (
    error instanceof ServiceUnavailableException ||
    (error instanceof BadGatewayException &&
      error.message === 'AI service returned HTTP 503')
  );
}

@Injectable()
export class FastApiAiRuntimeAdapter
  implements AiRuntimePort, PageIntentExtractor, AiIntentPort, TextEmbedder
{
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async classify(request: AiIntentRequest): Promise<AiIntentResult> {
    const raw = await this.postRetryingOnce<unknown>(
      '/internal/v1/intent',
      request,
    );
    const invalid = () =>
      new BadGatewayException('AI service returned an invalid response');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw invalid();
    const envelope = raw as Record<string, unknown>;
    if (
      Object.keys(envelope).sort().join(',') !== 'model,provider,result' ||
      typeof envelope.provider !== 'string' ||
      !envelope.provider.trim() ||
      typeof envelope.model !== 'string' ||
      !envelope.model.trim() ||
      !envelope.result ||
      typeof envelope.result !== 'object' ||
      Array.isArray(envelope.result)
    )
      throw invalid();
    const result = envelope.result as Record<string, unknown>;
    if (
      Object.keys(result).sort().join(',') !==
        'intent,language,needsClarification,writingAction' ||
      !AI_INTENTS.some((value) => value === result.intent) ||
      typeof result.needsClarification !== 'boolean' ||
      (result.intent === 'UNCLEAR' && !result.needsClarification)
    )
      throw invalid();
    if (result.intent === 'WRITING') {
      if (!WRITING_ACTIONS.some((value) => value === result.writingAction))
        throw invalid();
      if (result.writingAction !== 'TRANSLATE' && result.language !== null)
        throw invalid();
      if (
        result.language !== null &&
        (typeof result.language !== 'string' ||
          !result.language.trim() ||
          result.language.length > 100)
      )
        throw invalid();
    } else if (result.writingAction !== null || result.language !== null)
      throw invalid();
    return raw as AiIntentResult;
  }

  /** M5 (F6): one unit vector per text; anything else is refused whole. */
  async embed(kind: EmbeddingKind, texts: string[]): Promise<EmbeddingBatch> {
    const raw: unknown = await this.postRetryingOnce<unknown>(
      '/internal/v1/embeddings',
      { kind, texts },
    );
    const invalid = () =>
      new BadGatewayException('AI service returned an invalid response');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw invalid();
    const response = raw as Record<string, unknown>;
    const { model, dimensions, embeddings } = response;
    if (
      Object.keys(response).sort().join(',') !==
        'dimensions,embeddings,model' ||
      typeof model !== 'string' ||
      !model.trim() ||
      !Number.isInteger(dimensions) ||
      (dimensions as number) <= 0 ||
      !Array.isArray(embeddings) ||
      embeddings.length !== texts.length ||
      !embeddings.every(
        (vector) =>
          Array.isArray(vector) &&
          vector.length === dimensions &&
          vector.every(
            (value) => typeof value === 'number' && Number.isFinite(value),
          ),
      )
    )
      throw invalid();
    return {
      model,
      dimensions: dimensions as number,
      embeddings: embeddings as number[][],
    };
  }

  async extract(
    instruction: string,
    currentPageId?: string,
  ): Promise<PageIntentResult> {
    const raw: unknown = await this.postRetryingOnce<unknown>(
      '/internal/v1/page-intent',
      { instruction, ...(currentPageId ? { currentPageId } : {}) },
    );
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new BadGatewayException('AI service returned an invalid response');
    }
    const response = raw as Record<string, unknown>;
    const value = response.result;
    if (
      Object.keys(response).sort().join(',') !== 'model,provider,result' ||
      typeof response.provider !== 'string' || !response.provider.trim() ||
      typeof response.model !== 'string' || !response.model.trim() ||
      !value || typeof value !== 'object' || Array.isArray(value)
    ) {
      throw new BadGatewayException('AI service returned an invalid response');
    }
    // M8: any edit may also carry "basedOn", the source the user named.
    const { basedOn, ...result } = value as Record<string, unknown>;
    // M2: only an ACTIVITY result carries the sixth key, "activity"; M4: only
    // a TITLE result may carry "scope"; M6: only a DESCRIPTION, "description";
    // M7: only a CONTENT result, "topic".
    const keys = Object.keys(result).sort().join(',');
    const base =
      'instruction,intent,needsClarification,pageReference,referenceType';
    const validKeys =
      result.referenceType === 'ACTIVITY'
        ? keys === `activity,${base}`
        : result.referenceType === 'DESCRIPTION'
          ? keys === `description,${base}`
          : result.referenceType === 'CONTENT'
            ? keys === `${base},topic`
            : keys === base ||
            (result.referenceType === 'TITLE' && keys === `${base},scope`);
    const intent = result.intent;
    const referenceType = result.referenceType;
    const needsClarification = result.needsClarification;
    const pageReference = result.pageReference;
    const editInstruction = result.instruction;
    let valid = validKeys && typeof needsClarification === 'boolean';
    if (intent === 'MODIFY_PAGE') {
      valid = valid && typeof editInstruction === 'string' && !!editInstruction.trim()
        && editInstruction.length <= 4000;
      if (referenceType === 'TITLE') {
        valid = valid && typeof pageReference === 'string' && !!pageReference.trim()
          && instruction.normalize('NFC').toLocaleLowerCase('vi').includes(
            pageReference.normalize('NFC').toLocaleLowerCase('vi'),
          ) && !needsClarification
          && (result.scope === undefined || isPageScope(result.scope, instruction));
      } else if (referenceType === 'CURRENT_PAGE') {
        valid = valid && pageReference === null && !needsClarification
          && hasSourceBackedCurrentPage(instruction, currentPageId);
      } else if (referenceType === 'UNRESOLVED') {
        valid = valid && pageReference === null && needsClarification === true;
      } else if (referenceType === 'ACTIVITY') {
        valid =
          valid &&
          pageReference === null &&
          needsClarification === false &&
          isPageActivity(result.activity, instruction);
      } else if (referenceType === 'DESCRIPTION') {
        valid =
          valid &&
          pageReference === null &&
          needsClarification === false &&
          isPageDescription(result.description, instruction);
      } else if (referenceType === 'CONTENT') {
        valid =
          valid &&
          pageReference === null &&
          needsClarification === false &&
          isPageDescription(result.topic, instruction);
      } else {
        valid = false;
      }
    } else if (intent === 'OTHER' || intent === 'UNCLEAR') {
      valid = valid && referenceType === 'UNRESOLVED' && pageReference === null
        && editInstruction === null && needsClarification === (intent === 'UNCLEAR');
    } else {
      valid = false;
    }
    valid =
      valid &&
      (basedOn === undefined ||
        (intent === 'MODIFY_PAGE' && isPageDescription(basedOn, instruction)));
    if (!valid) {
      throw new BadGatewayException('AI service returned an invalid response');
    }
    return raw as PageIntentResult;
  }

  async execute(request: AiRuntimeRequest): Promise<AiRuntimeResult> {
    if (request.capability === PAGE_COMPOSITION_CAPABILITY) {
      return this.executePageComposition(request);
    }

    if (request.capability === AI_MODIFICATION_PLAN_CAPABILITY) {
      return this.executeModificationPlanner(request);
    }

    const action = WRITING_CAPABILITIES[request.capability];

    if (!action) {
      throw new BadRequestException(
        `Unsupported AI capability: ${request.capability}`,
      );
    }

    return this.executeWriting(request, action);
  }

  private async executeWriting(
    request: AiRuntimeRequest,
    action: WritingAction,
  ): Promise<AiRuntimeResult> {
    const text = this.getText(request.input);
    const language = this.getOptionalString(request.input, 'language');

    const payload: FastApiWritingRequest = {
      action,
      text,
      language,
    };

    const response = await this.post<FastApiWritingResponse>(
      '/internal/v1/writing',
      payload,
    );

    if (
      !response.result ||
      typeof response.result !== 'string' ||
      !response.result.trim()
    ) {
      throw new BadGatewayException('AI service returned an invalid response');
    }

    return {
      output: {
        text: response.result,
      },
      provider: response.provider,
      model: response.model,
      ...this.mapUsage(response),
    };
  }

  private async executePageComposition(
    request: AiRuntimeRequest,
  ): Promise<AiRuntimeResult> {
    if (typeof request.content !== 'string' || !request.content.trim()) {
      throw new BadRequestException('Page composition instruction is required');
    }

    const payload: FastApiPageCompositionRequest = {
      instruction: request.content,
      ...(request.context
        ? {
            context: request.context,
          }
        : {}),
    };

    const response = await this.post<FastApiPageCompositionResponse>(
      '/internal/v1/page-composition',
      payload,
    );

    if (
      !response.result ||
      typeof response.result !== 'object' ||
      Array.isArray(response.result)
    ) {
      throw new BadGatewayException('AI service returned an invalid response');
    }

    return {
      output: response.result,
      provider: response.provider,
      model: response.model,
      ...this.mapUsage(response),
    };
  }

  private async executeModificationPlanner(
    request: AiRuntimeRequest,
  ): Promise<AiRuntimeResult> {
    if (typeof request.content !== 'string' || !request.content.trim()) {
      throw new BadRequestException(
        'AI modification plan instruction is required',
      );
    }

    if (
      !request.context ||
      typeof request.context !== 'object' ||
      Array.isArray(request.context)
    ) {
      throw new BadRequestException('AI modification plan context is required');
    }

    const references = request.input.references;
    const payload: FastApiModificationPlannerRequest = {
      instruction: request.content,
      context: request.context,
      ...(Array.isArray(references) && references.length
        ? { references }
        : {}),
    };

    const response = await this.post<FastApiModificationPlannerResponse>(
      '/internal/v1/modification-planner',
      payload,
    );

    if (
      !response.result ||
      typeof response.result !== 'object' ||
      Array.isArray(response.result)
    ) {
      throw new BadGatewayException('AI service returned an invalid response');
    }

    return {
      output: response.result,
      provider: response.provider,
      model: response.model,
      ...this.mapUsage(response),
    };
  }

  /**
   * Cheap calls that change nothing (intent, page intent, embeddings) are
   * tried once more when the AI service is briefly unavailable: Ollama fails
   * while it reloads a model or runs short of memory. Drafts are never
   * retried, since each costs a full model run.
   */
  private async postRetryingOnce<TResponse>(
    path: string,
    payload: unknown,
  ): Promise<TResponse> {
    try {
      return await this.post<TResponse>(path, payload);
    } catch (error) {
      if (!isBrieflyUnavailable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, AI_RETRY_DELAY_MS));
      return this.post<TResponse>(path, payload);
    }
  }

  private async post<TResponse>(
    path: string,
    payload: unknown,
  ): Promise<TResponse> {
    const baseUrl = this.configService.getOrThrow<string>(
      'AI_SERVICE_BASE_URL',
    );

    const internalToken =
      this.configService.getOrThrow<string>('AI_INTERNAL_TOKEN');

    const timeout = Number(
      this.configService.get<string>('AI_SERVICE_TIMEOUT_MS') ?? 65000,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post<TResponse>(`${baseUrl}${path}`, payload, {
          timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Service-Token': internalToken,
          },
        }),
      );

      if (!response.data) {
        throw new BadGatewayException(
          'AI service returned an invalid response',
        );
      }

      return response.data;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new GatewayTimeoutException('AI service request timed out');
        }

        if (!error.response) {
          throw new ServiceUnavailableException('AI service is unavailable');
        }

        throw new BadGatewayException(
          `AI service returned HTTP ${error.response.status}`,
        );
      }

      throw error;
    }
  }

  private mapUsage(response: {
    usage?: FastApiUsage;
  }): Pick<AiRuntimeResult, 'usage'> {
    const usage = response.usage;

    if (
      Object.prototype.hasOwnProperty.call(response, 'usage') &&
      (!usage ||
        typeof usage !== 'object' ||
        Array.isArray(usage) ||
        ![
          usage.prompt_tokens,
          usage.completion_tokens,
          usage.total_tokens,
        ].every(
          (value) =>
            typeof value === 'number' && Number.isInteger(value) && value >= 0,
        ))
    ) {
      throw new BadGatewayException('AI service returned an invalid response');
    }

    if (!usage) {
      return {};
    }

    return {
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    };
  }

  private getText(input: Record<string, unknown>): string {
    if (typeof input.text === 'string' && input.text.trim()) {
      return input.text;
    }

    if (typeof input.message === 'string' && input.message.trim()) {
      return input.message;
    }

    throw new BadRequestException('AI writing input text is required');
  }

  private getOptionalString(
    input: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = input[key];

    if (value === undefined || value === null) {
      return null;
    }

    return typeof value === 'string' ? value : null;
  }
}
