import { apiRequest, type ApiResponse } from './api';
import { getSessionIdsFromStorage } from './sessionService';

// Interface for clear chat request (matching backend API)
export interface ClearChatRequest {
  currentSessionId?: string;
  previousSessionId?: string;
}

// Interface for clear chat response (matching backend API)
export interface ClearChatResponse {
  message: string;
  archivedTurns: number;
  currentSessionId: string;
  previousSessionId: string;
}

/**
 * Clears the chat session and archives it
 * Uses currentSessionId and previousSessionId from localStorage
 * @param currentSessionId - Optional current session ID (if not provided, will use localStorage)
 * @param previousSessionId - Optional previous session ID (if not provided, will use localStorage)
 * @returns Promise with API response
 */
export const clearChat = async (
  currentSessionId?: string,
  previousSessionId?: string
): Promise<ApiResponse<ClearChatResponse>> => {
  // Get session IDs from localStorage if not provided
  const sessionIds = getSessionIdsFromStorage();
  const effectiveCurrentSessionId = currentSessionId || sessionIds.currentSessionId;
  const effectivePreviousSessionId = previousSessionId || sessionIds.previousSessionId;
  
  console.log('🗑️ Clearing chat session:', {
    currentSessionId: effectiveCurrentSessionId,
    previousSessionId: effectivePreviousSessionId,
  });
  
  const requestBody: ClearChatRequest = {
    currentSessionId: effectiveCurrentSessionId,
    previousSessionId: effectivePreviousSessionId,
  };

  try {
    const response = await apiRequest<ClearChatResponse>('/clear-chat', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
    });

    if (response.success) {
      console.log('✅ Chat cleared successfully:', response.data);
    } else {
      console.error('❌ Clear chat failed:', response.error);
    }

    return response;
  } catch (error) {
    console.error('❌ Clear chat service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear chat',
    };
  }
};
