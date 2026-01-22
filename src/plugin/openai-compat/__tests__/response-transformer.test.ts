/**
 * Tests for OpenAI-Compatible Response Transformer
 */

import { describe, it, expect } from 'vitest';
import { 
  transformAntigravityToOpenAI, 
  transformAntigravityError 
} from '../response-transformer';
import type { AntigravityResponse } from '../types';

describe('transformAntigravityToOpenAI', () => {
  it('transforms a simple text response', () => {
    const response: AntigravityResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: 'Hello! How can I help you?' }]
        },
        finishReason: 'STOP',
      }],
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 15,
        totalTokenCount: 25,
      },
    };

    const result = transformAntigravityToOpenAI(response, 'claude-3-5-sonnet');

    expect(result.object).toBe('chat.completion');
    expect(result.model).toBe('claude-3-5-sonnet');
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0]?.message.role).toBe('assistant');
    expect(result.choices[0]?.message.content).toBe('Hello! How can I help you?');
    expect(result.choices[0]?.finish_reason).toBe('stop');
    expect(result.usage).toEqual({
      prompt_tokens: 10,
      completion_tokens: 15,
      total_tokens: 25,
    });
  });

  it('transforms function calls', () => {
    const response: AntigravityResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [{
            functionCall: {
              name: 'get_weather',
              args: { location: 'NYC' },
              id: 'call_123',
            }
          }]
        },
        finishReason: 'TOOL_USE',
      }],
    };

    const result = transformAntigravityToOpenAI(response, 'claude-3-5-sonnet');

    expect(result.choices[0]?.finish_reason).toBe('tool_calls');
    expect(result.choices[0]?.message.tool_calls).toHaveLength(1);
    expect(result.choices[0]?.message.tool_calls?.[0]).toEqual({
      id: 'call_123',
      type: 'function',
      function: {
        name: 'get_weather',
        arguments: '{"location":"NYC"}',
      },
    });
  });

  it('transforms thinking blocks', () => {
    const response: AntigravityResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [
            { text: 'Let me think...', thought: true },
            { text: 'The answer is 42.' }
          ]
        },
        finishReason: 'STOP',
      }],
    };

    const result = transformAntigravityToOpenAI(response, 'claude-3-5-sonnet');

    expect(result.choices[0]?.message.content).toBe('The answer is 42.');
    expect(result.choices[0]?.message.thinking).toBe('Let me think...');
  });

  it('handles MAX_TOKENS finish reason', () => {
    const response: AntigravityResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: 'Incomplete response...' }]
        },
        finishReason: 'MAX_TOKENS',
      }],
    };

    const result = transformAntigravityToOpenAI(response, 'claude-3-5-sonnet');

    expect(result.choices[0]?.finish_reason).toBe('length');
  });

  it('handles SAFETY finish reason', () => {
    const response: AntigravityResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: '' }]
        },
        finishReason: 'SAFETY',
      }],
    };

    const result = transformAntigravityToOpenAI(response, 'claude-3-5-sonnet');

    expect(result.choices[0]?.finish_reason).toBe('content_filter');
  });

  it('handles cached content in usage', () => {
    const response: AntigravityResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: 'Response' }]
        },
        finishReason: 'STOP',
      }],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 20,
        totalTokenCount: 120,
        cachedContentTokenCount: 50,
      },
    };

    const result = transformAntigravityToOpenAI(response, 'claude-3-5-sonnet');

    // Cached tokens should be subtracted from prompt tokens
    expect(result.usage?.prompt_tokens).toBe(50); // 100 - 50
    expect(result.usage?.completion_tokens).toBe(20);
    expect(result.usage?.total_tokens).toBe(70); // 50 + 20
  });

  it('creates empty choice when no candidates', () => {
    const response: AntigravityResponse = {
      candidates: [],
    };

    const result = transformAntigravityToOpenAI(response, 'claude-3-5-sonnet');

    expect(result.choices).toHaveLength(1);
    expect(result.choices[0]?.message.content).toBe('');
    expect(result.choices[0]?.finish_reason).toBe('stop');
  });
});

describe('transformAntigravityError', () => {
  it('converts 429 to 400 by default', () => {
    const result = transformAntigravityError(
      { status: 429, message: 'Rate limit exceeded' },
      true
    );

    expect(result.status).toBe(400);
    expect(result.body.error.type).toBe('invalid_request_error');
  });

  it('preserves 429 when convert429to400 is false', () => {
    const result = transformAntigravityError(
      { status: 429, message: 'Rate limit exceeded' },
      false
    );

    expect(result.status).toBe(429);
    expect(result.body.error.type).toBe('rate_limit_error');
  });

  it('handles authentication errors', () => {
    const result = transformAntigravityError(
      { status: 401, message: 'Invalid API key' },
      true
    );

    expect(result.status).toBe(401);
    expect(result.body.error.type).toBe('authentication_error');
  });

  it('handles server errors', () => {
    const result = transformAntigravityError(
      { status: 500, message: 'Internal server error' },
      true
    );

    expect(result.status).toBe(500);
    expect(result.body.error.type).toBe('api_error');
  });
});
