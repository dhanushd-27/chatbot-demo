import { apiRequest, type ApiResponse } from './api';
import { getSessionIdsFromStorage, handleClearChat } from './sessionService';

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
 * Uses handleClearChat to manage session transitions
 * @returns Promise with API response
 */
export const clearChat = async (): Promise<ApiResponse<ClearChatResponse>> => {
  // Get current session IDs from localStorage
  const sessionIds = getSessionIdsFromStorage();
  
  console.log('🗑️ Clearing chat session with localStorage data:', sessionIds);
  
  // Handle session management locally first
  const sessionData = handleClearChat();
  
  console.log('🗑️ After handleClearChat, new session data:', sessionData);
  
  const requestBody: ClearChatRequest = {
    currentSessionId: sessionIds.currentSessionId, // The session we're archiving (from localStorage)
    previousSessionId: sessionIds.previousSessionId, // The previous session (from localStorage)
  };

  console.log('📤 Clear chat request body:', requestBody);

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
