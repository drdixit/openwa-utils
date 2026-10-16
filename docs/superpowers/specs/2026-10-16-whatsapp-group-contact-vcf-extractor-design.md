# Design Document: WhatsApp Group Contact VCF Extractor

**Date:** 2026-10-16  
**Status:** Draft / Under Review  
**Author:** Pair programming session (Antigravity & User)

---

## 1. Intent and Why

Users often need to reach or save contacts from specific WhatsApp community/business groups (e.g. customer groups, vendor groups, local communities). Manually saving hundreds of phone numbers into mobile contacts is tedious and error-prone.

This project provides a lightweight, dedicated React + TypeScript web application that connects to an active self-hosted OpenWA gateway, fetches groups for a designated session, allows users to pick a group, inspect its members, select all or specific contacts, enter a naming prefix (e.g. `hello`), and generate a downloadable `.vcf` (vCard) file formatted with sequential names (`hello1`, `hello2`, etc.) and proper country codes (e.g. `+919409428491`). The exported file can be imported directly into iOS or Android address books.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Single-purpose extraction**: Provide a straightforward, friction-free workflow: Group Selection &rarr; Contact Selection &rarr; Prefix Input &rarr; VCF Download &rarr; Return to Groups.
- **Fixed credentials via environment**: Use `OPENWA_URL`, `OPENWA_API_KEY`, and `OPENWA_SESSION_ID` from `.env` without requiring manual re-entry in the UI.
- **Purely read-only interactions**: Only issue HTTP `GET` requests against OpenWA.
- **Flexible selection**: Provide individual checkbox toggles for each participant alongside a "Select All / Deselect All" toggle.
- **Sequential prefix naming**: For $N$ selected contacts, label each contact as `${prefix}${index + 1}` (e.g. `hello1`, `hello2`, ... `hello10`).
- **Country code formatting**: Ensure telephone numbers are properly formatted with international dialing prefix (e.g. `+91...`).
- **Direct file download**: Generate compliant `.vcf` (vCard 3.0) content client-side and trigger immediate browser download.
- **Reset to home**: Upon completing or downloading, navigate back to the group list to allow extracting another group.

### Non-Goals
- No message viewing, message sending, message queuing, or message history endpoints.
- No session lifecycle management (no QR code scanning, session creation, or engine restarts in this app).
- No group management mutations (no adding/removing members, no editing subjects/descriptions).
- No server-side database storage of extracted contacts (everything runs in-memory in the browser).

### Anti-Goals
- **Zero WhatsApp mutations**: The application must never emit `POST`, `PUT`, `DELETE`, or `PATCH` requests to OpenWA WhatsApp endpoints.
- **Zero intrusive messaging**: The application must never trigger WhatsApp messages, announcements, or notifications to group members.

---

## 3. Constraints & Technical Environment

- **Gateway**: OpenWA REST API running at `OPENWA_URL` (default `http://localhost:2785`).
- **Authentication**: `X-API-Key` header passed with all OpenWA requests.
- **Session**: Target session UUID specified in `OPENWA_SESSION_ID`.
- **CORS Handling**: In browser development, cross-origin requests to port `2785` may be blocked by CORS unless proxied. Vite dev server proxy will forward `/api` requests to `OPENWA_URL`.
- **Frontend Stack**:
  - React 19 / 18 with TypeScript.
  - Vite for build and dev server.
  - Tailwind CSS for clean, utilitarian UI.
  - Standard vCard 3.0 file format specification (`BEGIN:VCARD`, `VERSION:3.0`, `FN:...`, `TEL;TYPE=CELL:...`, `END:VCARD`).

---

## 4. Decisions & Flow (Decided by User)

1. **Session & Gateway Configuration**:
   - Fixed inside `.env`.
   - Never prompt the user for API keys or session IDs in the UI.

2. **Step 1: Group Discovery (Home View)**:
   - On load, query `GET /api/sessions/:sessionId/groups`.
   - Display a list/grid of available groups on this session (showing group name and ID).
   - Clicking a group selects it and transitions to the group detail view.

3. **Step 2: Contact List & Selection**:
   - Query `GET /api/sessions/:sessionId/groups/:groupId` to retrieve participant details.
   - Display list of participants (phone number, admin indicator if available).
   - "Select All" toggle button to check or uncheck all participants at once.
   - Individual checkboxes to manually include or exclude specific numbers.
   - Counter showing selected count (e.g. "15 of 24 selected").
   - "Next" button enabled when $\ge 1$ contact is selected.

4. **Step 3: Prefix & Export**:
   - Prompt the user to enter a prefix string (e.g. `hello`).
   - Show a live preview of how names will look (e.g. `hello1`, `hello2`, ... `helloN`).
   - "Download VCF" action generates the `.vcf` file blob.

5. **Step 4: Return to Home**:
   - Once downloaded, user is taken back to the initial group list view (Page 1) to process another group.

6. **Global / Multi-Country Phone Number Formatting**:
   - The app supports all countries worldwide (not only India).
   - WhatsApp participant JIDs are globally formatted in standard E.164-compatible numbers without the plus sign: `<country_code><national_number>@c.us` (e.g. `14155552671@c.us` for US, `447911123456@c.us` for UK, `971501234567@c.us` for UAE, `919409367178@c.us` for India, etc.).
   - The extractor extracts the digits before `@` and prepends `+` to form the universal international phone number (e.g. `+14155552671`, `+447911123456`, `+919409367178`), ensuring all numbers from any country import seamlessly into mobile address books.

---

## 5. What is Left to the Builder

- **UI Structure & Components**:
  - Header with session status indicator (pinging `/health` or showing session name).
  - Search filter input for groups to quickly find a group by name in large accounts.
  - Clean card/table layout for participant selection with badge for admin roles.
- **VCF Generator Utility**:
  - Implementation of `generateVcf(contacts: { name: string; phone: string }[]): string`.
  - Proper line endings (`\r\n`) and vCard 3.0 formatting.
  - Blob creation and URL download trigger (`<a download="..." href="...">`).
- **Error Handling & Loading UX**:
  - Loading skeletons/spinners while fetching groups and participants.
  - User-friendly error message if OpenWA is offline or session is disconnected.
  - Empty state when a group has 0 participants.
