## One-Page KT Summary (PDF-Style)

**Project**: Org X Chatbot – Web Widget & API  
**Repo**: `chatbot-demo` (frontend widget in `bot/`, backend API per `API_DOCUMENTATION.md`)  
**Primary Purpose**: Provide a React-based chatbot widget that talks to a backend RAG-based chatbot API (Org X Chatbot API v2.0.0) with text and voice support.  

### High-Level Overview

- **Frontend (`bot/`)**: React 19 + TypeScript widget with text chat, voice recording, transcription, session persistence, and health monitoring.  
- **Backend API**: HTTP service at `http://localhost:8000` exposing `/`, `/health`, `/metrics`, `/query`, `/voice`, `/clear-chat`, and `/session-init`.  
- **Key Integrations**: Cosmos DB (sessions), Azure OpenAI (chat + Whisper), custom RAG system, localStorage in browser.  

### Quickstart (5 bullets)

1. **Install Node and deps**: `cd bot && npm install`.  
2. **Start backend**: Ensure Org X Chatbot API is running at `http://localhost:8000` (see API doc).  
3. **Run widget locally**: `npm run dev` and open the printed Vite URL.  
4. **Verify chat**: Send a text query; confirm bot reply and citations; watch API status indicator.  
5. **Test voice**: Click mic, record, confirm transcription appears in the chat flow.  

---

## Header

- **Project Name**: Org X Chatbot – Web Widget & API  
- **Version**:  
  - **Frontend widget**: Not explicitly versioned in docs (assume `v1.x` – confirm).  
  - **Backend API**: `2.0.0` (from `API_DOCUMENTATION.md`).  
- **Primary Owner**: _TBD – Product/Tech Owner for Org X Chatbot_  
- **Secondary Owner**: _TBD – Frontend lead / Platform team_  
- **Date Produced**: 2025-12-02  
- **Repo/Location**: `chatbot-demo` (frontend widget in `bot/`; API codebase referenced but not included here).  
- **Support Window / Timezone**: _TBD – e.g., 10:00–19:00 IST (UTC+5:30)_  

> All `TBD` items are listed under **Open questions & gaps** for follow-up.

---

## Executive Summary

The Org X Chatbot project delivers an embeddable React chatbot widget that connects to the Org X Chatbot API. The widget supports text and voice interaction, session persistence, and rich responses with citations and language detection. The backend provides RAG-powered answers using Org X’s knowledge base, with Cosmos DB for session storage and Azure OpenAI for chat completions and Whisper transcription. Together, they form a full-stack conversational assistant that can be integrated into Org X web properties.

**5-bullet Quickstart**

- **Run frontend**: `cd bot && npm install && npm run dev` (Node 18+).  
- **Run backend**: Start Org X Chatbot API at `http://localhost:8000` (see API team for repo & deployment).  
- **Configure widget**: Ensure `API_BASE_URL` (and `VITE_BACKEND_URL` for voice) point to your backend.  
- **Sanity test**: Open the Vite dev URL, send a text query, check bot response and API status indicator.  
- **Voice test**: Use mic button, confirm transcription & language detection appear in responses.

---

## Scope & Purpose

- **What the system does**
  - Provides a **browser-based chatbot UI** with:
    - Text chat, markdown rendering, and citations.
    - Voice recording → transcription → optional direct answer.
    - Session persistence and history via browser `localStorage`.
    - Health status indication against the backend.
  - Backend API:
    - Accepts text queries and returns RAG-powered answers.
    - Accepts audio input and returns transcripts.
    - Manages sessions, health checks, and metrics.

- **In scope for this repo (`chatbot-demo`)**
  - Frontend widget code in `bot/`:
    - React components (`ChatbotWidget`, `ChatHeader`, `ChatInput`, `MessageList`, `VoiceRecordingView`, `AudioVisualizer`).
    - Service layer for API calls (`api`, `queryService`, `sessionService`, `sessionInitService`, `healthService`, `voiceService`).
    - Local development setup (Vite, TypeScript, ESLint).
  - API contract documentation (`API_DOCUMENTATION.md`) describing expected backend behavior.

- **Explicitly out of scope**
  - Backend implementation code (API server, Cosmos DB integration, Azure OpenAI setup, RAG system implementation).
  - Infrastructure (Kubernetes, App Service, VM configs, load balancers, DNS).
  - CI/CD pipelines and automation (build agents, deployment jobs).
  - Monitoring stack implementation (Prometheus server, alerts configuration).

---

## Architecture & Components

### High-Level Architecture

- **Frontend (Widget)**:
  - Runs in the browser, built with React + Vite.
  - Communicates via HTTP with the backend at `http://localhost:8000`.
  - Persists session IDs in `localStorage`.

- **Backend API**:
  - HTTP API serving `/`, `/health`, `/metrics`, `/query`, `/voice`, `/clear-chat`, `/session-init`.
  - Uses Cosmos DB, Azure OpenAI, and a RAG system behind the scenes.
  - Stateless per request, with sessions tracked via `sessionId`.

- **External Dependencies**:
  - **Cosmos DB** for sessions and conversation history.
  - **Azure OpenAI** for chat model & Whisper for `/voice`.
  - **RAG System** for knowledge retrieval; accessible to API only.

### Component List & Responsibilities (Frontend)

- **`App`**
  - Bootstrap component that renders `ChatbotWidget`.

- **`ChatbotWidget`**
  - Main container managing all chatbot state:
    - `isOpen`, `messages`, `inputValue`, `isLoading`, `apiConnected`,
      `isMicrophoneOn`, `isVoiceLoading`, `mediaRecorder`.
  - Orchestrates:
    - Sending text messages via `queryService`.
    - Health checks via `healthService`.
    - Session management via `sessionService` and `sessionInitService`.
    - Voice flows via `voiceService` and `react-media-recorder`.

- **`ChatHeader`**
  - Renders title and close button.
  - Displays current API status (healthy / offline / unknown).

- **`MessageList`**
  - Shows historical messages.
  - Markdown rendering of bot responses (via `react-markdown`).
  - Shows citations, language detection, confidence, timestamps.
  - Shows “Thinking…” indicator while awaiting reply.

- **`ChatInput`**
  - Textarea input with auto-resize.
  - Send, microphone, and clear-chat buttons.
  - Disables controls while loading.

- **`VoiceRecordingView`**
  - UI for active recording flows.
  - Integrates with `AudioVisualizer` to show waveform.
  - Provides cancel/confirm controls; confirm triggers transcription.

- **`AudioVisualizer`**
  - Canvas-based waveform visualization based on `AnalyserNode`.
  - Uses `requestAnimationFrame` to animate.

### Service Layer (Frontend)

- **`api.ts`**
  - `apiRequest<T>()`: wraps `fetch` with base URL and JSON handling.
  - `handleApiError()`: standardizes error handling.
  - `ApiResponse<T>`, `ApiError`: typed wrappers.

- **`queryService.ts`**
  - `sendQuery()`, `sendQueryWithRetry()`.
  - Manages session IDs and retries for chat messages.

- **`sessionService.ts`**
  - `getCurrentSessionId()`, `getOrCreateSessionId()`, `createNewSession()`, `clearSessionData()`, etc.
  - Uses `localStorage` keys:
    - `chatbot_current_session_id`
    - `chatbot_previous_session_id`.

- **`sessionInitService.ts`**
  - `sessionInit()`: coordinates with backend session init endpoint.

- **`healthService.ts`**
  - `checkHealth()`: calls `/health` to determine API status.

- **`voiceService.ts`**
  - `transcribeAudioFromBlobUrl()`, `blobUrlToBlob()`, `convertBlobToWavBlob()`.
  - Handles audio upload to `/voice`.

### Backend Components (Logical, per API doc)

- **Health & Root**
  - `GET /` – basic API info.
  - `GET /health` – health of Cosmos DB, RAG, Azure OpenAI.
  - `GET /metrics` – Prometheus metrics.

- **Chat**
  - `POST /query` – main chat endpoint; returns answer, citations, usage.

- **Voice**
  - `POST /voice` – audio transcription and (optionally) direct answers.

- **Session Management**
  - `DELETE /clear-chat` – archive current session and clear history.
  - `DELETE /session-init` – start a new session and archive previous one.

### Simple ASCII Data Flow

```text
User Browser
  |
  | React widget (ChatbotWidget, components, services)
  v
Org X Chatbot API (http://localhost:8000)
  |
  |-- Cosmos DB (sessions, history)
  |-- RAG System (document retrieval)
  |-- Azure OpenAI (chat, Whisper)
```

---

## Environment & Prerequisites

### OS and Runtime

- **OS**: macOS, Linux, or Windows (dev-tested on modern macOS, e.g., Node 18+).  
- **Node.js**: **18+** (required per `bot/README.md`).  
- **npm**: bundled with Node (or `pnpm`/`yarn` if you adapt commands).

### Language / Framework Versions

- **Frontend**
  - React: `^19.1.1`
  - TypeScript: `~5.9.3`
  - Vite: `^7.1.7`
  - `react-markdown`: `^10.1.0`
  - `react-media-recorder`: `^1.7.2`

- **Dev Tooling**
  - ESLint: `^9.36.0`
  - TypeScript ESLint: `^8.45.0`
  - `@vitejs/plugin-react`: `^5.0.4`

### Backend & External Services (per API doc)

- **Org X Chatbot API**
  - Base URL: `http://localhost:8000` (default).
  - Expects Cosmos DB, RAG system, Azure OpenAI configured.

- **Databases & Services**
  - **Cosmos DB**: Session and history storage.
  - **Azure OpenAI**: Chat model & Whisper for `/voice`.
  - **RAG System**: Knowledge retrieval; accessible to API only.

> Access details (connection strings, keys, endpoints) are not in this repo and must be obtained from platform/infra teams.

### Browser Requirements

- Modern browsers:
  - Chrome/Edge: Full support.
  - Firefox: Full support.
  - Safari: Full support (may require user gesture for audio).
  - Mobile: iOS Safari, Android Chrome supported.
- HTTPS or `localhost` is required for microphone (`getUserMedia`).

---

## Setup & Local Run (Step-by-Step)

### 1. Clone the Repo

```bash
git clone <ORG_X_CHATBOT_REPO_URL> chatbot-demo
cd chatbot-demo
```

_(Replace `<ORG_X_CHATBOT_REPO_URL>`; see Open Questions.)_

### 2. Install Frontend Dependencies

```bash
cd bot
npm install
```

**Expected**: `node_modules` created; `npm` finishes without errors.

### 3. Configure Backend URL (Optional for local default)

- Default API base: `http://localhost:8000`.  
- To override:
  - Update `API_BASE_URL` in `src/services/api.ts`.  
  - Or set `VITE_BACKEND_URL` for voice service.

Example (`.env.local` for Vite – pattern, not yet documented):

```bash
VITE_BACKEND_URL=http://localhost:8000
```

_(Confirm actual usage in code.)_

### 4. Start Backend API

From the backend project (not in this repo):

```bash
# Example only – actual command depends on API project
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Verify:

```bash
curl http://localhost:8000/
curl http://localhost:8000/health
```

### 5. Run Frontend Dev Server

```bash
cd bot
npm run dev
```

- Vite prints a URL like `http://localhost:5173/`.
- Open in browser; widget should load and show a minimized or open chat UI.

### 6. Test Basic Chat

1. Wait for API status indicator (header) to show healthy/online.  
2. Type: “What is Org X Neosteel?” in the chat.  
3. Confirm:
   - Bot responds with text.
   - Citations or links appear if available.
   - Language/usage metadata appears for responses.

### 7. Test Voice Flow

1. Ensure HTTPS or `localhost`.  
2. Click microphone icon (when input is empty).  
3. Speak, then confirm:
   - Waveform visual appears.
   - On confirm (✓), transcription request is sent to `/voice`.
4. Check for:
   - Transcribed text appears in chat.
   - Any answer returned by `/voice` (if implemented) is shown.

### 8. Build for Production

```bash
cd bot
npm run build
```

- Output goes to `bot/dist/`.
- To preview production build:

```bash
npm run preview
```

### 9. Run Lint / Type Check

```bash
cd bot
npm run lint           # ESLint
npx tsc --noEmit       # Optional: TypeScript check
```

---

## Configuration Reference

> The following table includes only configuration explicitly referenced in docs; code review is needed to complete it.

### Environment / Config Keys

| Name                          | Purpose                                             | Example Value                     | Required?   | Source (file/doc)       |
|-------------------------------|-----------------------------------------------------|-----------------------------------|------------|--------------------------|
| `API_BASE_URL`                | Base URL for all API HTTP requests.                | `http://localhost:8000`          | Yes        | `bot` README (`api.ts`) |
| `VITE_BACKEND_URL`           | Backend URL for voice transcription service.        | `http://localhost:8000`          | Optional\* | `bot` README            |
| `chatbot_current_session_id`  | `localStorage` key for active session ID.           | `550e8400-e29b-...`              | Auto-set   | `sessionService`        |
| `chatbot_previous_session_id` | `localStorage` key for archived previous session.   | `123e4567-e89b-...`              | Auto-set   | `sessionService`        |
| Backend Cosmos DB config      | Connection details for Cosmos DB.                   | _TBD_                             | Yes        | API infra (not here)    |
| Azure OpenAI config           | Endpoint, API key, deployment names.                | _TBD_                             | Yes        | API infra (not here)    |
| RAG system config             | Index/collection identifiers, endpoints.            | _TBD_                             | Yes        | API infra (not here)    |

\*If `VITE_BACKEND_URL` is used in code as an override; otherwise `API_BASE_URL` alone may be enough.

---

## Deployment & CI/CD

> No CI/CD files are attached; below is a recommended pattern based on tooling.

### Frontend Build & Deploy

1. **Build**:

   ```bash
   cd bot
   npm ci
   npm run build
   ```

2. **Artifacts**:
   - Static assets in `bot/dist/`.

3. **Deploy Options**:
   - Static hosting (e.g., Azure Static Web Apps, S3+CloudFront, Netlify, Vercel).
   - As a bundled widget script referenced by host applications.

4. **Embedding**:
   - Exported `ChatbotWidget` can be imported into host SPA:

     ```tsx
     import ChatbotWidget from './components/ChatbotWidget';

     function App() {
       return <ChatbotWidget />;
     }
     ```

### Backend Deploy (API)

- **Expected**: Standard web API deployment (e.g., Azure App Service, AKS).  
- **Key requirements** from API doc:
  - Expose HTTP endpoints at stable base URL.
  - Health endpoint `/health` and metrics `/metrics` reachable for monitoring.
  - Correctly configured Cosmos DB, Azure OpenAI, RAG service.

### CI/CD Triggers (Assumed)

- **CI**:
  - On `push`/`PR` to `main`: run `npm ci`, `npm run lint`, `npm run build` in `bot/`.
- **CD**:
  - On successful build from `main`: deploy `dist/` to hosting environment.
  - For API: build & deploy API container/app from its repo.

### Rollback Strategy (Recommended)

- **Frontend**:
  - Keep at least one previous artifact bundle.
  - Use blue/green or versioned paths; swap to prior build if new widget misbehaves.

- **Backend**:
  - Rollback to previous API version while ensuring schema compatibility.
  - Confirm `/health` is healthy post-rollback.

> Actual CI/CD implementation details are missing and must be confirmed.

---

## Key Codepaths & Components

### Frontend Components

- **`ChatbotWidget`**
  - **Responsibility**: Central orchestrator for UI, state, and service calls.
  - **Main entrypoints**:
    - `toggleChat()`: open/close widget.
    - `handleSendMessage()`: calls `sendQuery()`; updates `messages`, `isLoading`.
    - `handleMicrophoneClick()`: toggles recording state; integrates `react-media-recorder`.
    - `handleClearChat()`: calls `sessionInit()` or `clearSessionData()`; resets messages.
  - **Typical change examples**:
    - Add new message metadata (e.g., token usage) to state and display in `MessageList`.
    - Adjust logic for when to call `sessionInit()` (e.g., on idle timeout).

- **`MessageList`**
  - **Responsibility**: Render chronological sequence of user and bot messages with markdown, citations, language, timestamp.
  - **Typical change examples**:
    - Change markdown rendering options.
    - Add “copy response” button on each bot message.

- **`ChatInput`**
  - **Responsibility**: Text-based input area with keyboard shortcuts and actions.
  - **Typical change examples**:
    - Modify key handling (e.g., Ctrl+Enter to send).
    - Customize placeholder or character limits.

- **`VoiceRecordingView` & `AudioVisualizer`**
  - **Responsibility**: Voice capture UX and waveform visualization.
  - **Typical change examples**:
    - Add recording duration limit.
    - Change visualization style from bars to line waveform.

### Frontend Services

- **`queryService.ts`**
  - **Responsibility**: Chat message requests to `/query`.
  - **Entry points**:
    - `sendQuery(message, sessionId?, meta?, idempotencyKey?)`.
    - `sendQueryWithRetry(...)` with exponential backoff.
  - **Typical change examples**:
    - Add custom metadata fields (e.g., user ID, channel ID).
    - Update idempotency key generation strategy.

- **`sessionService.ts`**
  - **Responsibility**: Client-side session ID lifecycle with `localStorage`.
  - **Typical change examples**:
    - Introduce multi-tab synchronization (e.g., listen to `storage` events).
    - Extend stored metadata (e.g., last activity time).

- **`sessionInitService.ts`**
  - **Responsibility**: Drive `/session/init` or `/session-init` (depending on API) to archive and start new session.
  - **Typical change examples**:
    - Adjust payload to support new server-side archiving options.

- **`healthService.ts`**
  - **Responsibility**: Query `/health` and map status to UI indicator states.
  - **Typical change examples**:
    - Interpret `degraded` state as partial warning state in the widget.

- **`voiceService.ts`**
  - **Responsibility**: Convert blob URL to WAV and upload to `/voice`.
  - **Typical change examples**:
    - Support additional formats or sample-rate normalization.
    - Modify FormData fields for new backend parameters.

### Backend Logical Modules (from API doc)

- **Chat (`POST /query`)**
  - Generates responses with:
    - `answer`, `turn`, `links`, `usage`.
  - **Extension examples**:
    - Add new fields in `usage` (e.g., token count).
    - Add structured error codes for better client handling.

- **Voice (`POST /voice`)**
  - Transcribes audio and returns text, language, confidence.
  - **Extension examples**:
    - Return interim segments for streaming.
    - Include `answer` field by running transcript through `/query`.

- **Sessions (`DELETE /clear-chat`, `DELETE /session-init`)**
  - Archive sessions and manage new session IDs.
  - **Extension examples**:
    - Add retention period control.
    - Add tags or metadata for archived sessions.

---

## Routine Tasks & Runbook

### Start / Stop / Restart

- **Frontend widget**
  - **Start dev**:

    ```bash
    cd bot
    npm run dev
    ```

  - **Stop**: Ctrl+C in dev terminal.
  - **Restart**: Stop then start again.

- **Backend API**
  - Start/stop via its process manager (systemd, container, etc.) – see API team.

### Health & Monitoring Checks

- **Check API health**:

  ```bash
  curl http://localhost:8000/health
  ```

  - Expect `status` = `healthy` or `degraded`.
  - Inspect per-service statuses: `cosmos_db`, `rag_system`, `azure_openai`.

- **Check metrics**:

  ```bash
  curl http://localhost:8000/metrics
  ```

  - Prometheus-style metrics like:
    - `chatbot_info`
    - `chatbot_sessions_total`
    - `chatbot_requests_total`.

- **Widget-level check**:
  - Confirm API status indicator in `ChatHeader` shows healthy.
  - Send a test message and verify timely response.

### Logs & Diagnostics

- **Frontend**
  - Use browser DevTools console and network tab.
  - Avoid `console.log` in production (per README).

- **Backend**
  - Check API logs (see runtime hosting platform).
  - Use `chatbot_requests_total` and custom logs for tracing.

### Backups & Data Management

- **Session data**:
  - Stored in Cosmos DB – backup/restore is managed by DB team.
- **Client-side session**:
  - `localStorage` – can clear via browser dev tools or `window.debugSession.clearSessionData()`.

### Daily / Weekly Maintenance (Recommended)

- **Daily**:
  - Spot check `/health` and `/metrics`.
  - Ensure widget loads correctly in main target browsers.

- **Weekly**:
  - Review error logs and 5xx rates for `/query` and `/voice`.
  - Check for performance regressions (latency per endpoint).

---

## Troubleshooting & Common Issues

### Widget / API Issues

| Symptom / Error                                         | Probable Cause                                        | Fix / Command |
|---------------------------------------------------------|-------------------------------------------------------|---------------|
| Status shows “Offline”; messages don’t send.            | Backend API not running or URL misconfigured.         | Verify backend: `curl http://localhost:8000/health`; check `API_BASE_URL` / `VITE_BACKEND_URL` and CORS on API. |
| Build errors when running `npm run build`.              | Missing deps or TypeScript errors.                    | `rm -rf node_modules && npm install`; `npx tsc --noEmit`; fix TS errors; ensure Node 18+. |
| Chat history lost on refresh.                           | `localStorage` unavailable or blocked (incognito, privacy). | Verify browser allows `localStorage`; check console for storage errors; use debug utilities if available. |
| Microphone doesn’t start recording.                     | Browser permissions or non-secure context.            | Check browser mic permissions; use HTTPS or `localhost`; inspect DevTools for permission errors. |
| Audio records but transcription fails.                  | `/voice` API not available or wrong format.           | Verify `/voice` endpoint: `curl -X POST ...`; ensure backend supports your audio format and size (<10MB). |

### API-Level Errors (Per `API_DOCUMENTATION.md`)

| HTTP Status | Description                  | Typical Cause                         | Fix |
|------------|------------------------------|---------------------------------------|-----|
| `400`      | Validation error             | Bad request body (missing fields).    | Validate JSON payload against schema; ensure `message` is 1–2000 chars. |
| `500`      | Internal server error        | Unhandled exception in backend.       | Check API logs; inspect Cosmos, RAG, Azure OpenAI connectivity. |
| `503`      | `RAG system unavailable`     | RAG system down or misconfigured.     | Restore RAG system; verify connection from API; possibly fall back to non-RAG mode if available. |

---

## Security & Credentials

> No secrets or credential management details are present in the repo; the following is inferred.

- **Where secrets live (expected)**:
  - Backend API:
    - Cosmos DB connection strings.
    - Azure OpenAI API keys and deployment names.
    - RAG system credentials.
  - Likely stored in:
    - Cloud key vault (e.g., Azure Key Vault) or platform secrets store.
    - Environment variables on server/CI.

- **Frontend**:
  - Should not store secrets; only public URLs and session IDs in `localStorage`.
  - Ensure that any `VITE_` env vars are safe to expose.

- **Ownership**:
  - Platform/infra or SRE team typically owns key vault and connection strings.
  - Application owner defines rotation cadence.

- **Rotation & Access Controls**:
  - Not described in docs; must be defined with security team.
  - Ensure minimal access from API to only required resources.

- **Known Risks (Inferred)**:
  - If `API_BASE_URL` is changed to untrusted endpoint, widget may leak user queries.
  - If CORS is misconfigured, unauthorized sites could use the API.

---

## Testing

> No explicit test framework mentioned for frontend; recommended practices below derive from docs.

### Frontend

- **Linting**:

  ```bash
  cd bot
  npm run lint
  ```

- **Type Checking**:

  ```bash
  npx tsc --noEmit
  ```

- **Unit / Component Tests**:
  - Not configured yet (no Jest/Vitest docs).
  - Recommended:
    - Add Vitest + React Testing Library for components.
    - Add tests for services (`queryService`, `sessionService`, `voiceService`).

### Backend

- **API-level testing** (manual):

  - Use `curl` examples from `API_DOCUMENTATION.md`:
    - `/query`, `/voice`, `/clear-chat`, `/session-init`.

- **Integration / E2E**:
  - Use Postman or a similar tool to test full flows:
    - Start conversation → follow-up question → clear chat.
    - Voice upload → transcript → text query.

### Failing Test Troubleshooting

- **Frontend**:
  - If future tests fail:
    - Run in watch mode (e.g., `npm test` if configured).
    - Check for mismatches in API contracts (mock vs real).

- **Backend**:
  - Ensure dev environment matches docs (API version 2.0.0, endpoints present).

---

## Contacts & Escalation

> All concrete contact info is missing and must be filled.

- **Product Owner / Primary Contact**: _TBD – Org X Chatbot Product Owner (email/Slack)._  
- **Tech Lead (Frontend)**: _TBD – React widget owner (email/Slack)._  
- **Tech Lead (Backend)**: _TBD – Org X Chatbot API owner (email/Slack)._  
- **SRE / Infrastructure**: _TBD – Team for Cosmos DB, Azure OpenAI, RAG infra (Slack channel)._  
- **Support / On-call**: _TBD – typical escalation path (e.g., #chatbot-oncall channel)._  

---

## Handover Checklist

**The new owner should verify all of the following:**

1. **Repo access**: Can clone and push to the `chatbot-demo` repository.  
2. **Local run (frontend)**: `cd bot && npm ci && npm run dev` works; app loads in browser.  
3. **Local run (backend)**: Has access to Org X Chatbot API repo and can run it locally on `http://localhost:8000`.  
4. **Health checks**: `curl http://localhost:8000/health` returns `status: healthy` for all services.  
5. **Chat flow**: A simple text question returns a valid answer with citations.  
6. **Voice flow**: Can record audio in widget and obtain a transcript with correct language.  
7. **Session persistence**: After multiple turns, refreshing the page keeps the current conversation where expected (or confirm actual behavior).  
8. **Build & lint**: `npm run build` and `npm run lint` both pass locally.  
9. **Production endpoint**: Knows the production API base URL and how it is configured in the widget.  
10. **Secrets access**: Has documented path to request access to required backend secrets (Cosmos, Azure OpenAI, RAG).  

---

## Open Questions & Gaps

> **High priority** items should be clarified before production ownership.

### High

1. **Exact repository URLs and structure for backend API** – Where is the Org X Chatbot API code hosted?  
2. **Production API base URL(s)** – What are the staging/prod endpoints that the widget should target?  
3. **Credential sources** – Where are Cosmos DB, Azure OpenAI, and RAG credentials stored (Key Vault, env vars, etc.) and who grants access?  
4. **CI/CD implementation details** – Which pipelines/jobs build and deploy the widget and the API?  
5. **On-call / support contacts** – Names, roles, and channels for incidents involving the chatbot.

### Medium

6. **Exact configuration pattern for `VITE_BACKEND_URL` and `API_BASE_URL`** – Is one the single source of truth; how is it set in each environment?  
7. **Widget versioning scheme** – How are widget versions tracked and communicated to downstream applications?  
8. **Session retention policy** – How long are archived sessions kept in Cosmos DB; what is the cleanup mechanism?  

### Low

9. **Testing strategy and coverage targets** – Which tests (unit/integration/e2e) are required for new changes?  
10. **Security & privacy guidelines** – Any additional data retention / PII rules specific to chatbot content?  

---

## Appendix

### Useful Commands

- **Install dependencies**:

  ```bash
  cd bot
  npm install
  ```

- **Run dev server**:

  ```bash
  npm run dev
  ```

- **Build**:

  ```bash
  npm run build
  ```

- **Preview production build**:

  ```bash
  npm run preview
  ```

- **Lint**:

  ```bash
  npm run lint
  ```

- **Type-check**:

  ```bash
  npx tsc --noEmit
  ```

- **Basic API checks**:

  ```bash
  curl http://localhost:8000/
  curl http://localhost:8000/health
  curl http://localhost:8000/metrics
  ```

- **Sample `/query` request**:

  ```bash
  curl -X POST "http://localhost:8000/query" \
    -H "Content-Type: application/json" \
    -d '{"message": "What is Org X Neosteel?"}'
  ```

- **Sample `/voice` request**:

  ```bash
  curl -X POST "http://localhost:8000/voice" \
    -F "file=@audio.wav" \
    -F "sessionId=your-session-id"
  ```

### Sample `.env` (Proposed for Vite Frontend)

```bash
# Backend API base URL
VITE_BACKEND_URL=http://localhost:8000

# Add more environment variables as needed
```

### Attachment Links

- `bot/README.md` – Frontend widget architecture and dev guide.  
- `API_DOCUMENTATION.md` – Org X Chatbot API v2.0.0 reference.

### Change Log (From Docs)

- API Version: `2.0.0` (per `API_DOCUMENTATION.md`).  
- No explicit widget version or historical changes noted in provided files.


