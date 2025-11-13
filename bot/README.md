# Chatbot Widget - Developer Documentation

A modern, feature-rich React chatbot widget built with TypeScript, Vite, and React 19. This widget provides text and voice-based chat functionality with session management, real-time API communication, and audio transcription capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Component Documentation](#component-documentation)
- [Service Documentation](#service-documentation)
- [API Integration](#api-integration)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

The Chatbot Widget is a React component that can be embedded into any web application. It provides a complete chat interface with support for:

- **Text-based messaging** with markdown rendering
- **Voice input** with real-time audio visualization
- **Session management** with localStorage persistence
- **API integration** with health checking and error handling
- **Responsive UI** with modern design patterns

## Features

### Core Features

- ✅ **Text Chat**: Send and receive messages with markdown support
- ✅ **Voice Input**: Record audio messages with real-time visualization
- ✅ **Audio Transcription**: Automatic conversion of voice to text
- ✅ **Session Management**: Persistent chat sessions across page reloads
- ✅ **API Health Monitoring**: Real-time connection status indicator
- ✅ **Source Citations**: Display links and sources in bot responses
- ✅ **Language Detection**: Show detected language and confidence scores
- ✅ **Chat History**: Clear and reset conversation history
- ✅ **Responsive Design**: Mobile-friendly interface

### Technical Features

- TypeScript for type safety
- React Hooks for state management
- Web Audio API for audio processing
- MediaRecorder API for voice recording
- localStorage for session persistence
- Error boundaries and graceful error handling

## Tech Stack

### Core Dependencies

- **React** `^19.1.1` - UI library
- **TypeScript** `~5.9.3` - Type safety
- **Vite** `^7.1.7` - Build tool and dev server
- **react-markdown** `^10.1.0` - Markdown rendering for bot messages
- **react-media-recorder** `^1.7.2` - Audio recording hook

### Development Dependencies

- **ESLint** `^9.36.0` - Code linting
- **TypeScript ESLint** `^8.45.0` - TypeScript-specific linting
- **@vitejs/plugin-react** `^5.0.4` - Vite React plugin

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API server running (default: `http://localhost:8000`)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

5. **Run linter**:
   ```bash
   npm run lint
   ```

### Environment Configuration

The app uses the following default API endpoint:
- **API Base URL**: `http://localhost:8000`

To customize the API endpoint, you can:
1. Modify `API_BASE_URL` in `src/services/api.ts`
2. Set environment variable `VITE_BACKEND_URL` (for voice service)

## Project Structure

```
bot/
├── src/
│   ├── components/          # React components
│   │   ├── ChatbotWidget.tsx      # Main chatbot component
│   │   ├── ChatHeader.tsx         # Header with title and status
│   │   ├── ChatInput.tsx          # Text input and controls
│   │   ├── MessageList.tsx         # Message display component
│   │   ├── VoiceRecordingView.tsx  # Voice recording interface
│   │   └── AudioVisualizer.tsx    # Audio waveform visualization
│   ├── services/            # API and business logic
│   │   ├── api.ts                  # Base API utilities
│   │   ├── queryService.ts         # Query/message sending
│   │   ├── sessionService.ts       # Session management
│   │   ├── sessionInitService.ts   # Session initialization
│   │   ├── healthService.ts        # API health checking
│   │   ├── voiceService.ts         # Voice transcription
│   │   └── index.ts                # Service exports
│   ├── types.ts             # TypeScript type definitions
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Application entry point
│   └── *.css                # Component styles
├── public/                  # Static assets
├── dist/                    # Production build output
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── README.md                # This file
```

## Architecture

### Component Hierarchy

```
App
└── ChatbotWidget (Main Container)
    ├── ChatHeader (when open)
    ├── MessageList (when open)
    └── ChatInput | VoiceRecordingView (when open)
        └── AudioVisualizer (when recording)
```

### Data Flow

1. **User Input** → `ChatInput` or `VoiceRecordingView`
2. **State Update** → `ChatbotWidget` manages all state
3. **API Call** → Service layer (`queryService`, `voiceService`)
4. **Response Handling** → Update messages state
5. **UI Update** → React re-renders with new data

### State Management

The app uses React's built-in state management:
- **Local State**: `useState` hooks in `ChatbotWidget`
- **Session Persistence**: `localStorage` via `sessionService`
- **Refs**: `useRef` for DOM access and non-reactive values

### Key Design Patterns

- **Component Composition**: Small, focused components
- **Service Layer**: Separation of API logic from UI
- **Custom Hooks**: `useReactMediaRecorder` for audio
- **Error Boundaries**: Graceful error handling
- **Optimistic Updates**: Immediate UI feedback

## Component Documentation

### ChatbotWidget

**Location**: `src/components/ChatbotWidget.tsx`

**Description**: Main container component that orchestrates the entire chatbot interface.

**Props**: None (root component)

**State**:
- `isOpen`: Boolean - Chat window visibility
- `messages`: Message[] - Chat message history
- `inputValue`: string - Current input text
- `isLoading`: boolean - Message sending status
- `apiConnected`: boolean | null - API connection status
- `isMicrophoneOn`: boolean - Recording state
- `isVoiceLoading`: boolean - Transcription status
- `mediaRecorder`: MediaRecorder | null - Audio recorder instance

**Key Methods**:
- `toggleChat()`: Open/close chat window
- `handleSendMessage()`: Send text message to API
- `handleMicrophoneClick()`: Start/stop voice recording
- `handleClearChat()`: Reset chat history
- `sendMessageToAPI()`: API communication handler

**Usage**:
```tsx
import ChatbotWidget from './components/ChatbotWidget';

function App() {
  return <ChatbotWidget />;
}
```

---

### ChatHeader

**Location**: `src/components/ChatHeader.tsx`

**Description**: Displays chat window header with title, API status, and close button.

**Props**:
```typescript
interface ChatHeaderProps {
  apiConnected: boolean | null;  // API connection status
  onClose: () => void;            // Close button handler
}
```

**Features**:
- Shows "Chat Support" title
- Displays real-time API connection status
- Provides close button to minimize chat

---

### ChatInput

**Location**: `src/components/ChatInput.tsx`

**Description**: Text input interface with auto-resizing textarea, microphone button, send button, and clear button.

**Props**:
```typescript
interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isVoiceLoading: boolean;
  onSend: () => void;
  onMicClick: () => void;
  onClear: () => void;
  hasSession: boolean;
}
```

**Features**:
- Auto-resizing textarea (grows with content)
- Microphone button (when input is empty)
- Send button (when input has text)
- Clear chat button
- Enter key to send message
- Disabled state during loading

---

### MessageList

**Location**: `src/components/MessageList.tsx`

**Description**: Renders all chat messages with markdown support, source links, and metadata.

**Props**:
```typescript
interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}
```

**Features**:
- User messages: Plain text rendering
- Bot messages: Markdown rendering (formatting, links, etc.)
- Source links display with clickable citations
- Language detection and confidence display
- Timestamp for each message
- "Thinking..." loading indicator

---

### VoiceRecordingView

**Location**: `src/components/VoiceRecordingView.tsx`

**Description**: Voice recording interface with audio visualization and control buttons.

**Props**:
```typescript
interface VoiceRecordingViewProps {
  mediaRecorder: MediaRecorder | null;
  isMicrophoneOn: boolean;
  isVoiceLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
}
```

**Features**:
- Real-time audio waveform visualization
- Cancel button (X) to discard recording
- Confirm button (✓) to transcribe recording
- Loading spinner during transcription
- "Processing..." state indicator

---

### AudioVisualizer

**Location**: `src/components/AudioVisualizer.tsx`

**Description**: Real-time audio waveform visualization component.

**Props**:
```typescript
interface AudioVisualizerProps {
  isMicrophoneOn: boolean;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
}
```

**Features**:
- Real-time frequency data visualization
- Canvas-based waveform rendering
- Smooth animation with requestAnimationFrame
- Automatic cleanup on unmount

---

## Service Documentation

### API Service

**Location**: `src/services/api.ts`

**Description**: Base API utilities for making HTTP requests.

**Exports**:
- `apiRequest<T>(endpoint, options)`: Generic API request function
- `handleApiError(error)`: Error handling utility
- `ApiResponse<T>`: Response type interface
- `ApiError`: Error type interface

**Configuration**:
- Base URL: `http://localhost:8000`
- Default headers: `Content-Type: application/json`

**Usage**:
```typescript
import { apiRequest } from './services/api';

const response = await apiRequest<MyType>('/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

---

### Query Service

**Location**: `src/services/queryService.ts`

**Description**: Handles sending chat messages to the backend API.

**Exports**:
- `sendQuery(message, sessionId?, meta?, idempotencyKey?)`: Send message to API
- `sendQueryWithRetry(message, sessionId?, maxRetries?, ...)`: Send with retry logic
- `QueryRequest`: Request type interface
- `QueryResponse`: Response type interface

**Features**:
- Automatic session ID management
- Retry logic with exponential backoff
- Session ID synchronization with localStorage

**Usage**:
```typescript
import { sendQuery } from './services/queryService';

const response = await sendQuery('Hello, bot!');
if (response.success) {
  console.log(response.data.answer);
}
```

---

### Session Service

**Location**: `src/services/sessionService.ts`

**Description**: Manages chat session persistence using localStorage.

**Exports**:
- `getCurrentSessionId()`: Get current session ID
- `setCurrentSessionId(sessionId)`: Set current session ID
- `getOrCreateSessionId()`: Get or create session ID
- `createDefaultSession()`: Create new default session
- `createNewSession()`: Create new session (moves current to previous)
- `clearSessionData()`: Clear all session data
- `testLocalStorage()`: Test localStorage functionality
- `generateSessionId()`: Generate new 12-character session ID

**Storage Keys**:
- `chatbot_current_session_id`: Current active session
- `chatbot_previous_session_id`: Previous archived session

**Usage**:
```typescript
import { getOrCreateSessionId, setCurrentSessionId } from './services/sessionService';

const sessionId = getOrCreateSessionId();
setCurrentSessionId('new-session-id');
```

---

### Session Init Service

**Location**: `src/services/sessionInitService.ts`

**Description**: Handles session initialization and archiving.

**Exports**:
- `sessionInit()`: Initialize/reset session (archives current conversation)
- `SessionInitRequest`: Request type interface
- `SessionInitResponse`: Response type interface

**Usage**:
```typescript
import { sessionInit } from './services/sessionInitService';

const response = await sessionInit();
if (response.success) {
  console.log(`Archived ${response.data.archivedTurns} turns`);
}
```

---

### Health Service

**Location**: `src/services/healthService.ts`

**Description**: Checks API availability and health status.

**Exports**:
- `checkHealth()`: Check API health endpoint
- `HealthResponse`: Response type interface

**Usage**:
```typescript
import { checkHealth } from './services/healthService';

const response = await checkHealth();
if (response.success) {
  console.log('API is healthy');
}
```

---

### Voice Service

**Location**: `src/services/voiceService.ts`

**Description**: Handles audio transcription and audio format conversion.

**Exports**:
- `transcribeAudioFromBlobUrl(blobUrl, sessionId?, backendUrl?)`: Transcribe audio
- `blobUrlToBlob(blobUrl)`: Convert blob URL to Blob
- `convertBlobToWavBlob(inputBlob)`: Convert audio to WAV format

**Features**:
- Automatic audio format conversion (WebM → WAV)
- Web Audio API integration
- FormData upload to backend
- Session ID management

**Usage**:
```typescript
import { transcribeAudioFromBlobUrl } from './services/voiceService';

const result = await transcribeAudioFromBlobUrl(blobUrl);
console.log(result.transcript); // or result.answer
```

---

## API Integration

### Backend API Endpoints

The widget expects the following backend endpoints:

#### 1. Health Check
- **Endpoint**: `GET /health`
- **Response**: `{ status: "ok" }`

#### 2. Send Query
- **Endpoint**: `POST /query`
- **Request Body**:
  ```json
  {
    "sessionId": "string (optional)",
    "message": "string",
    "meta": "object (optional)",
    "idempotencyKey": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "sessionId": "string",
    "answer": "string",
    "turn": {
      "turnId": "string",
      "timestamp": "string",
      "userMessage": "string",
      "assistantMessage": "string",
      "detectedLanguage": "string",
      "confidence": "number",
      "sources": "string[]",
      "links": [
        {
          "number": "string",
          "title": "string",
          "url": "string"
        }
      ]
    },
    "links": [...],
    "usage": {
      "detectedLanguage": "string",
      "confidence": "number",
      "sourcesUsed": "number"
    }
  }
  ```

#### 3. Session Init
- **Endpoint**: `POST /session/init`
- **Request Body**:
  ```json
  {
    "sessionId": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "sessionId": "string",
    "archivedTurns": "number"
  }
  ```

#### 4. Voice Transcription
- **Endpoint**: `POST /voice`
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Audio file (WAV or WebM)
  - `sessionId`: Session ID string
- **Response**:
  ```json
  {
    "transcript": "string",
    "answer": "string (optional)"
  }
  ```

### Error Handling

The widget handles API errors gracefully:
- Network errors: Shows user-friendly error message
- API errors: Displays error from response
- Timeout errors: Retry logic (if using `sendQueryWithRetry`)

### Session Management

1. **Session Creation**: Automatically created on first message
2. **Session Persistence**: Stored in localStorage
3. **Session Archiving**: Old sessions archived on clear/reset
4. **Session Sync**: Backend session ID synced with localStorage

## Development Guide

### Adding a New Component

1. Create component file in `src/components/`
2. Define TypeScript interface for props
3. Add JSDoc comments for documentation
4. Export component as default
5. Import and use in parent component

**Example**:
```typescript
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onClick: () => void;
}

/**
 * MyComponent - Brief description
 * 
 * Detailed description of what this component does.
 * 
 * @param {MyComponentProps} props - Component props
 * @returns {JSX.Element} The component UI
 */
const MyComponent: React.FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <div onClick={onClick}>
      <h2>{title}</h2>
    </div>
  );
};

export default MyComponent;
```

### Adding a New Service

1. Create service file in `src/services/`
2. Define TypeScript interfaces for request/response
3. Export service functions
4. Add to `src/services/index.ts` for easy imports

**Example**:
```typescript
// src/services/myService.ts
import { apiRequest, type ApiResponse } from './api';

export interface MyServiceRequest {
  data: string;
}

export interface MyServiceResponse {
  result: string;
}

export const callMyService = async (
  data: string
): Promise<ApiResponse<MyServiceResponse>> => {
  return apiRequest<MyServiceResponse>('/my-endpoint', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
};
```

### Code Style Guidelines

- **Components**: PascalCase (e.g., `ChatbotWidget`)
- **Functions**: camelCase (e.g., `handleSendMessage`)
- **Files**: PascalCase for components, camelCase for utilities
- **Types/Interfaces**: PascalCase (e.g., `Message`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### TypeScript Best Practices

- Always define interfaces for props
- Use type inference where possible
- Avoid `any` type (use `unknown` if needed)
- Export types alongside functions
- Use JSDoc for complex functions

### Testing Considerations

While no test framework is currently configured, consider:
- Unit tests for service functions
- Component tests for UI components
- Integration tests for API communication
- E2E tests for user flows

## Troubleshooting

### Common Issues

#### 1. API Connection Failed

**Symptoms**: "Offline" status, messages not sending

**Solutions**:
- Verify backend server is running on `http://localhost:8000`
- Check CORS configuration on backend
- Verify network connectivity
- Check browser console for detailed error messages

#### 2. Microphone Not Working

**Symptoms**: Microphone button doesn't start recording

**Solutions**:
- Check browser permissions (Settings → Privacy → Microphone)
- Ensure HTTPS or localhost (required for getUserMedia)
- Check browser console for permission errors
- Verify microphone hardware is working

#### 3. Session Not Persisting

**Symptoms**: Chat history lost on page refresh

**Solutions**:
- Check if localStorage is enabled in browser
- Verify localStorage is not blocked (private/incognito mode)
- Check browser console for localStorage errors
- Use `testLocalStorage()` function to diagnose

#### 4. Voice Transcription Failing

**Symptoms**: Audio recorded but transcription fails

**Solutions**:
- Verify backend `/voice` endpoint is available
- Check audio format compatibility
- Verify session ID is being sent
- Check network tab for API errors

#### 5. Build Errors

**Symptoms**: `npm run build` fails

**Solutions**:
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies are installed
- Check for version conflicts

### Debug Utilities

The widget exposes debug utilities on the `window` object:

```javascript
// In browser console:
window.debugSession.getCurrentSessionId()
window.debugSession.setCurrentSessionId('test-id')
window.debugSession.showLocalStorage()
window.debugSession.clearSessionData()
```

### Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support (may require user gesture for audio)
- **Mobile**: iOS Safari and Chrome Android supported

## Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes following code style guidelines
3. Add/update documentation
4. Test thoroughly
5. Submit pull request

### Documentation Standards

- All components must have JSDoc comments
- All service functions must have type definitions
- Complex logic should have inline comments
- Update README.md for new features

### Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] JSDoc comments are present
- [ ] Error handling is implemented
- [ ] No console.log in production code (use proper logging)
- [ ] Code follows style guidelines
- [ ] Documentation is updated

---

## License

[Add your license information here]

## Support

For issues, questions, or contributions, please [add your support channels here].
