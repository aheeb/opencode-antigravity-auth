# Wild Thinking Block Recovery

## Overview
When API responses fail or error during streaming, a "wild" thinking block can be left in the response - a thinking block without a closing text/body content. This causes "Failed to process error response" errors, but only in non-debug mode because debug mode always injects synthetic thinking with proper content.

The issue was observed when:
1. Agent uses thinking mode (e.g., claude-opus-4-5-thinking)
2. Response includes thinking blocks that stream in
3. Response errors/fails mid-stream or at the end
4. The thinking block has no accompanying text response - just "Thinking: Thinking preserved" alone
5. Next request fails because Claude API rejects malformed thinking blocks

## Root Cause Analysis
From conversation history:
```
Thinking: Thinking preserved
← Edit CHANGELOG.md
```
The agent received a thinking block, started responding, but the response was incomplete/corrupted. The "Thinking preserved" marker without actual body content creates an invalid message structure.

Debug mode works because `injectDebugThinking()` always adds proper content after thinking blocks.

## Tasks

### 1. Add wild thinking block detection
Create a function `hasWildThinkingBlock()` that detects:
- Messages with thinking blocks that have no following text/tool_use content
- Thinking blocks without signatures that aren't properly closed
- Empty content arrays after a thinking block

File: `src/plugin/thinking-recovery.ts`

### 2. Add thinking block repair function  
Create `repairWildThinkingBlock()` to fix detected issues:
- If thinking block has content but no following body: append synthetic "[Response incomplete]" text
- If thinking block is completely empty: remove it or add placeholder
- Ensure repaired blocks have proper structure for Claude API

File: `src/plugin/thinking-recovery.ts`

### 3. Integrate repair into filterContentArray
Apply repair logic in `filterContentArray()` before processing messages:
- Detect wild thinking blocks on incoming conversation history
- Repair them before sending to API
- Log repairs for debugging

File: `src/plugin/request-helpers.ts`

### 4. Add streaming error recovery
When streaming response errors mid-stream:
- Detect incomplete thinking block in accumulated buffer
- Either complete it with synthetic content or strip it
- Ensure error responses don't leave orphan thinking blocks

File: `src/plugin/core/streaming/transformer.ts`

### 5. Add tests for wild thinking block scenarios
Test cases:
- Thinking block with no following content
- Thinking block with empty text
- Streaming interrupted mid-thinking
- Error response after thinking started

File: `src/plugin/__tests__/thinking-recovery.test.ts`
