# Task: 03-hook-into-thinkingrecoveryneeded-flow

## Feature: 02_keep-thinking-investigation

## Completed Tasks

- 01-add-thinkingsignatureinvalid-error-type: Added thinking_signature_invalid error type to recovery system. Added detection patterns for "invalid signature", "failed to process + thinking", "invalid_request + thinking", "signature + thinking", and "thinking + validation". Created recoverThinkingSignatureInvalid handler that strips all thinking blocks (like keep_thinking=false) to allow conversation to continue. Added toast messages. Added 5 new tests (34 total pass).

