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
 * Generates a new 12-character alphanumeric session ID
 * @returns A unique 12-character alphanumeric session ID
 */
export const generateSessionId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  console.log('🎲 Generated new sessionId:', result);
  return result;
};

/**
 * Gets the current session ID from localStorage
 * @returns Current session ID or null if not found
 */
export const getCurrentSessionId = (): string | null => {
  try {
    const sessionId = localStorage.getItem(CURRENT_SESSION_KEY);
    console.log('📦 Retrieved current session ID from localStorage:', sessionId);
    console.log('📦 localStorage keys:', Object.keys(localStorage));
    console.log('📦 localStorage values:', {
      [CURRENT_SESSION_KEY]: localStorage.getItem(CURRENT_SESSION_KEY),
      [PREVIOUS_SESSION_KEY]: localStorage.getItem(PREVIOUS_SESSION_KEY)
    });
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
    console.log('💾 Saved current session ID to localStorage:', sessionId);
    console.log('💾 localStorage after save:', {
      [CURRENT_SESSION_KEY]: localStorage.getItem(CURRENT_SESSION_KEY),
      [PREVIOUS_SESSION_KEY]: localStorage.getItem(PREVIOUS_SESSION_KEY)
    });
  } catch (error) {
    console.error('❌ Error saving current session ID:', error);
  }
};

/**
 * Gets or creates a session ID
 * @returns A valid session ID
 */
export const getOrCreateSessionId = (): string => {
  console.log('🔍 getOrCreateSessionId - starting...');
  
  // Test localStorage availability
  if (typeof localStorage === 'undefined') {
    console.error('❌ localStorage is not available');
    return generateSessionId();
  }
  
  let sessionId = getCurrentSessionId();
  console.log('🔍 getOrCreateSessionId - current sessionId:', sessionId);
  
  if (!sessionId) {
    sessionId = generateSessionId();
    console.log('🆕 Generated new sessionId:', sessionId);
    setCurrentSessionId(sessionId);
    
    // Verify it was stored
    const verifySessionId = getCurrentSessionId();
    console.log('🆕 After setCurrentSessionId, verification:', verifySessionId);
    
    if (verifySessionId !== sessionId) {
      console.error('❌ SessionId was not properly stored in localStorage!');
    }
  }
  
  console.log('🔍 getOrCreateSessionId - returning:', sessionId);
  return sessionId;
};

/**
 * Handles clear chat functionality
 * Moves current session to previous and creates new current session
 * @returns Object with new session IDs
 */
export const handleClearChat = (): { currentSessionId: string; previousSessionId: string } => {
  console.log('🗑️ Handling clear chat...');
  
  // Get current session ID
  const currentSessionId = getCurrentSessionId();
  
  // Generate new session ID
  const newSessionId = generateSessionId();
  
  // Move current to previous (only if current exists)
  if (currentSessionId) {
    localStorage.setItem(PREVIOUS_SESSION_KEY, currentSessionId);
    console.log('📦 Moved current session to previous:', currentSessionId);
  }
  
  // Set new session as current
  localStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
  console.log('🆕 Set new session as current:', newSessionId);
  
  const result = {
    currentSessionId: newSessionId,
    previousSessionId: currentSessionId || ''
  };
  
  console.log('✅ Clear chat result:', result);
  return result;
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

/**
 * Creates a new session and moves current session to previous
 * This is typically called when starting a new conversation
 * @returns The new session ID
 */
export const createNewSession = (): string => {
  try {
    // Get current session ID before creating new one
    const currentSessionId = getCurrentSessionId();
    
    // Generate new session ID
    const newSessionId = generateSessionId();
    
    // Save previous session ID if it exists
    if (currentSessionId) {
      localStorage.setItem(PREVIOUS_SESSION_KEY, currentSessionId);
    }
    
    // Set new session as current
    localStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
    
    console.log('🆕 Created new session:', {
      previousSessionId: currentSessionId || '',
      currentSessionId: newSessionId,
    });
    
    return newSessionId;
  } catch (error) {
    console.error('❌ Error creating new session:', error);
    // Fallback to simple generation
    return generateSessionId();
  }
};

/**
 * Checks if this is the first message in a conversation
 * @returns true if no current session exists
 */
export const isFirstMessage = (): boolean => {
  const currentSessionId = getCurrentSessionId();
  return !currentSessionId;
};

/**
 * Creates only current session ID by default
 * Previous session ID remains undefined until clear chat
 * @returns Object with current session ID
 */
export const createDefaultSession = (): { currentSessionId: string } => {
  console.log('🆕 Creating default current session...');
  
  // Generate only current session ID
  const currentSessionId = generateSessionId();
  
  // Store only current session in localStorage
  localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
  
  const result = {
    currentSessionId
  };
  
  console.log('✅ Created default current session:', result);
  return result;
};

/**
 * Test localStorage functionality
 * @returns Object with test results
 */
export const testLocalStorage = (): { available: boolean; working: boolean; error?: string } => {
  try {
    if (typeof localStorage === 'undefined') {
      return { available: false, working: false, error: 'localStorage is undefined' };
    }
    
    const testKey = 'test_key_' + Date.now();
    const testValue = 'test_value_' + Math.random();
    
    localStorage.setItem(testKey, testValue);
    const retrievedValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    const working = retrievedValue === testValue;
    
    console.log('🧪 localStorage test:', { 
      available: true, 
      working, 
      testKey, 
      testValue, 
      retrievedValue 
    });
    
    return { available: true, working };
  } catch (error) {
    console.error('❌ localStorage test failed:', error);
    return { 
      available: true, 
      working: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
