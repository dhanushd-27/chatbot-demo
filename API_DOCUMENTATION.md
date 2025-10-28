# Org X Chatbot API Documentation

## Overview
This document provides comprehensive information about all available API endpoints in the Org X Chatbot application, including request/response schemas, authentication, and usage examples.

## Base URL
```
http://localhost:8000
```

## Authentication
Currently, no authentication is required for these endpoints.

## Available Endpoints

### 1. Health Check Endpoints

#### GET `/`
**Description:** Root endpoint that returns basic application info.

**Request Body:** None

**Response Body:**
```json
{
  "name": "Org X Chatbot API",
  "version": "2.0.0",
  "status": "running",
  "environment": "development",
  "docs": "/docs"
}
```

#### GET `/health`
**Description:** Returns the health status of all services and dependencies.

**Request Body:** None

**Response Body:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-10-23T14:30:00Z",
  "version": "2.0.0",
  "services": [
    {
      "name": "cosmos_db",
      "status": "healthy" | "degraded" | "unhealthy",
      "message": "Connected" | "Using fallback storage"
    },
    {
      "name": "rag_system",
      "status": "healthy" | "unhealthy",
      "message": "Initialized" | "Not initialized"
    },
    {
      "name": "azure_openai",
      "status": "healthy" | "unhealthy",
      "message": "Connected" | "Not configured"
    }
  ]
}
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T15:06:31.738Z",
  "version": "2.0.0",
  "services": [
    {
      "name": "cosmos_db",
      "status": "healthy",
      "message": "Connected"
    },
    {
      "name": "rag_system",
      "status": "healthy",
      "message": "Initialized"
    },
    {
      "name": "azure_openai",
      "status": "healthy",
      "message": "Connected"
    }
  ]
}
```

#### GET `/metrics`
**Description:** Returns Prometheus metrics in plain text format.

**Request Body:** None

**Response Body:** Plain text (Prometheus format)
```
# HELP chatbot_info Application info
# TYPE chatbot_info gauge
chatbot_info{version="2.0.0",environment="production"} 1

# HELP chatbot_sessions_total Total number of sessions
# TYPE chatbot_sessions_total counter
chatbot_sessions_total 0

# HELP chatbot_requests_total Total requests
# TYPE chatbot_requests_total counter
chatbot_requests_total 0
```

### 2. Chat Endpoints

#### POST `/query`
**Description:** Main chat endpoint that processes user queries with RAG (Retrieval-Augmented Generation) system. Supports multilingual input and automatic language detection.

**Request Body:**
```json
{
  "sessionId": "optional-uuid-string",
  "message": "User query text (1-2000 chars)",
  "meta": {},
  "idempotencyKey": "optional-key"
}
```

**Request Body Schema:**
- `sessionId` (optional): Session ID for conversation continuity
- `message` (required): User query text, 1-2000 characters
- `meta` (optional): Additional metadata object
- `idempotencyKey` (optional): Key for duplicate request prevention

**Response Body:**
```json
{
  "sessionId": "uuid-string",
  "answer": "Bot response text",
  "turn": {
    "turnId": "turn-uuid",
    "timestamp": "2025-10-23T14:30:00Z",
    "userMessage": "User query",
    "assistantMessage": "Bot response",
    "detectedLanguage": "en",
    "confidence": 0.95,
    "sources": ["source1", "source2"],
    "links": [
      {
        "number": "1",
        "title": "Link title",
        "url": "https://..."
      }
    ]
  },
  "links": [
    {
      "number": "1",
      "title": "Link title",
      "url": "https://..."
    }
  ],
  "usage": {
    "detectedLanguage": "en",
    "confidence": 0.95,
    "sourcesUsed": 1
  }
}
```

**Example Request:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "What is Org X Neosteel?",
  "meta": {"source": "web_app"},
  "idempotencyKey": "req-123"
}
```

**Example Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "Org X Neosteel is a premium TMT bar [[1]]...",
  "turn": {
    "turnId": "turn-123",
    "timestamp": "2025-10-23T14:30:00Z",
    "userMessage": "What is Org X Neosteel?",
    "assistantMessage": "Org X Neosteel is...",
    "detectedLanguage": "en",
    "confidence": 0.95,
    "sources": ["source1"],
    "links": [{"number": "1", "title": "...", "url": "..."}]
  },
  "links": [{"number": "1", "title": "Org X Neosteel", "url": "https://..."}],
  "usage": {"detectedLanguage": "en", "confidence": 0.95, "sourcesUsed": 1}
}
```

### 3. Voice Endpoints

#### POST `/voice`
**Description:** Voice transcription endpoint that converts audio files to text using Azure Whisper with automatic language detection.

**Request Body:** Form data (multipart/form-data)
- `file` (required): Audio file
- `sessionId` (optional): Session ID as query parameter or form field

**Supported Audio Formats:**
- `.wav`
- `.mp3`
- `.webm`
- `.ogg`
- `.m4a`
- `.flac`

**File Size Limit:** 10MB maximum

**Response Body:**
```json
{
  "sessionId": "uuid-string",
  "transcript": "Transcribed text in detected language",
  "detectedLang": "en",
  "confidence": 0.9
}
```

**Example Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "transcript": "What is Org X Neosteel?",
  "detectedLang": "en",
  "confidence": 0.95
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/voice?sessionId=your-session-id" \
  -F "file=@audio.wav"
```

### 4. Session Management Endpoints

#### DELETE `/clear-chat`
**Description:** Archives the current chat session and clears the conversation history.

**Request Body:**
```json
{
  "currentSessionId": "session-uuid-to-archive",
  "previousSessionId": "previous-session-uuid"
}
```

**Request Body Schema:**
- `currentSessionId` (optional): Session ID to archive
- `previousSessionId` (optional): Previous session ID for reference

**Response Body:**
```json
{
  "message": "Chat cleared successfully. Session archived with 5 turns.",
  "archivedTurns": 5,
  "currentSessionId": "archived-session-uuid",
  "previousSessionId": "previous-session-uuid"
}
```

**Example Request:**
```json
{
  "currentSessionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousSessionId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Example Response:**
```json
{
  "message": "Chat cleared successfully. Session archived with 5 turns.",
  "archivedTurns": 5,
  "currentSessionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousSessionId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### DELETE `/session-init`
**Description:** Initializes a new session immediately and archives the previous session asynchronously.

**Request Body:**
```json
{
  "newSessionId": "client-generated-session-id",
  "previousSessionId": "previous-session-uuid"
}
```

**Request Body Schema:**
- `newSessionId` (required): New client-generated session ID to start using immediately
- `previousSessionId` (optional): Previous session ID to archive in the background

**Response Body:**
```json
{
  "message": "New chat session ready. Previous session archiving started.",
  "archivedTurns": 5,
  "newSessionId": "client-generated-session-id",
  "previousSessionId": "previous-session-uuid"
}
```

**Example Request:**
```json
{
  "newSessionId": "a3c2d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "previousSessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example Response:**
```json
{
  "message": "New chat session ready. Previous session archiving started.",
  "archivedTurns": 5,
  "newSessionId": "a3c2d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "previousSessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Error Responses

All endpoints may return standard HTTP error responses:

### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error message"
}
```

### 503 Service Unavailable
```json
{
  "detail": "RAG system unavailable"
}
```

## Special Features

### Multilingual Support
- **Automatic Language Detection:** The `/query` endpoint automatically detects the input language
- **Supported Languages:** English, Hindi, Marathi, Kannada, and other Indian languages
- **Cultural Sensitivity:** Responses include appropriate local terms (e.g., "सरिया" for TMT bars in Hindi)

### Session Management
- **Auto-Generated Sessions:** If no sessionId is provided, a new UUID is generated
- **Conversation History:** Maintains last 5 conversation turns for context
- **Session Archiving:** Old sessions are archived when cleared

### RAG Integration
- **Retrieval-Augmented Generation:** Uses Org X knowledge base for accurate responses
- **Source Citations:** Responses include numbered citations with links
- **Confidence Scoring:** Each response includes a confidence score (0-1)

## Usage Examples

### Basic Chat Flow
1. **Start Conversation:**
   ```bash
   curl -X POST "http://localhost:8000/query" \
     -H "Content-Type: application/json" \
    -d '{"message": "What is Org X Neosteel?"}'
   ```

2. **Continue Conversation:**
   ```bash
   curl -X POST "http://localhost:8000/query" \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "your-session-id", "message": "What are its technical specifications?"}'
   ```

3. **Clear Chat:**
   ```bash
   curl -X DELETE "http://localhost:8000/clear-chat" \
     -H "Content-Type: application/json" \
     -d '{"currentSessionId": "your-session-id"}'
   ```

### Voice Input Flow
1. **Upload Audio:**
   ```bash
   curl -X POST "http://localhost:8000/voice" \
     -F "file=@audio.wav" \
     -F "sessionId=your-session-id"
   ```

2. **Use Transcript in Chat:**
   ```bash
   curl -X POST "http://localhost:8000/query" \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "your-session-id", "message": "transcribed-text-from-voice"}'
   ```

## Rate Limits
Currently, no rate limits are implemented.

## Dependencies
- **Cosmos DB:** For session storage and conversation history
- **Azure OpenAI:** For chat completions and Whisper transcription
- **RAG System:** For knowledge retrieval and response generation

## Version
API Version: 2.0.0

---

*This documentation is generated from the Org X Chatbot API codebase and reflects the current implementation as of the latest version.*
