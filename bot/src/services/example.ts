// Example usage of the API services
import { 
  sendQuery, 
  generateSessionId,
  getCurrentSessionId 
} from './index';

/**
 * Example: How to use the query service
 */
export const exampleQueryUsage = async () => {
  // Get current session ID from localStorage
  const currentSessionId = getCurrentSessionId();
  
  if (!currentSessionId) {
    console.log('No session found, creating new session...');
    const newSessionId = generateSessionId();
    console.log('Generated new session ID:', newSessionId);
  }
  
  // Send a query
  const queryResponse = await sendQuery("Hello, how are you?", currentSessionId || undefined);
  
  if (queryResponse.success) {
    console.log('Bot response:', queryResponse.data?.answer);
  } else {
    console.error('Query failed:', queryResponse.error);
  }
};

/**
 * Example: How to use session management
 */
export const exampleSessionUsage = async () => {
  // Get or create a session ID
  const sessionId = getCurrentSessionId() || generateSessionId();
  
  console.log('Current session ID:', sessionId);
  console.log('Session management example completed');
};

/**
 * Example: How to generate a 6-digit session ID
 */
export const exampleSessionIdGeneration = () => {
  const sessionId = generateSessionId();
  console.log('Generated 6-digit session ID:', sessionId);
  // Example output: "123456" or "789012"
};
