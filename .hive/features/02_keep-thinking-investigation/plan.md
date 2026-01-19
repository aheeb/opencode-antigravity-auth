# Keep Thinking Investigation - Final Analysis

## Problem Statement
When `keep_thinking=true`, users see "Failed to process error response" which corrupts conversations. `keep_thinking=false` works by stripping ALL thinking blocks.

## Root Cause Analysis

### Error Flow
```
1. Plugin sends request with thinking blocks + sentinel signature
2. Anthropic API rejects: signature validation fails
3. API returns error JSON (e.g., {"error": {"type": "invalid_request_error", ...}})
4. OpenCode tries to parse: body.message || body.error 
5. If parsing fails → OpenCode shows "Failed to process error response"
```

### Why Plugin Recovery Misses It
`detectErrorType()` only matches:
- "thinking" + "first block" / "must start with" → `thinking_block_order`
- "thinking is disabled" → `thinking_disabled_violation`

**The actual Anthropic error message is NOT matched** - it bypasses recovery entirely.

### Why OpenCode Retry Misses It
`retry.ts` only handles: `Overloaded`, `too_many_requests`, `rate_limit`, `server_error`
Signature errors are NOT retryable in OpenCode's logic.

## Solution: Detect + Fallback + Prevent

### 1. Fix Format Mismatch (DONE)
- Sentinel injection now preserves Gemini/Anthropic format ✓

### 2. Add Signature Error Detection to Plugin Recovery
Add detection for signature-related errors:
```typescript
if (message.includes("signature") || 
    message.includes("invalid_request") && message.includes("thinking")) {
  return "thinking_signature_invalid";
}
```

### 3. Add Fallback: Strip Thinking on Failure
When `thinking_signature_invalid` detected:
1. Strip ALL thinking blocks (like keep_thinking=false)
2. Retry request without thinking
3. Log warning about degraded mode

### 4. Better Error Logging
Add verbose logging for cache misses and sentinel injections to help debug.

## Tasks

### 1. Add thinking_signature_invalid Error Type
- Update recovery.ts detectErrorType() patterns
- Add RecoveryErrorType union member

### 2. Implement Recovery Handler
- Add recoverThinkingSignatureInvalid() function
- Strip thinking blocks and enable retry

### 3. Hook into THINKING_RECOVERY_NEEDED Flow
- Throw recovery needed when signature error detected
- Plugin will retry with stripped thinking

### 4. Add Diagnostic Logging  
- Log cache hits/misses with session keys
- Log when sentinel is used vs cached signature
