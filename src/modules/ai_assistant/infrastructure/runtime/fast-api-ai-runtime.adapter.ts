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
  AiRuntimePort,
  AiRuntimeRequest,
  AiRuntimeResult,
} from '../../application/ports/ai-runtime.port';
import type { PageIntentExtractor } from '../../application/resolution/page-intent.port';
import type { PageIntentResult } from '../../application/resolution/page-intent.types';

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

@Injectable()
export class FastApiAiRuntimeAdapter implements AiRuntimePort, PageIntentExtractor {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async extract(instruction: string): Promise<PageIntentResult> {
    const raw: unknown = await this.post<unknown>(
      '/internal/v1/page-intent',
      { instruction },
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
    const result = value as Record<string, unknown>;
    const validKeys = Object.keys(result).sort().join(',') ===
      'instruction,intent,needsClarification,pageReference,referenceType';
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
          ) && !needsClarification;
      } else if (referenceType === 'CURRENT_PAGE') {
        valid = valid && pageReference === null && !needsClarification
          && /(?:page này|trang này|trang hiện tại|page hiện tại|this page|current page)/iu.test(instruction);
      } else if (referenceType === 'UNRESOLVED') {
        valid = valid && pageReference === null && needsClarification === true;
      } else {
        valid = false;
      }
    } else if (intent === 'OTHER' || intent === 'UNCLEAR') {
      valid = valid && referenceType === 'UNRESOLVED' && pageReference === null
        && editInstruction === null && needsClarification === (intent === 'UNCLEAR');
    } else {
      valid = false;
    }
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

    const payload: FastApiModificationPlannerRequest = {
      instruction: request.content,
      context: request.context,
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
