# Architecture Documentation

This document provides a detailed overview of the chatbot widget's architecture, design decisions, and technical implementation.

## System Overview

The chatbot widget is a client-side React application that communicates with a backend API to provide conversational AI capabilities. It's designed as an embeddable widget that can be integrated into any web application.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Environment                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Application (Widget)              │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │  Components  │  │   Services   │                │  │
│  │  │              │  │              │                │  │
│  │  │ ChatbotWidget│──│  api.ts      │                │  │
│  │  │ ChatHeader   │  │  queryService│                │  │
│  │  │ ChatInput    │  │  sessionSvc  │                │  │
│  │  │ MessageList  │  │  voiceService│                │  │
│  │  │ VoiceView    │  │  healthSvc   │                │  │
│  │  │ AudioViz     │  │              │                │  │
│  │  └──────────────┘  └──────────────┘                │  │
│  │         │                    │                       │  │
│  │         └────────┬───────────┘                       │  │
│  │                  │                                   │  │
│  │         ┌────────▼──────────┐                        │  │
│  │         │   State Management │                        │  │
│  │         │   (React Hooks)   │                        │  │
│  │         └───────────────────┘                        │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                    │                             │
│         │                    │                             │
│  ┌──────▼────────┐    ┌──────▼────────┐                  │
│  │ localStorage  │    │  Web APIs     │                  │
│  │ (Sessions)    │    │  - MediaRecorder                 │
│  └───────────────┘    │  - AudioContext                  │
│                       │  - getUserMedia                  │
│                       └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │                              │
         └──────────┬───────────────────┘
                    │
         ┌──────────▼──────────┐
         │   Backend API       │
         │   (localhost:8000)   │
         │                      │
         │  - /health           │
         │  - /query            │
         │  - /session/init     │
         │  - /voice            │
         └──────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
App (Root)
│
└── ChatbotWidget (Main Container)
    │
    ├── [Conditional: isOpen]
    │   │
    │   ├── ChatHeader
    │   │   ├── Title
    │   │   ├── API Status Indicator
    │   │   └── Close Button
    │   │
    │   ├── MessageList
    │   │   └── Message[] (mapped)
    │   │       ├── User Message (plain text)
    │   │       └── Bot Message (markdown)
    │   │
    │   └── [Conditional: isMicrophoneOn]
    │       ├── ChatInput (when !isMicrophoneOn)
    │       │   ├── Textarea
    │       │   ├── Microphone/Send Button
    │       │   └── Clear Button
    │       │
    │       └── VoiceRecordingView (when isMicrophoneOn)
    │           ├── AudioVisualizer
    │           └── Control Buttons
    │
    └── Toggle Button (Fixed Position)
```

### Component Responsibilities

#### ChatbotWidget
- **Role**: Main orchestrator and state container
- **Responsibilities**:
  - Manage all application state
  - Coordinate between components
  - Handle API communication
  - Manage audio recording lifecycle
  - Session management coordination

#### ChatHeader
- **Role**: Display header information
- **Responsibilities**:
  - Show chat title
  - Display API connection status
  - Provide close functionality

#### ChatInput
- **Role**: Text input interface
- **Responsibilities**:
  - Handle text input
  - Auto-resize textarea
  - Toggle between microphone and send button
  - Provide clear chat functionality

#### MessageList
- **Role**: Message display
- **Responsibilities**:
  - Render message history
  - Format user vs bot messages
  - Display markdown content
  - Show source links and metadata

#### VoiceRecordingView
- **Role**: Voice recording interface
- **Responsibilities**:
  - Display recording UI
  - Show audio visualization
  - Provide recording controls

#### AudioVisualizer
- **Role**: Audio visualization
- **Responsibilities**:
  - Render real-time waveform
  - Process audio frequency data
  - Animate visualization

## State Management

### State Flow

```
User Action
    │
    ▼
Event Handler (in ChatbotWidget)
    │
    ▼
State Update (useState)
    │
    ▼
Component Re-render
    │
    ▼
Prop Update (to child components)
    │
    ▼
Child Component Re-render
```

### State Structure

```typescript
// ChatbotWidget State
{
  isOpen: boolean;                    // Chat visibility
  messages: Message[];                // Chat history
  inputValue: string;                  // Current input text
  isLoading: boolean;                  // Message sending status
  apiConnected: boolean | null;       // API health status
  isMicrophoneOn: boolean;            // Recording state
  isVoiceLoading: boolean;             // Transcription status
  mediaRecorder: MediaRecorder | null; // Audio recorder
  shouldTranscribe: boolean;          // Transcription trigger
}
```

### State Persistence

- **Session IDs**: Stored in `localStorage`
  - `chatbot_current_session_id`: Active session
  - `chatbot_previous_session_id`: Archived session
- **Messages**: Not persisted (reset on page reload)
- **Settings**: Not persisted (uses defaults)

## Service Layer Architecture

### Service Organization

```
services/
├── api.ts              # Base HTTP utilities
├── queryService.ts     # Message sending
├── sessionService.ts   # Session management
├── sessionInitService.ts # Session initialization
├── healthService.ts    # Health checking
├── voiceService.ts     # Voice transcription
└── index.ts            # Public API exports
```

### Service Responsibilities

#### api.ts
- Generic HTTP request handling
- Error handling and transformation
- Request/response logging
- Base URL configuration

#### queryService.ts
- Message sending to backend
- Session ID management
- Retry logic implementation
- Response transformation

#### sessionService.ts
- localStorage operations
- Session ID generation
- Session lifecycle management
- Storage testing utilities

#### voiceService.ts
- Audio format conversion
- Blob URL handling
- Transcription API calls
- Audio processing utilities

## Data Flow

### Message Sending Flow

```
1. User types message
   │
   ▼
2. handleSendMessage() called
   │
   ▼
3. Create user Message object
   │
   ▼
4. Add to messages state (optimistic update)
   │
   ▼
5. Clear input field
   │
   ▼
6. Call sendMessageToAPI()
   │
   ▼
7. queryService.sendQuery()
   │
   ▼
8. apiRequest() → HTTP POST /query
   │
   ▼
9. Backend processes request
   │
   ▼
10. Response received
    │
    ▼
11. Transform to Message object
    │
    ▼
12. Add to messages state
    │
    ▼
13. UI updates with bot response
```

### Voice Recording Flow

```
1. User clicks microphone
   │
   ▼
2. handleMicrophoneClick() called
   │
   ▼
3. Request microphone permission
   │
   ▼
4. Create MediaStream
   │
   ▼
5. Setup AudioContext & AnalyserNode
   │
   ▼
6. Create MediaRecorder
   │
   ▼
7. Start recording
   │
   ▼
8. AudioVisualizer renders waveform
   │
   ▼
9. User clicks confirm
   │
   ▼
10. Stop recording
    │
    ▼
11. Get audio blob URL
    │
    ▼
12. Trigger transcription (shouldTranscribe = true)
    │
    ▼
13. voiceService.transcribeAudioFromBlobUrl()
    │
    ▼
14. Convert audio to WAV format
    │
    ▼
15. POST /voice with FormData
    │
    ▼
16. Receive transcript
    │
    ▼
17. Populate input field
    │
    ▼
18. User can edit or send
```

## API Communication

### Request/Response Pattern

All API communication follows a consistent pattern:

```typescript
// Request
const response = await serviceFunction(params);

// Response Handling
if (response.success && response.data) {
  // Handle success
  processData(response.data);
} else {
  // Handle error
  showError(response.error);
}
```

### Error Handling Strategy

1. **Network Errors**: Caught in `apiRequest()`, returns `{ success: false, error: string }`
2. **API Errors**: Backend returns error, transformed to `ApiResponse` format
3. **Component Errors**: Try-catch blocks with user-friendly messages
4. **Graceful Degradation**: App continues to function with reduced features

## Audio Processing

### Audio Pipeline

```
Microphone Input
    │
    ▼
getUserMedia() → MediaStream
    │
    ├──→ MediaRecorder → Blob → Blob URL
    │
    └──→ AudioContext → AnalyserNode → Frequency Data
                              │
                              ▼
                    AudioVisualizer (Canvas)
```

### Audio Format Conversion

1. **Recording**: WebM format (Opus codec)
2. **Conversion**: WebM → WAV (via Web Audio API)
3. **Upload**: WAV format to backend
4. **Transcription**: Backend processes WAV

### Audio Resources Management

- **MediaStream**: Stopped when recording ends
- **AudioContext**: Closed after use
- **MediaRecorder**: Cleared from state
- **Animation Frames**: Cancelled on cleanup

## Session Management

### Session Lifecycle

```
1. Page Load
   │
   ▼
2. Clear old sessions (localStorage cleanup)
   │
   ▼
3. User opens chat
   │
   ▼
4. Check for existing session
   │
   ├──→ Exists: Use existing session
   │
   └──→ Not exists: Create new session
   │
   ▼
5. Store session ID in localStorage
   │
   ▼
6. Send messages with session ID
   │
   ▼
7. Backend updates session
   │
   ▼
8. Sync session ID from backend response
   │
   ▼
9. User clears chat
   │
   ▼
10. Archive current session (move to previous)
    │
    ▼
11. Create new session
```

### Session ID Format

- **Length**: 12 characters
- **Characters**: Alphanumeric (A-Z, a-z, 0-9)
- **Generation**: Random selection
- **Example**: `aB3dE5fG7hI9`

## Performance Considerations

### Optimization Strategies

1. **Component Memoization**: Not currently used (consider for MessageList)
2. **Lazy Loading**: Not implemented (consider for large components)
3. **Code Splitting**: Vite handles automatically
4. **Bundle Size**: Minimized with tree-shaking

### Memory Management

- **Audio Resources**: Properly cleaned up on unmount
- **Event Listeners**: Removed in cleanup functions
- **Animation Frames**: Cancelled when not needed
- **Blob URLs**: Cleared after use

## Security Considerations

### Input Sanitization

- **Markdown Rendering**: Uses `react-markdown` (safe by default)
- **User Messages**: Plain text (no XSS risk)
- **API Responses**: Trusted source (backend)

### API Security

- **CORS**: Handled by backend
- **Credentials**: Not sent (consider for auth)
- **HTTPS**: Required for production (getUserMedia requirement)

### Storage Security

- **localStorage**: No sensitive data stored
- **Session IDs**: Non-sensitive identifiers
- **No PII**: No personally identifiable information stored

## Browser Compatibility

### Required APIs

- **MediaRecorder API**: Chrome 47+, Firefox 25+, Safari 14.1+
- **Web Audio API**: Chrome 14+, Firefox 25+, Safari 6+
- **getUserMedia**: Chrome 53+, Firefox 36+, Safari 11+
- **localStorage**: All modern browsers

### Polyfills

- None currently required
- Consider for older browser support if needed

## Build and Deployment

### Build Process

1. **TypeScript Compilation**: `tsc -b`
2. **Vite Bundling**: Optimized production build
3. **Asset Processing**: CSS, images, SVGs
4. **Output**: `dist/` directory

### Deployment Considerations

- **Static Assets**: Can be served from CDN
- **API URL**: Must be configurable for different environments
- **CORS**: Backend must allow widget origin
- **HTTPS**: Required for microphone access

## Future Enhancements

### Potential Improvements

1. **State Management**: Consider Redux/Zustand for complex state
2. **Caching**: Cache API responses for offline support
3. **WebSocket**: Real-time updates instead of polling
4. **PWA**: Offline support and app-like experience
5. **Testing**: Add unit and integration tests
6. **Accessibility**: Improve ARIA labels and keyboard navigation
7. **Internationalization**: Multi-language support
8. **Theming**: Customizable color schemes

---

This architecture document should be updated as the application evolves.

