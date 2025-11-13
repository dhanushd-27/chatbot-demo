# Developer Quick Reference Guide

A quick reference guide for developers working on the chatbot widget.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Common Tasks

### Adding a New Component

1. Create file: `src/components/MyComponent.tsx`
2. Define props interface
3. Add JSDoc comments
4. Export as default
5. Import in parent component

### Adding a New Service

1. Create file: `src/services/myService.ts`
2. Define request/response types
3. Export service functions
4. Add to `src/services/index.ts`

### Modifying API Endpoint

Edit `API_BASE_URL` in `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://your-api-url:port';
```

### Testing Session Management

Use browser console:
```javascript
// Get current session
window.debugSession.getCurrentSessionId()

// Set session
window.debugSession.setCurrentSessionId('test-id')

// View all localStorage
window.debugSession.showLocalStorage()

// Clear sessions
window.debugSession.clearSessionData()
```

## File Structure Quick Reference

```
src/
├── components/        # UI components
├── services/         # API & business logic
├── types.ts         # TypeScript types
├── App.tsx          # Root component
└── main.tsx         # Entry point
```

## Component Props Quick Reference

### ChatbotWidget
No props (root component)

### ChatHeader
```typescript
{
  apiConnected: boolean | null;
  onClose: () => void;
}
```

### ChatInput
```typescript
{
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

### MessageList
```typescript
{
  messages: Message[];
  isLoading: boolean;
}
```

### VoiceRecordingView
```typescript
{
  mediaRecorder: MediaRecorder | null;
  isMicrophoneOn: boolean;
  isVoiceLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
}
```

## Service Functions Quick Reference

### API Service
```typescript
apiRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>
```

### Query Service
```typescript
sendQuery(message: string, sessionId?: string): Promise<ApiResponse<QueryResponse>>
sendQueryWithRetry(message: string, sessionId?: string, maxRetries?: number): Promise<ApiResponse<QueryResponse>>
```

### Session Service
```typescript
getCurrentSessionId(): string | null
setCurrentSessionId(sessionId: string): void
getOrCreateSessionId(): string
createDefaultSession(): { currentSessionId: string }
clearSessionData(): void
testLocalStorage(): { available: boolean; working: boolean }
```

### Voice Service
```typescript
transcribeAudioFromBlobUrl(blobUrl: string, sessionId?: string): Promise<unknown>
```

## Type Definitions

### Message
```typescript
interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  links?: Array<{ number: string; title: string; url: string }>;
  sources?: string[];
  detectedLanguage?: string;
  confidence?: number;
}
```

### ApiResponse
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### QueryResponse
```typescript
interface QueryResponse {
  sessionId: string;
  answer: string;
  turn: {
    turnId: string;
    timestamp: string;
    userMessage: string;
    assistantMessage: string;
    detectedLanguage: string;
    confidence: number;
    sources: string[];
    links: Array<{ number: string; title: string; url: string }>;
  };
  links: Array<{ number: string; title: string; url: string }>;
  usage: {
    detectedLanguage: string;
    confidence: number;
    sourcesUsed: number;
  };
}
```

## Common Patterns

### Making an API Call
```typescript
import { apiRequest } from './services/api';

const response = await apiRequest<MyType>('/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});

if (response.success && response.data) {
  // Handle success
} else {
  // Handle error
  console.error(response.error);
}
```

### Adding State
```typescript
const [myState, setMyState] = useState<MyType>(initialValue);
```

### Using Refs
```typescript
const myRef = useRef<HTMLElement | null>(null);

// Access: myRef.current
```

### useEffect Pattern
```typescript
useEffect(() => {
  // Setup code
  
  return () => {
    // Cleanup code
  };
}, [dependencies]);
```

## Debugging Tips

### Check API Connection
Look for console logs:
- `✅ API connected` - Success
- `⚠️ API connection failed` - Failed
- `🔄 Checking...` - In progress

### Check Session State
```javascript
// Browser console
window.debugSession.showLocalStorage()
```

### Check Audio Recording
- Verify microphone permissions in browser settings
- Check console for `getUserMedia` errors
- Ensure HTTPS or localhost (required for audio)

### Common Console Messages
- `🚀 App component rendering!` - App mounted
- `🤖 ChatbotWidget mounted!` - Widget initialized
- `📤 Sending to API:` - Message being sent
- `✅ API response:` - Response received
- `📝 Voice transcription result:` - Transcription complete

## Troubleshooting Checklist

- [ ] Backend server running on correct port?
- [ ] CORS configured on backend?
- [ ] Microphone permissions granted?
- [ ] localStorage enabled in browser?
- [ ] Network tab shows API calls?
- [ ] Console shows any errors?
- [ ] TypeScript compilation successful?

## Code Style

- **Components**: PascalCase
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: Match component/function name

## Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Test thoroughly
4. Commit: `git commit -m "feat: add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create pull request

## Useful Commands

```bash
# Type checking
npx tsc --noEmit

# Build analysis
npm run build -- --mode analyze

# Clear build cache
rm -rf dist node_modules/.vite

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install
```

---

For detailed documentation, see [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

