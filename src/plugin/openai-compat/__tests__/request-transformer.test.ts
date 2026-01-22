/**
 * Tests for OpenAI-Compatible Request Transformer
 */

import { describe, it, expect } from 'vitest';
import { 
  transformOpenAIToAntigravity, 
  extractModel, 
  isStreamingRequest 
} from '../request-transformer';
import type { OpenAIChatRequest } from '../types';

describe('transformOpenAIToAntigravity', () => {
  it('transforms a simple text message', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'user', content: 'Hello, world!' }
      ],
    };

    const result = transformOpenAIToAntigravity(request);

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].role).toBe('user');
    expect(result.contents[0].parts).toEqual([{ text: 'Hello, world!' }]);
  });

  it('extracts system message as systemInstruction', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hi!' }
      ],
    };

    const result = transformOpenAIToAntigravity(request);

    expect(result.systemInstruction).toEqual({
      parts: [{ text: 'You are a helpful assistant.' }]
    });
    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].role).toBe('user');
  });

  it('converts assistant role to model', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'How are you?' }
      ],
    };

    const result = transformOpenAIToAntigravity(request);

    expect(result.contents).toHaveLength(3);
    expect(result.contents[0].role).toBe('user');
    expect(result.contents[1].role).toBe('model');
    expect(result.contents[2].role).toBe('user');
  });

  it('transforms tool calls from assistant', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'user', content: 'What is the weather?' },
        { 
          role: 'assistant', 
          content: '',
          tool_calls: [{
            id: 'call_123',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: '{"location": "NYC"}'
            }
          }]
        }
      ],
    };

    const result = transformOpenAIToAntigravity(request);

    expect(result.contents[1].parts[0].functionCall).toEqual({
      name: 'get_weather',
      args: { location: 'NYC' },
      id: 'call_123',
    });
  });

  it('transforms tool results', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'user', content: 'What is the weather?' },
        { 
          role: 'assistant', 
          content: '',
          tool_calls: [{
            id: 'call_123',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: '{"location": "NYC"}'
            }
          }]
        },
        {
          role: 'tool',
          content: '{"temperature": 72}',
          tool_call_id: 'call_123',
          name: 'get_weather'
        }
      ],
    };

    const result = transformOpenAIToAntigravity(request);

    // Tool result should be in a user content block
    const toolResultContent = result.contents.find(c => 
      c.parts.some(p => p.functionResponse)
    );
    expect(toolResultContent).toBeDefined();
    expect(toolResultContent!.parts[0].functionResponse).toEqual({
      name: 'get_weather',
      response: { temperature: 72 },
      id: 'call_123',
    });
  });

  it('transforms tools to functionDeclarations', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Hi' }],
      tools: [{
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get the weather',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' }
            },
            required: ['location']
          }
        }
      }]
    };

    const result = transformOpenAIToAntigravity(request);

    expect(result.tools).toHaveLength(1);
    expect(result.tools![0].functionDeclarations).toHaveLength(1);
    expect(result.tools![0].functionDeclarations![0].name).toBe('get_weather');
  });

  it('transforms generation config', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Hi' }],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1000,
      stop: ['END'],
    };

    const result = transformOpenAIToAntigravity(request);

    expect(result.generationConfig).toEqual({
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1000,
      stopSequences: ['END'],
    });
  });

  it('transforms thinking config for Claude thinking models', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet-thinking',
      messages: [{ role: 'user', content: 'Think about this' }],
      thinking: {
        type: 'enabled',
        budget_tokens: 5000,
      },
    };

    const result = transformOpenAIToAntigravity(request);

    expect(result.generationConfig?.thinkingConfig).toEqual({
      includeThoughts: true,
      thinkingBudget: 5000,
    });
  });

  it('handles multipart content with images', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'What is in this image?' },
          { 
            type: 'image_url', 
            image_url: { 
              url: 'data:image/png;base64,iVBORw0KGgo=' 
            } 
          }
        ]
      }],
    };

    const result = transformOpenAIToAntigravity(request);

    expect(result.contents[0].parts).toHaveLength(2);
    expect(result.contents[0].parts[0].text).toBe('What is in this image?');
    expect(result.contents[0].parts[1].inlineData).toEqual({
      mimeType: 'image/png',
      data: 'iVBORw0KGgo=',
    });
  });
});

describe('extractModel', () => {
  it('extracts the model name', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Hi' }],
    };

    expect(extractModel(request)).toBe('claude-3-5-sonnet');
  });
});

describe('isStreamingRequest', () => {
  it('returns true when stream is true', () => {
    const request: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
    };

    expect(isStreamingRequest(request)).toBe(true);
  });

  it('returns false when stream is false or undefined', () => {
    const request1: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: false,
    };

    const request2: OpenAIChatRequest = {
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Hi' }],
    };

    expect(isStreamingRequest(request1)).toBe(false);
    expect(isStreamingRequest(request2)).toBe(false);
  });
});
