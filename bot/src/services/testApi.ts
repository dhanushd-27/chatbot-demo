// Test file for API integration
import { sendQuery, checkHealth, getOrCreateSessionId } from './index';

/**
 * Test function to verify API integration
 * This can be called from the browser console for testing
 */
export const testApiIntegration = async () => {
  console.log('🧪 Starting API integration test...');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await checkHealth();
    console.log('Health check result:', healthResponse);
    
    if (!healthResponse.success) {
      console.error('❌ Health check failed. Make sure the backend is running on http://localhost:8000');
      return;
    }
    
    // Test 2: Get session ID
    console.log('2️⃣ Testing session management...');
    const sessionId = getOrCreateSessionId();
    console.log('Session ID:', sessionId);
    
    // Test 3: Send a test query
    console.log('3️⃣ Testing query endpoint...');
    const queryResponse = await sendQuery('Hello, this is a test message', sessionId);
    console.log('Query response:', queryResponse);
    
    if (queryResponse.success) {
      console.log('✅ API integration test completed successfully!');
      console.log('🎉 The chatbot is ready to use!');
    } else {
      console.error('❌ Query test failed:', queryResponse.error);
    }
    
  } catch (error) {
    console.error('❌ API integration test failed:', error);
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testApiIntegration = testApiIntegration;
  console.log('🔧 Test function available as window.testApiIntegration()');
}
