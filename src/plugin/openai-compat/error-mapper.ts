/**
 * Error Mapper: Antigravity Errors → OpenAI Error Format
 * 
 * Maps various error types to OpenAI-compatible error responses.
 * Key feature: converts 429 to 400 to prevent SDK retry loops.
 */

import type { OpenAIError } from './types.js';

/**
 * Error classification for different handling strategies
 */
export type ErrorClassification = 
  | 'capacity_exhausted'  // MODEL_CAPACITY_EXHAUSTED - retry same account
  | 'rate_limit'          // RATE_LIMIT_EXCEEDED - rotate account
  | 'quota_exhausted'     // QUOTA_EXHAUSTED - account is done for the day
  | 'authentication'      // Auth errors
  | 'invalid_request'     // Bad request format
  | 'server_error'        // 5xx errors
  | 'unknown';

/**
 * Classify an error based on status code and message
 */
export function classifyError(
  status: number,
  body: unknown
): ErrorClassification {
  const message = extractErrorMessage(body).toLowerCase();
  const reason = extractErrorReason(body).toLowerCase();
  
  // Check for capacity exhaustion (should retry same account)
  if (
    message.includes('model_capacity_exhausted') ||
    reason.includes('model_capacity_exhausted') ||
    message.includes('capacity') && message.includes('exhausted')
  ) {
    return 'capacity_exhausted';
  }
  
  // Check for quota exhaustion (account is done)
  if (
    message.includes('quota_exhausted') ||
    reason.includes('quota_exhausted') ||
    message.includes('quota') && message.includes('exceeded')
  ) {
    return 'quota_exhausted';
  }
  
  // Check for rate limiting
  if (status === 429 || message.includes('rate_limit') || reason.includes('rate_limit')) {
    return 'rate_limit';
  }
  
  // Authentication errors
  if (status === 401 || status === 403) {
    return 'authentication';
  }
  
  // Bad request
  if (status === 400) {
    return 'invalid_request';
  }
  
  // Server errors
  if (status >= 500) {
    return 'server_error';
  }
  
  return 'unknown';
}

/**
 * Extract error message from various response formats
 */
function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  
  const obj = body as Record<string, unknown>;
  
  // OpenAI format
  if (obj.error && typeof obj.error === 'object') {
    const err = obj.error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
  }
  
  // Google/Antigravity format
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.error === 'string') return obj.error;
  
  // Nested error object
  if (obj.error && typeof obj.error === 'object') {
    const err = obj.error as Record<string, unknown>;
    if (err.details && Array.isArray(err.details)) {
      for (const detail of err.details) {
        if (detail && typeof detail === 'object') {
          const d = detail as Record<string, unknown>;
          if (typeof d.reason === 'string') return d.reason;
          if (typeof d.message === 'string') return d.message;
        }
      }
    }
  }
  
  return '';
}

/**
 * Extract error reason/code from response
 */
function extractErrorReason(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  
  const obj = body as Record<string, unknown>;
  
  if (typeof obj.reason === 'string') return obj.reason;
  if (typeof obj.code === 'string') return obj.code;
  
  if (obj.error && typeof obj.error === 'object') {
    const err = obj.error as Record<string, unknown>;
    if (typeof err.code === 'string') return err.code;
    if (typeof err.reason === 'string') return err.reason;
    if (typeof err.status === 'string') return err.status;
  }
  
  return '';
}

/**
 * Map error classification to OpenAI error type
 */
function getOpenAIErrorType(
  classification: ErrorClassification,
  convert429to400: boolean
): OpenAIError['error']['type'] {
  switch (classification) {
    case 'authentication':
      return 'authentication_error';
    case 'rate_limit':
    case 'capacity_exhausted':
    case 'quota_exhausted':
      // Convert rate-limit-like errors to invalid_request to prevent SDK retries
      return convert429to400 ? 'invalid_request_error' : 'rate_limit_error';
    case 'invalid_request':
      return 'invalid_request_error';
    default:
      return 'api_error';
  }
}

/**
 * Get appropriate HTTP status code for OpenAI response
 */
function getOpenAIStatusCode(
  originalStatus: number,
  classification: ErrorClassification,
  convert429to400: boolean
): number {
  // Convert 429 to 400 to prevent SDK retry loops
  if (originalStatus === 429 && convert429to400) {
    return 400;
  }
  
  // Convert capacity/quota errors that might come as 5xx to 400
  if (
    (classification === 'capacity_exhausted' || classification === 'quota_exhausted') &&
    convert429to400
  ) {
    return 400;
  }
  
  return originalStatus;
}

/**
 * Transform an error to OpenAI format
 */
export function transformToOpenAIError(
  status: number,
  body: unknown,
  options: { convert429to400?: boolean } = {}
): { status: number; body: OpenAIError } {
  const { convert429to400 = true } = options;
  
  const classification = classifyError(status, body);
  const message = extractErrorMessage(body) || getDefaultMessage(classification);
  const reason = extractErrorReason(body);
  
  const openAIStatus = getOpenAIStatusCode(status, classification, convert429to400);
  const errorType = getOpenAIErrorType(classification, convert429to400);
  
  return {
    status: openAIStatus,
    body: {
      error: {
        message,
        type: errorType,
        param: null,
        code: reason || null,
      },
    },
  };
}

/**
 * Get default error message for classification
 */
function getDefaultMessage(classification: ErrorClassification): string {
  switch (classification) {
    case 'capacity_exhausted':
      return 'Model is temporarily at capacity. Please try again.';
    case 'rate_limit':
      return 'Rate limit exceeded. Please slow down your requests.';
    case 'quota_exhausted':
      return 'Quota exhausted for this account.';
    case 'authentication':
      return 'Authentication failed. Please check your credentials.';
    case 'invalid_request':
      return 'Invalid request. Please check your request format.';
    case 'server_error':
      return 'Server error. Please try again later.';
    default:
      return 'An error occurred.';
  }
}

/**
 * Check if an error should be retried on the same account
 * (capacity exhausted should retry, rate limit should rotate)
 */
export function shouldRetrySameAccount(status: number, body: unknown): boolean {
  const classification = classifyError(status, body);
  return classification === 'capacity_exhausted';
}

/**
 * Check if an error indicates the account is exhausted for the day
 */
export function isAccountExhausted(status: number, body: unknown): boolean {
  const classification = classifyError(status, body);
  return classification === 'quota_exhausted';
}
