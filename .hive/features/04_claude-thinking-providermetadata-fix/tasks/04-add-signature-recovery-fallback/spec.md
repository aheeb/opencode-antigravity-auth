# Task: 04-add-signature-recovery-fallback

## Feature: 04_claude-thinking-providermetadata-fix

## Context

## research

# Research Findings

## Issue Summary
GitHub Issue #248: "Failed to process error response" / "Expected 'thinking' but found 'tool_use'" when using Claude thinking models with `keep_thinking = true`.

## Root Cause
`thoughtSignature` from Antigravity responses is not converted to OpenCode's expected `providerMetadata.anthropic.signature` format.

## Key Files

### Plugin (to modify)
- `src/plugin/request-helpers.ts` - Main transformation logic
  - `transformGeminiCandidate()` (lines 1344-1418) - Handles Gemini-style candidates
  - `transformThinkingParts()` (lines 1425-1465) - Handles Anthropic-style content arrays
- `src/plugin/cache.ts` - Signature caching (already exists, well-implemented)
  - `cacheSignature(sessionId, text, signature)` - Store signature
  - `getCachedSignature(sessionId, text)` - Retrieve signature
  - Memory + disk cache with TTL

### OpenCode (reference only - shows expected format)
- `opencode/packages/opencode/src/session/message-v2.ts` (lines 545-550):
  ```typescript
  if (part.type === "reasoning") {
    assistantMessage.parts.push({
      type: "reasoning",
      text: part.text,
      providerMetadata: part.metadata,  // <-- reads from metadata
    })
  }
  ```

## Current Behavior (WRONG)
```typescript
// transformGeminiCandidate returns:
{
  type: "reasoning",
  text: "...",
  thoughtSignature: "abc123..."  // <-- NOT recognized by OpenCode
}
```

## Expected Behavior (CORRECT)
```typescript
{
  type: "reasoning",
  text: "...",
  providerMetadata: {
    anthropic: { signature: "abc123..." }
  }
}
```

## LLM-API-Key-Proxy Patterns (reference)
1. **Composite cache key**: `thinking_tool_{id}_text_{hash}` - combines tool call ID + text hash
2. **Sentinel fallback**: `"skip_thought_signature_validator"` when no signature available
3. **Recovery logic**: Always try cache before giving up, never skip thinking blocks

## Signature Flow
1. Claude response → has `thoughtSignature` in Gemini format
2. Plugin transforms → should output `providerMetadata.anthropic.signature`
3. OpenCode persists → reads from `providerMetadata` into `part.metadata`
4. Next turn → OpenCode sends `providerMetadata` which SDK converts back


## Completed Tasks

- 01-add-providermetadata-conversion-in-transformgeminicandidate: Added providerMetadata conversion in both transformGeminiCandidate (already done) and transformThinkingParts. Converts thoughtSignature/signature to providerMetadata.anthropic.signature format and removes original fields.
- 03-add-signature-caching-on-response-transformation: Added providerMetadata.anthropic.signature conversion in both transformGeminiCandidate (for Gemini-style thought:true and Anthropic-style type:thinking) and transformThinkingParts (for content arrays). Removes original signature/thoughtSignature fields after conversion. Added cacheSignature import for future use.

