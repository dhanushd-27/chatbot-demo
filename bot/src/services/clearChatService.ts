import { apiRequest, type ApiResponse } from './api';

// Interface for clear chat request
export interface ClearChatRequest {
  sessionId: string;
}

// Interface for clear chat response
export interface ClearChatResponse {
  newSessionId: string;
  message: string;
  archivedTurns: number;
}

/**
 * Clears the chat session and creates a new one
 * @param sessionId - The current session ID to clear
 * @returns Promise with API response containing new session ID
 */
export const clearChat = async (
  sessionId: string
): Promise<ApiResponse<ClearChatResponse>> => {
  console.log('🗑️ Clearing chat session:', sessionId);
  
  const requestBody: ClearChatRequest = {
    sessionId,
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
