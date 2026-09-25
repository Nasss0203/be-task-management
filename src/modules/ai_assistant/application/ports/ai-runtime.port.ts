export interface AiRuntimeRequest {
  requestId: string;
  capability: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface AiRuntimeUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: string;
  currency?: string;
}

export interface AiRuntimeResult {
  output: Record<string, unknown> | string;
  provider?: string;
  model?: string;
  usage?: AiRuntimeUsage;
}

export interface AiRuntimePort {
  execute(request: AiRuntimeRequest): Promise<AiRuntimeResult>;
}
