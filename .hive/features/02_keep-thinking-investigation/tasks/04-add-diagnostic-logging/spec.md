# Task: 04-add-diagnostic-logging

## Feature: 02_keep-thinking-investigation

## Completed Tasks

- 01-add-thinkingsignatureinvalid-error-type: Added thinking_signature_invalid error type to recovery system. Added detection patterns for "invalid signature", "failed to process + thinking", "invalid_request + thinking", "signature + thinking", and "thinking + validation". Created recoverThinkingSignatureInvalid handler that strips all thinking blocks (like keep_thinking=false) to allow conversation to continue. Added toast messages. Added 5 new tests (34 total pass).
- 03-hook-into-thinkingrecoveryneeded-flow: Hooked thinking_signature_invalid into the THINKING_RECOVERY_NEEDED flow. Updated request.ts line 1597 to throw recovery error for both thinking_block_order AND thinking_signature_invalid. When thrown, plugin.ts sets forceThinkingRecovery=true, which triggers closeToolLoopForThinking() -> stripAllThinkingBlocks() on retry. This ensures conversation continues with stripped thinking when signature validation fails.

