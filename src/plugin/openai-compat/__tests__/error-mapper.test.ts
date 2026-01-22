/**
 * Tests for OpenAI-Compatible Error Mapper
 */

import { describe, it, expect } from 'vitest';
import { 
  classifyError,
  transformToOpenAIError,
  shouldRetrySameAccount,
  isAccountExhausted,
} from '../error-mapper';

describe('classifyError', () => {
  it('classifies MODEL_CAPACITY_EXHAUSTED as capacity_exhausted', () => {
    expect(classifyError(429, { message: 'MODEL_CAPACITY_EXHAUSTED' }))
      .toBe('capacity_exhausted');
    expect(classifyError(429, { reason: 'MODEL_CAPACITY_EXHAUSTED' }))
      .toBe('capacity_exhausted');
    expect(classifyError(503, { error: { message: 'Model capacity exhausted' } }))
      .toBe('capacity_exhausted');
  });

  it('classifies QUOTA_EXHAUSTED as quota_exhausted', () => {
    expect(classifyError(429, { message: 'QUOTA_EXHAUSTED' }))
      .toBe('quota_exhausted');
    expect(classifyError(429, { message: 'Quota exceeded for this account' }))
      .toBe('quota_exhausted');
  });

  it('classifies rate limit errors', () => {
    expect(classifyError(429, { message: 'RATE_LIMIT_EXCEEDED' }))
      .toBe('rate_limit');
    expect(classifyError(429, { message: 'Too many requests' }))
      .toBe('rate_limit');
  });

  it('classifies authentication errors', () => {
    expect(classifyError(401, {})).toBe('authentication');
    expect(classifyError(403, {})).toBe('authentication');
  });

  it('classifies invalid request errors', () => {
    expect(classifyError(400, {})).toBe('invalid_request');
  });

  it('classifies server errors', () => {
    expect(classifyError(500, {})).toBe('server_error');
    expect(classifyError(503, { message: 'Service unavailable' })).toBe('server_error');
  });
});

describe('transformToOpenAIError', () => {
  it('converts 429 to 400 with invalid_request_error by default', () => {
    const result = transformToOpenAIError(429, { message: 'Rate limited' });
    
    expect(result.status).toBe(400);
    expect(result.body.error.type).toBe('invalid_request_error');
    expect(result.body.error.message).toBe('Rate limited');
  });

  it('preserves 429 when convert429to400 is false', () => {
    const result = transformToOpenAIError(429, { message: 'Rate limited' }, { convert429to400: false });
    
    expect(result.status).toBe(429);
    expect(result.body.error.type).toBe('rate_limit_error');
  });

  it('handles capacity exhausted with custom message', () => {
    const result = transformToOpenAIError(429, { 
      message: 'MODEL_CAPACITY_EXHAUSTED',
      reason: 'MODEL_CAPACITY_EXHAUSTED'
    });
    
    expect(result.status).toBe(400);
    expect(result.body.error.type).toBe('invalid_request_error');
    expect(result.body.error.code).toBe('MODEL_CAPACITY_EXHAUSTED');
  });

  it('extracts error message from nested error object', () => {
    const result = transformToOpenAIError(500, {
      error: {
        message: 'Internal error occurred',
        code: 'INTERNAL_ERROR'
      }
    });
    
    expect(result.body.error.message).toBe('Internal error occurred');
    expect(result.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('provides default message when none available', () => {
    const result = transformToOpenAIError(500, {});
    
    expect(result.body.error.message).toBe('Server error. Please try again later.');
  });
});

describe('shouldRetrySameAccount', () => {
  it('returns true for capacity exhausted', () => {
    expect(shouldRetrySameAccount(429, { message: 'MODEL_CAPACITY_EXHAUSTED' }))
      .toBe(true);
  });

  it('returns false for rate limit', () => {
    expect(shouldRetrySameAccount(429, { message: 'RATE_LIMIT_EXCEEDED' }))
      .toBe(false);
  });

  it('returns false for quota exhausted', () => {
    expect(shouldRetrySameAccount(429, { message: 'QUOTA_EXHAUSTED' }))
      .toBe(false);
  });
});

describe('isAccountExhausted', () => {
  it('returns true for quota exhausted', () => {
    expect(isAccountExhausted(429, { message: 'QUOTA_EXHAUSTED' }))
      .toBe(true);
  });

  it('returns false for capacity exhausted', () => {
    expect(isAccountExhausted(429, { message: 'MODEL_CAPACITY_EXHAUSTED' }))
      .toBe(false);
  });

  it('returns false for rate limit', () => {
    expect(isAccountExhausted(429, { message: 'RATE_LIMIT_EXCEEDED' }))
      .toBe(false);
  });
});
