# WhatsApp Group Contact VCF Extractor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + TypeScript web application that queries OpenWA for a WhatsApp session's groups, enables user selection of group contacts, formats phone numbers with global country codes, assigns sequential named aliases using a custom prefix, and exports them directly into a downloadable `.vcf` (vCard) file before returning to the home screen.

**Architecture:** A client-side React 19 + TypeScript application built with Vite and Tailwind CSS. The app communicates with OpenWA purely through read-only (`GET`) requests proxied via Vite to avoid CORS issues. Business logic is modularized into dedicated utilities for universal international E.164 phone formatting, compliant vCard 3.0 generation, and an OpenWA service layer, orchestrated by a three-step workflow UI (Group List -> Participant Selection -> Prefix & Export).

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React (icons), Vitest, @testing-library/react, jsdom.

**Spec:** `docs/superpowers/specs/2026-10-16-whatsapp-group-contact-vcf-extractor-design.md`

## Global Constraints

- Fixed gateway credentials: read `OPENWA_URL`, `OPENWA_API_KEY`, and `OPENWA_SESSION_ID` from `.env` (passed via Vite dev proxy / client env).
- Purely read-only interactions: only issue HTTP `GET` requests; never emit `POST`, `PUT`, `DELETE`, or `PATCH` to WhatsApp endpoints.
- Universal international phone formatting: parse numeric digits from participant JIDs and format with a leading `+` (e.g. `14155552671` -> `+14155552671`, `919409367178` -> `+919409367178`).
- Sequential naming: for $N$ contacts and prefix `${P}`, assign formatted name `${P}${index + 1}` (e.g., `hello1`, `hello2`, ... `hello10`).
- Compliant vCard 3.0 format: each entry must include `BEGIN:VCARD`, `VERSION:3.0`, `FN:${name}`, `TEL;TYPE=CELL:${phone}`, and `END:VCARD` with standard CRLF (`\r\n`) line separators.
- Automatic reset: upon initiating VCF download, return the user back to the initial group list screen.

## Review Focus

1. **JIDs with non-standard formatting or extra suffixes** (e.g., `@lid`, `@s.whatsapp.net` vs `@c.us`): strip any domain suffix and extract only the telephone digits, ensuring a clean `+<digits>` output.
2. **Numbers already containing leading `+` or spaces/hyphens**: normalize so that no duplicate `++` or orphaned formatting characters appear in the exported vCard.
3. **Empty or special-character prefixes**: trim whitespace; if user enters `client `, prefix names become `client1`, `client2`, without invalid vCard control characters.
4. **Group with zero participants or disconnected session**: display clear, non-crashing empty states with a "Retry" or "Back to Groups" button.
5. **Browser Blob download cancellation or popup blocker**: create an anchor element with `URL.createObjectURL(blob)`, click it, and revoke the object URL cleanly without memory leaks.

---

### Task 1: Project Scaffolding & Build Environment

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: Environment variables in `.env` (`OPENWA_URL`, `OPENWA_API_KEY`, `OPENWA_SESSION_ID`).
- Produces: Working React 19 + TypeScript + Vite build and Vitest runner setup with dev server proxy forwarding `/api` to `http://localhost:2785`.

- [ ] **Step 1: Create `package.json` with scripts and dependencies**

Configure React 19, TypeScript, Tailwind CSS, Lucide React, Vite, Vitest, @testing-library/react, @testing-library/jest-dom, and jsdom.

- [ ] **Step 2: Create TypeScript and Vite configuration files**

Configure `vite.config.ts` with React plugin and a proxy rule forwarding `/api` to `http://localhost:2785` with `changeOrigin: true`. Set up `tsconfig.json` with strict mode.

- [ ] **Step 3: Create base HTML, CSS, and entry point**

Create `index.html`, `src/index.css` with Tailwind directives, and `src/main.tsx` mounting a root component.

- [ ] **Step 4: Install dependencies and verify build & test scripts**

Run: `npm install && npm run build`  
Expected: Build passes with output generated in `dist/`.

- [ ] **Step 5: Verify Vitest executes**

Run: `npx vitest run`  
Expected: Vitest runs cleanly (0 tests or passing baseline).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src/
git commit -m "chore: scaffold react typescript vite project with tailwind and vitest"
```

---

### Task 2: International Phone Formatter & vCard Generator (TDD)

**Files:**
- Create: `src/utils/phone.ts`
- Create: `src/utils/phone.test.ts`
- Create: `src/utils/vcf.ts`
- Create: `src/utils/vcf.test.ts`

**Interfaces:**
- Produces:
  - `formatInternationalPhone(raw: string): string`
  - `generateVcf(contacts: Array<{ name: string; phone: string }>): string`
  - `downloadVcf(filename: string, content: string): void`

- [ ] **Step 1: Write failing tests for phone formatter**

```typescript
// src/utils/phone.test.ts
import { describe, it, expect } from 'vitest';
import { formatInternationalPhone } from './phone';

describe('formatInternationalPhone', () => {
  it('formats raw Indian WhatsApp JID to E.164 with +', () => {
    expect(formatInternationalPhone('919409367178@c.us')).toBe('+919409367178');
  });

  it('formats US WhatsApp JID to E.164 with +', () => {
    expect(formatInternationalPhone('14155552671@c.us')).toBe('+14155552671');
  });

  it('formats UK number with country code', () => {
    expect(formatInternationalPhone('447911123456@c.us')).toBe('+447911123456');
  });

  it('handles already-prefixed + without duplicate', () => {
    expect(formatInternationalPhone('+919409367178')).toBe('+919409367178');
  });

  it('strips non-digit formatting characters', () => {
    expect(formatInternationalPhone('+1 (555) 123-4567')).toBe('+15551234567');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/utils/phone.test.ts`  
Expected: FAIL with "formatInternationalPhone is not defined".

- [ ] **Step 3: Implement `formatInternationalPhone` in `src/utils/phone.ts`**

Extract digits from the user portion of the JID or string; ensure a single leading `+`.

- [ ] **Step 4: Verify phone tests pass**

Run: `npx vitest run src/utils/phone.test.ts`  
Expected: PASS.

- [ ] **Step 5: Write failing tests for vCard generator**

```typescript
// src/utils/vcf.test.ts
import { describe, it, expect } from 'vitest';
import { generateVcf } from './vcf';

describe('generateVcf', () => {
  it('generates compliant vCard 3.0 entries with CRLF line endings', () => {
    const contacts = [
      { name: 'client1', phone: '+919409367178' },
      { name: 'client2', phone: '+14155552671' },
    ];
    const vcf = generateVcf(contacts);
    expect(vcf).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:client1\r\nTEL;TYPE=CELL:+919409367178\r\nEND:VCARD\r\n');
    expect(vcf).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:client2\r\nTEL;TYPE=CELL:+14155552671\r\nEND:VCARD\r\n');
  });

  it('returns empty string when contacts array is empty', () => {
    expect(generateVcf([])).toBe('');
  });
});
```

- [ ] **Step 6: Run vcf test to verify failure**

Run: `npx vitest run src/utils/vcf.test.ts`  
Expected: FAIL with "generateVcf is not defined".

- [ ] **Step 7: Implement `generateVcf` and `downloadVcf` in `src/utils/vcf.ts`**

Map contacts to vCard 3.0 blocks joined by `\r\n`. Implement `downloadVcf` creating a Blob with MIME `text/vcard;charset=utf-8` and programmatic download link.

- [ ] **Step 8: Verify vcf tests pass**

Run: `npx vitest run src/utils/vcf.test.ts`  
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/utils/phone.ts src/utils/phone.test.ts src/utils/vcf.ts src/utils/vcf.test.ts
git commit -m "feat: implement international phone formatting and vcard 3.0 generator"
```

---

### Task 3: OpenWA Read-Only API Service & Types

**Files:**
- Create: `src/types/openwa.ts`
- Create: `src/services/openwa.ts`
- Create: `src/services/openwa.test.ts`

**Interfaces:**
- Produces:
  - Types: `OpenWAGroup`, `OpenWAParticipant`, `OpenWAGroupDetail`
  - Functions:
    - `fetchGroups(): Promise<OpenWAGroup[]>`
    - `fetchGroupDetails(groupId: string): Promise<OpenWAGroupDetail>`
    - `getEnvConfig(): { apiUrl: string; apiKey: string; sessionId: string }`

- [ ] **Step 1: Define TypeScript interfaces in `src/types/openwa.ts`**

```typescript
export interface OpenWAGroup {
  id: string;
  name: string;
  linkedParentJID: string | null;
}

export interface OpenWAParticipant {
  id: string;
  number: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface OpenWAGroupDetail {
  id: string;
  name: string;
  owner?: string;
  createdAt?: number;
  participants: OpenWAParticipant[];
}
```

- [ ] **Step 2: Write failing unit tests for `openwa.ts` service**

```typescript
// src/services/openwa.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGroups, fetchGroupDetails } from './openwa';

describe('openwa service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches groups using GET and passes X-API-Key header', async () => {
    const mockGroups = [{ id: '123@g.us', name: 'Test Group', linkedParentJID: null }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGroups,
    });

    const groups = await fetchGroups();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'X-API-Key': expect.any(String) }),
      })
    );
    expect(groups).toEqual(mockGroups);
  });

  it('fetches group details with participants using GET', async () => {
    const mockDetail = {
      id: '123@g.us',
      name: 'Test Group',
      participants: [{ id: '919409367178@c.us', number: '919409367178', isAdmin: false, isSuperAdmin: false }],
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDetail,
    });

    const detail = await fetchGroupDetails('123@g.us');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups/123@g.us'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(detail.participants).toHaveLength(1);
  });

  it('throws descriptive error when API returns non-200 status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchGroups()).rejects.toThrow('Failed to fetch groups');
  });
});
```

- [ ] **Step 3: Run service tests to verify failure**

Run: `npx vitest run src/services/openwa.test.ts`  
Expected: FAIL with missing module/functions.

- [ ] **Step 4: Implement `src/services/openwa.ts`**

Read credentials from `import.meta.env` (with sensible fallback to the Vite proxy `/api`). Implement `fetchGroups()` and `fetchGroupDetails()` with strictly `GET` method.

- [ ] **Step 5: Verify service tests pass**

Run: `npx vitest run src/services/openwa.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/openwa.ts src/services/openwa.ts src/services/openwa.test.ts
git commit -m "feat: add read-only openwa api service for groups and participants"
```

---

### Task 4: Group List Component (Page 1)

**Files:**
- Create: `src/components/GroupList.tsx`
- Create: `src/components/GroupList.test.tsx`

**Interfaces:**
- Consumes: `OpenWAGroup` from `src/types/openwa.ts`
- Produces: `GroupList` React component
  - Props:
    ```typescript
    interface GroupListProps {
      groups: OpenWAGroup[];
      loading: boolean;
      error: string | null;
      onSelectGroup: (group: OpenWAGroup) => void;
      onRefresh: () => void;
    }
    ```

- [ ] **Step 1: Write failing tests for `GroupList` component**

Test search filtering by group name, clicking a group calls `onSelectGroup`, loading state spinner, error display, and empty state message.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/GroupList.test.tsx`  
Expected: FAIL with "GroupList is not defined".

- [ ] **Step 3: Implement `src/components/GroupList.tsx`**

Include a header, search input, group cards showing group name, ID badge, and a "Select Group" action.

- [ ] **Step 4: Verify GroupList tests pass**

Run: `npx vitest run src/components/GroupList.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/GroupList.tsx src/components/GroupList.test.tsx
git commit -m "feat: implement group list component with search filtering"
```

---

### Task 5: Participant Selector Component (Page 2)

**Files:**
- Create: `src/components/ParticipantSelector.tsx`
- Create: `src/components/ParticipantSelector.test.tsx`

**Interfaces:**
- Consumes: `OpenWAParticipant`, `OpenWAGroup` from `src/types/openwa.ts`, `formatInternationalPhone` from `src/utils/phone.ts`
- Produces: `ParticipantSelector` React component
  - Props:
    ```typescript
    interface ParticipantSelectorProps {
      group: OpenWAGroup;
      participants: OpenWAParticipant[];
      loading: boolean;
      error: string | null;
      onBack: () => void;
      onProceed: (selected: OpenWAParticipant[]) => void;
    }
    ```

- [ ] **Step 1: Write failing tests for `ParticipantSelector`**

Test:
- Displays all participants with formatted numbers (e.g. `+919409367178`).
- "Select All" toggle selects or deselects all items.
- Individual checkbox toggles select/deselect specific items.
- Selected counter updates (e.g., "10 selected").
- "Next" button is disabled if 0 selected, and invokes `onProceed(selected)` when clicked.
- "Back" button invokes `onBack()`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/ParticipantSelector.test.tsx`  
Expected: FAIL with "ParticipantSelector is not defined".

- [ ] **Step 3: Implement `src/components/ParticipantSelector.tsx`**

Maintain local state for selected participant IDs (defaulting to all selected). Include search filter for numbers, "Select All / Deselect All", and Admin badge.

- [ ] **Step 4: Verify ParticipantSelector tests pass**

Run: `npx vitest run src/components/ParticipantSelector.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ParticipantSelector.tsx src/components/ParticipantSelector.test.tsx
git commit -m "feat: implement participant selector with batch and individual checkboxes"
```

---

### Task 6: Prefix Input, VCF Export Modal & App Flow Integration

**Files:**
- Create: `src/components/ExportModal.tsx`
- Create: `src/components/ExportModal.test.tsx`
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes:
  - `generateVcf`, `downloadVcf` from `src/utils/vcf.ts`
  - `formatInternationalPhone` from `src/utils/phone.ts`
  - `GroupList`, `ParticipantSelector`, `ExportModal`
- Produces: Complete end-to-end user workflow:
  1. Home: Fetch and list groups.
  2. Select group -> fetch participants -> display checkboxes.
  3. Click Next -> open Export modal.
  4. User enters prefix (e.g. `hello`) -> shows live preview (`hello1`, `hello2`, ...).
  5. Click "Download VCF" -> generates and triggers download -> automatically resets to Home.

- [ ] **Step 1: Write failing tests for `ExportModal`**

Test:
- Renders input for prefix with default value (e.g. `contact`).
- Live preview displays first 3 mapped contact names (`hello1: +...`, `hello2: +...`).
- Shows total count of contacts to export.
- Clicking "Download VCF" calls generator/download and invokes `onComplete()`.
- Cancel button closes modal.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/components/ExportModal.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement `src/components/ExportModal.tsx`**

Implement prefix text field, sanitized naming, preview list, and download trigger.

- [ ] **Step 4: Implement state machine and UI in `src/App.tsx`**

Integrate `GroupList`, `ParticipantSelector`, and `ExportModal`. Wire up automatic reset to the group list upon export completion.

- [ ] **Step 5: Write and run full integration test in `src/App.test.tsx`**

Verify that selecting a group loads participants, selecting contacts opens modal, entering prefix and clicking export triggers download and resets view back to groups.

- [ ] **Step 6: Run all tests to ensure 100% pass rate**

Run: `npx vitest run`  
Expected: All test suites PASS.

- [ ] **Step 7: Verify production build succeeds**

Run: `npm run build`  
Expected: PASS with clean bundle output.

- [ ] **Step 8: Commit**

```bash
git add src/components/ExportModal* src/App*
git commit -m "feat: integrate export modal and complete full contact extraction flow"
```

---

### Task 7: End-to-End Verification with Live OpenWA Session

**Files:**
- Create: `.env.example`
- Modify: `vite.config.ts` (ensure `.env` values are properly exposed and proxied)

**Interfaces:**
- Tests live communication against `http://localhost:2785` and session `a9a7f860-5961-48e3-908c-66880d8e6197`.

- [ ] **Step 1: Create `.env.example` documenting the required variables**

Provide reference template for `OPENWA_URL`, `OPENWA_API_KEY`, and `OPENWA_SESSION_ID`.

- [ ] **Step 2: Start Vite dev server and test live API endpoint reachability**

Run: `npm run build` and launch dev server check to confirm groups load from live OpenWA session.

- [ ] **Step 3: Commit and final review**

```bash
git add .env.example vite.config.ts
git commit -m "chore: finalize configuration and documentation for openwa integration"
```
