# PRD 01: Electron Security Hardening

**PRD ID:** PRD-01  
**Priority:** P0 - Critical  
**Phase:** Phase 1: Security & Foundation  
**Timeline:** Week 1-2 (3-4 days)  
**Status:** Completed (Verified 2026-10-24)  
**Owner:** Security/Platform Team  

---

## 1. Overview

Based on REA analysis of Notion.app, Noted currently lacks critical Electron security hardening. Notion implements comprehensive Electron fuses, sandboxing, and IPC validation. We need to match or exceed these security measures to protect users and match enterprise-grade security standards.

### Business Goal
Harden the Electron desktop app to enterprise security standards matching Notion's security posture, reducing attack surface and improving user trust.

### Success Criteria
- All critical Electron fuses enabled and verified
- Sandbox mode enabled without breaking functionality
- ASAR integrity validation enforced
- IPC sender validation implemented across all channels
- Security posture verified via REA analysis

---

## 2. Current State vs Target State

| Security Feature | Current (Noted) | Target (Notion Parity) | Gap |
|-------------------|-----------------|-------------------------|-----|
| **Electron Fuses** | None configured | All critical fuses enabled | Critical |
| **Sandbox Mode** | `sandbox: false` | `sandbox: true` | Critical |
| **ASAR Integrity** | Not enforced | Enforced | Critical |
| **OnlyLoadAppFromAsar** | Not enforced | Restricted to app.asar only | Critical |
| **RunAsNode** | Allowed by default | Disabled | Critical |
| **Node CLI Inspect** | Allowed by default | Disabled | Critical |
| **IPC Sender Validation** | None observed | 5+ validation patterns | High |
| **Context Isolation** | ✅ Enabled | ✅ Enabled | OK |
| **Node Integration** | ✅ Disabled | ✅ Disabled | OK |

---

## 3. Requirements

### 3.1 Electron Fuses Configuration (T-ARCH-001)

**Description:** Configure Electron fuses using `@electron/fuses` to match Notion's security hardening.

**Fuses to Enable/Disable:**

| Fuse | Setting | Rationale |
|------|---------|-----------|
| `RunAsNode` | `false` | Prevents ELECTRON_RUN_AS_NODE CLI execution |
| `EnableCookieEncryption` | `true` | Encrypt cookies using OS keychain |
| `EnableNodeOptionsEnvironmentVariable` | `false` | Block NODE_OPTIONS injection |
| `EnableNodeCliInspectArguments` | `false` | Block --inspect debugging |
| `EnableEmbeddedAsarIntegrityValidation` | `true` | Enforce ASAR tamper detection |
| `OnlyLoadAppFromAsar` | `true` | Restrict loading to app.asar only |
| `LoadBrowserProcessSpecificV8Snapshot` | `false` | Use default snapshot |
| `GrantFileProtocolExtraPrivileges` | `true` | Required for file:// access (evaluate carefully) |
| `EnableWebAssemblyTrapHandlers` | `true` | WASM security/performance |

**Implementation:**
1. Install `@electron/fuses` as devDependency
2. Configure in `electron-builder.json` afterPack hook
3. Test builds on all platforms
4. Verify fuses with `npx @electron/fuses read`

### 3.2 Sandbox Mode (T-ARCH-002)

**Description:** Enable Chromium sandbox for renderer processes.

**Changes Required:**
```javascript
// electron/main.cjs
webPreferences: {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true, // Enable sandbox
  spellcheck: true,
  webSecurity: true
}
```

**Testing Needed:**
- Verify preload still works with sandbox enabled
- Test all IPC calls
- Test file system access
- Test AI features (Ollama/LMStudio)
- Check for any Node API usage in renderer (should be none)

### 3.3 ASAR Integrity & Loading (T-ARCH-005)

**Description:** Ensure app only loads from ASAR with integrity validation.

**Configuration:**
```json
// electron-builder.json
{
  "asar": true,
  "asarIntegrity": {
    "enabled": true
  },
  "files": [...]
}
```

### 3.4 IPC Sender Validation (T-ARCH-004)

**Description:** Add validation for all IPC channels similar to Notion's 5 validation patterns.

**Implementation Pattern:**
```javascript
// electron/security/ipcValidation.cjs
function validateSender(event) {
  const frame = event.senderFrame;
  if (!frame) return false;
  // Validate frame URL/origin
  const url = frame.url;
  if (!url.startsWith('file://') && !url.startsWith('app://')) {
    return false;
  }
  return true;
}

function validateIpcChannel(channel, allowedChannels) {
  return allowedChannels.includes(channel);
}

module.exports = { validateSender, validateIpcChannel };
```

**Apply to all IPC handlers in:**
- `electron/main.cjs`
- `electron/preload.cjs` (audit exposed APIs)
- Any other IPC files

**Channels to audit:** All `ipcMain.handle`, `ipcMain.on`, `ipcRenderer.invoke`, `ipcRenderer.send`

### 3.5 Utility Process (T-ARCH-003) - Phase 1 Prep

**Description:** Set foundation for utility processes (full implementation may span phases, but structure needed now).

**Use cases:**
- Search indexing
- AI embedding generation
- Heavy sync operations
- File processing

---

## 4. Technical Implementation

### Dependencies to Add
```json
{
  "devDependencies": {
    "@electron/fuses": "^1.8.0"
  }
}
```

### Files to Modify
1. `package.json` - Add dependency
2. `electron-builder.json` - Add fuses configuration and asarIntegrity
3. `electron/main.cjs` - Enable sandbox, add IPC validation
4. `electron/preload.cjs` - Audit exposed APIs
5. `electron/security/ipcValidation.cjs` - New file for validation utilities

### Files to Create
1. `electron/security/ipcValidation.cjs`
2. `electron/security/index.cjs`
3. `.github/workflows/security-check.yml` (optional) - Verify fuses in CI

---

## 5. Testing Plan

### Unit Tests
- [ ] IPC validation rejects invalid senders
- [ ] IPC validation allows valid file:// origins
- [ ] Channel whitelisting works correctly

### Integration Tests
- [ ] App launches with sandbox enabled
- [ ] All existing features work with sandbox
- [ ] Preload scripts load correctly
- [ ] IPC communication functional

### Security Verification
- [ ] Build app and verify fuses with `@electron/fuses`
- [ ] Run REA analysis on built app to compare with Notion
- [ ] Test ASAR tampering detection
- [ ] Test RunAsNode is blocked
- [ ] Test node inspect is blocked

### Manual Testing Checklist
- [ ] Dev mode works (`npm run electron:dev`)
- [ ] Build works on macOS
- [ ] All UI features functional
- [ ] AI features work (Ollama/LMStudio/OpenAI)
- [ ] File operations work
- [ ] Cloud sync works
- [ ] Deep links work

---

## 6. Rollout Plan

### Step 1: Preparation (Day 1)
- Install dependencies
- Create security utilities
- Audit current IPC channels

### Step 2: Configuration (Day 1-2)
- Configure fuses in electron-builder
- Update main.cjs
- Add IPC validation

### Step 3: Testing (Day 2-3)
- Test in dev mode
- Fix any sandbox compatibility issues
- Test builds

### Step 4: Verification (Day 3-4)
- Verify fuses on built app
- Run REA comparison
- Security review

---

## 7. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Sandbox breaks preload** | High | Medium | Test thoroughly, add necessary APIs to contextBridge |
| **IPC validation breaks existing calls** | High | Medium | Start with logging mode, then enforce |
| **Fuses break on some platforms** | High | Low | Test all build targets |
| **Third-party deps need Node APIs** | Medium | Medium | Check all deps, may need utility process later |

---

## 8. Definition of Done

- [x] All critical fuses enabled and verified (scripts/after-pack-fuses.cjs)
- [x] Sandbox mode enabled and app functional (electron/main.cjs sandbox: true)
- [x] ASAR integrity enforced (electron-builder.json asarIntegrity: true)
- [x] IPC sender validation implemented for all channels (handleSecure & createSecureHandler)
- [x] Security utilities documented (electron/security/ipcValidation.cjs)
- [x] Tests passing (src/test/ipcSecurity.test.js - 13/13 passing)
- [x] REA analysis shows improved security posture
- [x] No regressions in existing functionality (25/25 test suites passing)
- [x] Documentation updated

---

**Related PRDs:** PRD-02 (Database System), PRD-03 (Real-time Collaboration)  
**References:** Notion.app REA analysis (`rea_analysis/NOTION_APP_ANALYSIS_REPORT.md`), Comparison doc
