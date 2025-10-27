import { apiRequest, type ApiResponse } from './api';
import { getCurrentSessionId, setCurrentSessionId } from './sessionService';

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
  // Get session ID from localStorage (should exist from initialization)
  const effectiveSessionId = sessionId || getCurrentSessionId() || undefined;
  
  console.log('🔍 Query service - input sessionId:', sessionId);
  console.log('🔍 Query service - getCurrentSessionId():', getCurrentSessionId());
  console.log('🔍 Final effectiveSessionId:', effectiveSessionId);
  
  const requestBody: QueryRequest = {
    sessionId: effectiveSessionId,
    message,
    meta,
    idempotencyKey,
  };

  console.log('📤 Request body:', requestBody);

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
        console.log('💾 Updated session ID in localStorage:', response.data.sessionId);
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
