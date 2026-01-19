# Task 2: Add Signature Error Detection to Plugin Recovery

**Feature:** 02_keep-thinking-investigation
**Folder:** 02-add-signature-error-detection-to-plugin-recovery
**Status:** pending

---

## Description

Add detection for signature-related errors:
```typescript
if (message.includes("signature") || 
    message.includes("invalid_request") && message.includes("thinking")) {
  return "thinking_signature_invalid";
}
```

---

## Prior Tasks

- **1. Fix Format Mismatch (DONE)** (01-fix-format-mismatch-done)
- **1. Add thinking_signature_invalid Error Type** (01-add-thinkingsignatureinvalid-error-type)

---

## Upcoming Tasks

- **3. Add Fallback: Strip Thinking on Failure** (03-add-fallback-strip-thinking-on-failure)
- **4. Better Error Logging** (04-better-error-logging)
- **3. Hook into THINKING_RECOVERY_NEEDED Flow** (03-hook-into-thinkingrecoveryneeded-flow)
- **4. Add Diagnostic Logging** (04-add-diagnostic-logging)
