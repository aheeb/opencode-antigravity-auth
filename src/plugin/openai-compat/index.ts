/**
 * OpenAI-Compatible API Module
 * 
 * This module provides transformers for converting between OpenAI Chat Completions
 * format and Antigravity/Google native format. Enable via config:
 * 
 * ```json
 * {
 *   "openai_compat": {
 *     "enabled": true,
 *     "auto_detect": true,
 *     "convert_429_to_400": true
 *   }
 * }
 * ```
 * 
 * @module openai-compat
 */

// Types
export type {
  OpenAIChatRequest,
  OpenAIChatResponse,
  OpenAIMessage,
  OpenAIContentPart,
  OpenAITool,
  OpenAIToolCall,
  OpenAIChoice,
  OpenAIResponseMessage,
  OpenAIUsage,
  OpenAIStreamChunk,
  OpenAIStreamChoice,
  OpenAIStreamDelta,
  OpenAIStreamToolCall,
  OpenAIError,
  AntigravityRequest,
  AntigravityResponse,
  AntigravityContent,
  AntigravityPart,
  AntigravityTool,
  AntigravityCandidate,
} from './types.js';

// Type guards
export { isOpenAIRequest, isAntigravityRequest } from './types.js';

// Request transformer (OpenAI → Antigravity)
export {
  transformOpenAIToAntigravity,
  extractModel,
  isStreamingRequest,
} from './request-transformer.js';

// Response transformer (Antigravity → OpenAI)
export {
  transformAntigravityToOpenAI,
  transformAntigravityError,
} from './response-transformer.js';

// Streaming transformer
export {
  createStreamingState,
  transformSSEEvent,
  formatChunksAsSSE,
  createDoneMessage,
  createOpenAIStreamTransformer,
} from './streaming-transformer.js';

// Error mapping
export {
  classifyError,
  transformToOpenAIError,
  shouldRetrySameAccount,
  isAccountExhausted,
  type ErrorClassification,
} from './error-mapper.js';
