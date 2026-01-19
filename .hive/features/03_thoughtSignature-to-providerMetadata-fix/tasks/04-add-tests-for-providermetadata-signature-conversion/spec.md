# Task: 04-add-tests-for-providermetadata-signature-conversion

## Feature: 03_thoughtSignature-to-providerMetadata-fix

## Completed Tasks

- 01-add-signature-to-providermetadata-conversion-helper: Added convertSignatureToProviderMetadata helper function that converts thoughtSignature/signature to providerMetadata.anthropic.signature format
- 02-update-transformgeminicandidate-to-use-providermetadata-format: Updated transformGeminiCandidate to use providerMetadata format for both Gemini-style (thought: true) and Anthropic-style (type: thinking) thinking blocks. Also added convertSignatureToProviderMetadata helper.
- 03-update-transformthinkingparts-to-use-providermetadata-format: Updated transformThinkingParts to convert signature to providerMetadata.anthropic.signature format for Anthropic-style content arrays. Added convertSignatureToProviderMetadata helper.

