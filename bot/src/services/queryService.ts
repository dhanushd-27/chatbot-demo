import { apiRequest, type ApiResponse } from './api';
import { getOrCreateSessionId, getCurrentSessionId, setCurrentSessionId, isFirstMessage } from './sessionService';

// Interface for query request (matching backend API)
export interface QueryRequest {
  sessionId?: string;
  message: string;
  meta?: Record<string, any>;
  idempotencyKey?: string;
}

// Interface for query response (matching backend API)
export interface QueryResponse {
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
    links: Array<{
      number: string;
      title: string;
      url: string;
    }>;
  };
  links: Array<{
    number: string;
    title: string;
    url: string;
  }>;
  usage: {
    detectedLanguage: string;
    confidence: number;
    sourcesUsed: number;
  };
}

/**
 * Sends a query message to the chatbot API
 * Session ID is automatically created on first message if not provided
 * @param message - The user's message
 * @param sessionId - Optional session identifier (if not provided, will be created automatically)
 * @param meta - Optional metadata
 * @param idempotencyKey - Optional idempotency key
 * @returns Promise with API response
 */
export const sendQuery = async (
  message: string,
  sessionId?: string,
  meta?: Record<string, any>,
  idempotencyKey?: string
): Promise<ApiResponse<QueryResponse>> => {
  // Determine the session ID to use
  let effectiveSessionId = sessionId;
  
  if (!effectiveSessionId) {
    if (isFirstMessage()) {
      // No session exists - this is the first message, create a new session
      effectiveSessionId = getOrCreateSessionId();
      console.log('🆕 Created new session for first message:', effectiveSessionId);
    } else {
      // Use existing session ID
      effectiveSessionId = getCurrentSessionId() || '';
      console.log('🔄 Using existing session:', effectiveSessionId);
    }
  }
  
  console.log('🔍 Sending query request:', { 
    sessionId: effectiveSessionId, 
    message, 
    meta, 
    idempotencyKey 
  });
  
  const requestBody: QueryRequest = {
    sessionId: effectiveSessionId,
    message,
    meta,
    idempotencyKey,
  };

  try {
    const response = await apiRequest<QueryResponse>('/query', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (response.success) {
      console.log('✅ Query request successful:', response.data);
      
      // Update localStorage with the session ID returned from the server
      if (response.data?.sessionId) {
        setCurrentSessionId(response.data.sessionId);
      }
    } else {
      console.error('❌ Query request failed:', response.error);
    }

    return response;
  } catch (error) {
    console.error('❌ Query service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send query',
    };
  }
};

/**
 * Sends a query with retry logic
 * Session ID is automatically created on first message if not provided
 * @param message - The user's message
 * @param sessionId - Optional session identifier (if not provided, will be created automatically)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param meta - Optional metadata
 * @param idempotencyKey - Optional idempotency key
 * @returns Promise with API response
 */
export const sendQueryWithRetry = async (
  message: string,
  sessionId?: string,
  maxRetries: number = 3,
  meta?: Record<string, any>,
  idempotencyKey?: string
): Promise<ApiResponse<QueryResponse>> => {
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Query attempt ${attempt}/${maxRetries}`);
    
    const response = await sendQuery(message, sessionId, meta, idempotencyKey);
    
    if (response.success) {
      console.log(`✅ Query succeeded on attempt ${attempt}`);
      return response;
    }
    
    lastError = response.error || 'Unknown error';
    console.warn(`⚠️ Query attempt ${attempt} failed:`, lastError);
    
    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`❌ All ${maxRetries} query attempts failed`);
  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
};
