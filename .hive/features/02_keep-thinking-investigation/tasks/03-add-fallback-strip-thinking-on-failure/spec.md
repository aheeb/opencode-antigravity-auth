# Task 3: Add Fallback: Strip Thinking on Failure

**Feature:** 02_keep-thinking-investigation
**Folder:** 03-add-fallback-strip-thinking-on-failure
**Status:** pending

---

## Description

When `thinking_signature_invalid` detected:
1. Strip ALL thinking blocks (like keep_thinking=false)
2. Retry request without thinking
3. Log warning about degraded mode

---

## Prior Tasks

- **1. Fix Format Mismatch (DONE)** (01-fix-format-mismatch-done)
- **2. Add Signature Error Detection to Plugin Recovery** (02-add-signature-error-detection-to-plugin-recovery)
- **1. Add thinking_signature_invalid Error Type** (01-add-thinkingsignatureinvalid-error-type)
- **2. Implement Recovery Handler** (02-implement-recovery-handler)

---

## Upcoming Tasks

- **4. Better Error Logging** (04-better-error-logging)
- **4. Add Diagnostic Logging** (04-add-diagnostic-logging)
