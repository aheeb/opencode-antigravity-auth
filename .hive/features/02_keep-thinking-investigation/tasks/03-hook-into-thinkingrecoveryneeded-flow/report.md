# Task Report: 03-hook-into-thinkingrecoveryneeded-flow

**Feature:** 02_keep-thinking-investigation
**Completed:** 2026-01-19T08:56:48.679Z
**Status:** success
**Commit:** d294ffe0b0098acd9cec14f96f7d62319fc63fed

---

## Summary

Hooked thinking_signature_invalid into the THINKING_RECOVERY_NEEDED flow. Updated request.ts line 1597 to throw recovery error for both thinking_block_order AND thinking_signature_invalid. When thrown, plugin.ts sets forceThinkingRecovery=true, which triggers closeToolLoopForThinking() -> stripAllThinkingBlocks() on retry. This ensures conversation continues with stripped thinking when signature validation fails.

---

## Changes

- **Files changed:** 1
- **Insertions:** +1
- **Deletions:** -1

### Files Modified

- `src/plugin/request.ts`
