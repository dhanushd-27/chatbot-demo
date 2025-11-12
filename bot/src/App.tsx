// Import the main CSS styles for the App component
import './App.css';
// Import the ChatbotWidget component - the main chatbot interface
import ChatbotWidget from './components/ChatbotWidget';

/**
 * App Component
 * 
 * This is the root component of the application. It serves as the main entry point
 * and renders the ChatbotWidget component which contains all the chatbot functionality.
 * 
 * @returns {JSX.Element} The main app container with the chatbot widget
 */
function App() {
  // Log when the App component renders (useful for debugging)
  console.log('🚀 App component rendering!');
  
  // Return the main app structure with the chatbot widget
  return (
    <div className="App">
      {/* Render the main chatbot widget component */}
      <ChatbotWidget />
    </div>
  );
}

// Export the App component as the default export
export default App;