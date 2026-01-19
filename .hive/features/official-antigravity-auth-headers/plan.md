# Official Antigravity Auth Headers

## Overview
Update `src/constants.ts` and `src/antigravity/oauth.ts` to match the official auth headers from `opencode-better-antigravity-auth` (commits 70d1127, 9ded90d). This aligns with the official Gemini CLI behavior to reduce "account ineligible" errors.

**Issue**: https://github.com/NoeFabris/opencode-antigravity-auth/issues/178
**Reference**: `CLIProxyAPI/sdk/auth/antigravity.go` (untracked, for comparison only)

## Changes Required

### `src/constants.ts`

| Constant | Current | Target |
|----------|---------|--------|
| `ANTIGRAVITY_HEADERS["User-Agent"]` | `antigravity/1.11.5 windows/amd64` | Full Chrome/Electron UA: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Antigravity/1.104.0 Chrome/138.0.7204.235 Electron/37.3.1 Safari/537.36` |
| `GEMINI_CLI_HEADERS["User-Agent"]` | `google-api-nodejs-client/9.15.1` | `google-api-nodejs-client/10.3.0` |
| `GEMINI_CLI_HEADERS["X-Goog-Api-Client"]` | `gl-node/22.17.0` | `gl-node/22.18.0` |

### `src/antigravity/oauth.ts`

1. Import `GEMINI_CLI_HEADERS` from constants
2. Update `fetchProjectID()` to use `GEMINI_CLI_HEADERS` instead of hardcoded strings
3. Update `exchangeAntigravity()` token exchange to add headers:
   - `Accept: */*`
   - `Accept-Encoding: gzip, deflate, br`
   - `Content-Type: application/x-www-form-urlencoded;charset=UTF-8`
   - `User-Agent` and `X-Goog-Api-Client` from `GEMINI_CLI_HEADERS`
4. Update userinfo fetch to add `User-Agent` and `X-Goog-Api-Client` headers

## Tasks

### 1. Update constants.ts header values
Update `ANTIGRAVITY_HEADERS` and `GEMINI_CLI_HEADERS` in `src/constants.ts` to match fork.

### 2. Update oauth.ts imports and fetchProjectID
Add `GEMINI_CLI_HEADERS` import and use it in `fetchProjectID()` instead of hardcoded strings.

### 3. Update oauth.ts token exchange headers
Modify `exchangeAntigravity()` to include official headers on token exchange request.

### 4. Update oauth.ts userinfo fetch headers
Add User-Agent and X-Goog-Api-Client headers to userinfo request in `exchangeAntigravity()`.

## Files to Modify
- `src/constants.ts`
- `src/antigravity/oauth.ts`

## Verification
- `npm run build` or `npx tsc --noEmit`
- Check diff against fork files to confirm alignment
