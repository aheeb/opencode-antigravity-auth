# Fix Multi-Turn Thinking After Tool Calls

## Overview

**Problem:** "Failed to process error response" occurs on multi-turn Claude conversations with `keep_thinking=true` after tool calls, but works fine when debug mode is on.

## Root Cause (CONFIRMED)

**The bug is in `filterContentArray` at request-helpers.ts line 1138-1139:**

```typescript
if (hasValidSignature) {
  filtered.push(item);  // ← BUG: Passes Claude's signature unchanged
}
```

When the last assistant message has a thinking block with Claude's original signature (which IS >= 50 chars), we push it **unchanged**. But Claude's signature is NOT valid for Antigravity's validation - it's just a random string that happens to be long enough.

**Why debug mode works:** With debug mode, we inject our own synthetic thinking block which has NO signature initially. This triggers the sentinel injection at lines 1140-1149.

**Why keep_thinking=true fails:** When Claude returns `[thinking, tool_use]`, the thinking block has Claude's original signature. Since it's >= 50 chars, we pass it unchanged → Antigravity rejects it as invalid.

## The Fix

We should **NOT trust** signatures just because they're >= 50 chars. We should only pass through signatures that we **cached ourselves**:

```typescript
if (hasValidSignature) {
  // Check if it's OUR cached signature, not just any long string
  if (isOurCachedSignature(item, sessionId, getCachedSignatureFn)) {
    filtered.push(item);
  } else {
    // Not our signature - inject sentinel
    const thinkingText = getThinkingText(item) || "";
    log.debug("Injecting sentinel for non-cached signature on last-message thinking block");
    const sentinelPart = {
      type: item.type || "thinking",
      thinking: thinkingText,
      signature: SKIP_THOUGHT_SIGNATURE,
    };
    filtered.push(sentinelPart);
  }
} else {
  // Invalid or missing signature - inject sentinel
  ...existing code...
}
```

## Tasks

### 1. Fix filterContentArray signature handling
- Modify lines 1138-1139 in request-helpers.ts
- When signature is >= 50 chars, check `isOurCachedSignature()` before passing through
- If NOT our signature, inject `SKIP_THOUGHT_SIGNATURE` sentinel

### 2. Add debug logging
- Log when we detect a non-cached signature being replaced with sentinel
- This helps diagnose future issues

### 3. Manual testing
- Test: Claude thinking model + keep_thinking=true + tool call → should work
- Test: Multi-turn conversation → should preserve thinking blocks
- Test: Debug mode still works as before

### 4. Update changelog
- Fix the 1.3.1 entry to accurately describe the actual fix
