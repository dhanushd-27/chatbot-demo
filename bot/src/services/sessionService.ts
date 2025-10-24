// Session management utilities for the chatbot frontend

// Local storage keys
const PREVIOUS_SESSION_KEY = 'chatbot_previous_session_id';
const CURRENT_SESSION_KEY = 'chatbot_current_session_id';

/**
 * Gets session IDs from localStorage
 * @returns Object containing previous and current session IDs
 */
export const getSessionIdsFromStorage = (): { previousSessionId: string; currentSessionId: string } => {
  try {
    const previousSessionId = localStorage.getItem(PREVIOUS_SESSION_KEY) || '';
    const currentSessionId = localStorage.getItem(CURRENT_SESSION_KEY) || '';
    
    console.log('📦 Retrieved session IDs from localStorage:', {
      previousSessionId,
      currentSessionId,
    });
    
    return { previousSessionId, currentSessionId };
  } catch (error) {
    console.error('❌ Error reading from localStorage:', error);
    return { previousSessionId: '', currentSessionId: '' };
  }
};

/**
 * Saves session IDs to localStorage
 * @param previousSessionId - The previous session ID
 * @param currentSessionId - The current session ID
 */
export const saveSessionIdsToStorage = (
  previousSessionId: string,
  currentSessionId: string
): void => {
  try {
    localStorage.setItem(PREVIOUS_SESSION_KEY, previousSessionId);
    localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
    
    console.log('💾 Saved session IDs to localStorage:', {
      previousSessionId,
      currentSessionId,
    });
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
  }
};

/**
 * Generates a new 6-digit random session ID
 * @returns A unique 6-digit session ID
 */
export const generateSessionId = (): string => {
  // Generate a random 6-digit number
  const random6Digit = Math.floor(100000 + Math.random() * 900000);
  return random6Digit.toString();
};

/**
 * Gets the current session ID from localStorage
 * @returns Current session ID or null if not found
 */
export const getCurrentSessionId = (): string | null => {
  try {
    const sessionId = localStorage.getItem(CURRENT_SESSION_KEY);
    console.log('📦 Retrieved current session ID:', sessionId);
    return sessionId;
  } catch (error) {
    console.error('❌ Error reading current session ID:', error);
    return null;
  }
};

/**
 * Sets the current session ID in localStorage
 * @param sessionId - The session ID to store
 */
export const setCurrentSessionId = (sessionId: string): void => {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    console.log('💾 Saved current session ID:', sessionId);
  } catch (error) {
    console.error('❌ Error saving current session ID:', error);
  }
};

/**
 * Gets or creates a session ID
 * @returns A valid session ID
 */
export const getOrCreateSessionId = (): string => {
  let sessionId = getCurrentSessionId();
  
  if (!sessionId) {
    sessionId = generateSessionId();
    setCurrentSessionId(sessionId);
    console.log('🆕 Created new session ID:', sessionId);
  }
  
  return sessionId;
};

/**
 * Clears session data from localStorage
 */
export const clearSessionData = (): void => {
  try {
    localStorage.removeItem(PREVIOUS_SESSION_KEY);
    localStorage.removeItem(CURRENT_SESSION_KEY);
    console.log('🗑️ Cleared session data from localStorage');
  } catch (error) {
    console.error('❌ Error clearing session data:', error);
  }
};
