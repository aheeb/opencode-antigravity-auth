# Fix: Convert thoughtSignature to providerMetadata.anthropic.signature

## Overview

Fix multi-turn Claude thinking model conversations failing with "Expected 'thinking' but found 'tool_use'" error. The root cause is that `thoughtSignature`/`signature` fields are not being converted to OpenCode's expected `providerMetadata.anthropic.signature` format during response transformation.

## Problem

When transforming thinking parts in responses:
1. `transformGeminiCandidate` and `transformThinkingParts` convert `type: "thinking"` → `type: "reasoning"` ✅
2. But they copy `thoughtSignature`/`signature` as-is instead of converting to `providerMetadata` format ❌

OpenCode expects:
```typescript
{
  type: "reasoning",
  text: "...",
  providerMetadata: { anthropic: { signature: "abc123" } }
}
```

But plugin returns:
```typescript
{
  type: "reasoning", 
  text: "...",
  thoughtSignature: "abc123"  // NOT recognized by OpenCode
}
```

## Tasks

### 1. Add signature-to-providerMetadata conversion helper
Create a helper function that converts `signature`/`thoughtSignature` to `providerMetadata.anthropic.signature` format. This centralizes the conversion logic.

**File:** `src/plugin/request-helpers.ts`

### 2. Update transformGeminiCandidate to use providerMetadata format
Modify the Gemini-style (`thought: true`) and Anthropic-style (`type: "thinking"`) handling in `transformGeminiCandidate` to convert signatures to providerMetadata format.

**File:** `src/plugin/request-helpers.ts`
**Function:** `transformGeminiCandidate` (lines ~1383-1402)

### 3. Update transformThinkingParts to use providerMetadata format
Modify the Anthropic-style content array handling in `transformThinkingParts` to convert signatures to providerMetadata format.

**File:** `src/plugin/request-helpers.ts`
**Function:** `transformThinkingParts` (lines ~1460-1468)

### 4. Add tests for providerMetadata signature conversion
Add unit tests to verify that thinking block signatures are correctly converted to providerMetadata format in both transform functions.

**File:** `src/plugin/request-helpers.test.ts`

## Verification

- Run existing tests: `bun test src/plugin/request-helpers.test.ts`
- Run full test suite: `bun test`
- Verify no regressions in thinking block handling
