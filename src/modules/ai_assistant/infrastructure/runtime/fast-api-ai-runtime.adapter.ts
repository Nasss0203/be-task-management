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

import { PAGE_COMPOSITION_CAPABILITY } from '../../application/constants/page-composition.constant';
import type {
  AiRuntimePort,
  AiRuntimeRequest,
  AiRuntimeResult,
} from '../../application/ports/ai-runtime.port';

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

const WRITING_CAPABILITIES: Record<string, WritingAction> = {
  'writing.improve': 'IMPROVE',
  'writing.shorten': 'SHORTEN',
  'writing.expand': 'EXPAND',
  'writing.summarize': 'SUMMARIZE',
  'writing.translate': 'TRANSLATE',
  'writing.continue': 'CONTINUE',
};

@Injectable()
export class FastApiAiRuntimeAdapter implements AiRuntimePort {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async execute(request: AiRuntimeRequest): Promise<AiRuntimeResult> {
    if (request.capability === PAGE_COMPOSITION_CAPABILITY) {
      return this.executePageComposition(request);
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
