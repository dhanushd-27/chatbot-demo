// Export all API services
export * from './api';
export * from './queryService';
export * from './sessionService';
export * from './sessionInitService';
export * from './healthService';
export * from './testApi';

// Re-export commonly used types and functions
export type { ApiResponse, ApiError } from './api';
export type { QueryRequest, QueryResponse } from './queryService';
export type { SessionInitRequest, SessionInitResponse } from './sessionInitService';
export type { HealthResponse } from './healthService';

// Re-export main service functions
export { sendQuery, sendQueryWithRetry } from './queryService';
export { sessionInit } from './sessionInitService';
export { checkHealth } from './healthService';
export { 
  generateSessionId, 
  getSessionIdsFromStorage, 
  saveSessionIdsToStorage, 
  getCurrentSessionId,
  setCurrentSessionId,
  getOrCreateSessionId,
  clearSessionData,
  createNewSession,
  isFirstMessage,
  testLocalStorage,
  handleClearChat,
  createDefaultSession
} from './sessionService';
