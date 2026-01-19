# Claude Thinking providerMetadata Fix

## Overview

Fix "Failed to process error response" / "Expected 'thinking' but found 'tool_use'" errors when using Claude thinking models (`keep_thinking = true`). The root cause is that `thoughtSignature` from Antigravity responses is not converted to OpenCode's expected `providerMetadata.anthropic.signature` format.

## Problem Chain

1. Claude response arrives with `thoughtSignature` (Gemini format)
2. Plugin converts `type: "thinking"` → `type: "reasoning"` ✅
3. Plugin keeps `thoughtSignature` as-is ❌ (should be `providerMetadata.anthropic.signature`)
4. OpenCode persists message but can't save signature (wrong format)
5. Next turn: thinking blocks restored without signatures
6. Claude API rejects: "Expected 'thinking' or 'redacted_thinking', but found 'tool_use'"

## Reference

- GitHub Issue: #248
- LLM-API-Key-Proxy patterns: composite cache keys, sentinel fallback, recovery logic

## Tasks

### 1. Add providerMetadata conversion in transformGeminiCandidate

**File:** `src/plugin/request-helpers.ts`

In the `thought === true` and `type === "thinking"` branches, convert signature to providerMetadata format:

```typescript
// After creating transformed object, add:
const sig = part.signature || part.thoughtSignature;
if (sig) {
  transformed.providerMetadata = {
    anthropic: { signature: sig }
  };
  delete transformed.signature;
  delete transformed.thoughtSignature;
}
```

### 2. Add providerMetadata conversion in transformThinkingParts

**File:** `src/plugin/request-helpers.ts`

Same conversion for the Anthropic-style content array handling (lines 1437-1446):

```typescript
const sig = (block as any).signature || (block as any).thoughtSignature;
if (sig) {
  transformed.providerMetadata = {
    anthropic: { signature: sig }
  };
  delete (transformed as any).signature;
  delete (transformed as any).thoughtSignature;
}
```

### 3. Add signature caching on response transformation

**File:** `src/plugin/request-helpers.ts`

When we extract a signature during transformation, cache it for recovery:

- Import `cacheSignature` from `./cache`
- After extracting signature in transformation, call `cacheSignature(sessionId, thinkingText, signature)`
- Requires passing sessionId through the transformation chain

### 4. Add signature recovery fallback

**File:** `src/plugin/request-helpers.ts`

When reasoning part has no signature, attempt recovery from cache:

```typescript
if (!sig) {
  // Try to recover from cache
  sig = getCachedSignature(sessionId, thinkingText);
}

// If still no signature, use sentinel (allows Claude to handle gracefully)
if (!sig && thinkingText) {
  sig = "skip_thought_signature_validator";
}
```

### 5. Add tests for providerMetadata conversion

**File:** `src/plugin/__tests__/request-helpers.test.ts` (or create if needed)

Test cases:
- Gemini-style `thought: true` with `thoughtSignature` → outputs `providerMetadata.anthropic.signature`
- Anthropic-style `type: "thinking"` with `signature` → outputs `providerMetadata.anthropic.signature`
- Missing signature uses sentinel fallback
- Original `signature`/`thoughtSignature` fields are removed from output

## Acceptance Criteria

- [ ] Claude thinking models work in multi-turn conversations without errors
- [ ] Signatures are properly formatted as `providerMetadata.anthropic.signature`
- [ ] Existing signature cache is leveraged for recovery
- [ ] Sentinel fallback prevents hard failures when signature unavailable
- [ ] Unit tests cover the conversion logic
