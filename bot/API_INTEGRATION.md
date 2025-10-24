# 🤖 Bot Frontend API Integration

This document describes the API integration between the bot frontend and the JSW Steel Chatbot backend.

## 🔗 API Endpoints

The bot frontend communicates with the following backend endpoints:

### 1. **POST /query** - Chat with the Bot
- **Purpose**: Send user messages and receive AI responses
- **Request**: `{ sessionId?, message, meta?, idempotencyKey? }`
- **Response**: Full conversation turn with links, sources, and metadata

### 2. **DELETE /clear-chat** - Clear Chat Session
- **Purpose**: Archive current session and create a new one
- **Request**: `{ sessionId }`
- **Response**: New session ID and archived turn count

### 3. **GET /health** - Health Check
- **Purpose**: Check API and service health
- **Response**: Service status and version information

## 🛠️ Services

### Core Services
- **`api.ts`** - Base API configuration and request handling
- **`queryService.ts`** - Chat query functionality
- **`clearChatService.ts`** - Session management
- **`healthService.ts`** - Health monitoring
- **`sessionService.ts`** - Session ID management

### Key Features
- ✅ **Session Management** - Automatic session ID generation and persistence
- ✅ **Error Handling** - Comprehensive error handling with user feedback
- ✅ **Loading States** - Visual feedback during API calls
- ✅ **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Health Monitoring** - Real-time API connection status
- ✅ **Link Display** - Automatic source link rendering
- ✅ **Language Detection** - Display detected language and confidence

## 🚀 Usage

### Basic Integration
```typescript
import { sendQuery, checkHealth, clearChat } from './services';

// Send a message
const response = await sendQuery('Hello, what is JSW Neosteel?');

// Check API health
const health = await checkHealth();

// Clear chat session
const clearResult = await clearChat(sessionId);
```

### Testing
```javascript
// In browser console
window.testApiIntegration();
```

## 🔧 Configuration

### Environment Variables
- `REACT_APP_API_BASE_URL` - Backend API URL (default: http://localhost:8000)

### API Base URL
The default API base URL is `http://localhost:8000` which matches the backend server.

## 📱 UI Features

### Connection Status
- 🟢 **Connected** - API is healthy and responsive
- 🔴 **Offline** - API is unavailable
- 🔄 **Checking** - Initializing connection

### Message Features
- **Source Links** - Clickable links to referenced sources
- **Language Detection** - Shows detected language and confidence
- **Loading Indicators** - Visual feedback during API calls
- **Error Handling** - User-friendly error messages

### Session Management
- **Auto Session Creation** - Automatic session ID generation
- **Session Persistence** - Maintains session across page reloads
- **Clear Chat** - Archive current session and start fresh

## 🧪 Testing

### Manual Testing
1. Start the backend server (port 8000)
2. Start the bot frontend (port 3000)
3. Open browser console and run: `window.testApiIntegration()`

### API Test Flow
1. Health check to verify backend connectivity
2. Session ID generation/retrieval
3. Send test query to verify full integration
4. Display results in console

## 🔄 Data Flow

```
User Input → ChatbotWidget → API Services → Backend API → Response Processing → UI Update
```

### Request Flow
1. User types message
2. `handleSendMessage()` called
3. `sendQuery()` makes API request
4. Response processed and displayed
5. Session ID updated if changed

### Error Handling
1. API errors caught and logged
2. User-friendly error messages displayed
3. Connection status updated
4. Retry logic applied where appropriate

## 📊 Response Format

### Query Response
```typescript
{
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
    links: Array<{number: string, title: string, url: string}>;
  };
  links: Array<{number: string, title: string, url: string}>;
  usage: {
    detectedLanguage: string;
    confidence: number;
    sourcesUsed: number;
  };
}
```

## 🎯 Next Steps

1. **Voice Integration** - Implement voice input using the `/voice` endpoint
2. **Advanced Error Handling** - Add more sophisticated error recovery
3. **Performance Optimization** - Implement request caching and optimization
4. **Analytics** - Add usage tracking and analytics
5. **Customization** - Add theme and branding options

---

**Status**: ✅ Complete  
**Last Updated**: December 2024  
**Version**: 1.0.0
