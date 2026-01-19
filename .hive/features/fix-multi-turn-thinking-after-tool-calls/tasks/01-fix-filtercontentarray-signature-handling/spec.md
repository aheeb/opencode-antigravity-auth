# Task 1: Fix filterContentArray signature handling

**Feature:** fix-multi-turn-thinking-after-tool-calls
**Folder:** 01-fix-filtercontentarray-signature-handling
**Status:** pending

---

## Description

- Modify lines 1138-1139 in request-helpers.ts
- When signature is >= 50 chars, check `isOurCachedSignature()` before passing through
- If NOT our signature, inject `SKIP_THOUGHT_SIGNATURE` sentinel

---

## Upcoming Tasks

- **2. Add debug logging** (02-add-debug-logging)
- **3. Manual testing** (03-manual-testing)
- **4. Update changelog** (04-update-changelog)
