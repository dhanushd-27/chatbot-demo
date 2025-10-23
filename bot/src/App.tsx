import './App.css'
import ChatbotWidget from './ChatbotWidget'

function App() {
  return (
    <div className="App">
      <h1>Bot App</h1>
      <p>Welcome to your clean Vite React + TypeScript app!</p>
      <p>Click the chat icon in the bottom-right corner to test the chatbot widget!</p>
      
      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  )
}

export default App