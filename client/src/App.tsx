import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [chatbotOpen, setChatbotOpen] = useState(false)

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Received message:', event.data, 'from origin:', event.origin)
      
      if (event.origin !== 'http://localhost:55038') {
        console.log('❌ Origin mismatch, ignoring message')
        return
      }
      
      if (event.data.type === 'CHATBOT_TOGGLE') {
        console.log('🤖 Chatbot state changed:', event.data.isOpen ? 'OPEN' : 'CLOSED')
        setChatbotOpen(event.data.isOpen)
      }
    }

    console.log('👂 Setting up message listener')
    window.addEventListener('message', handleMessage)
    return () => {
      console.log('🧹 Cleaning up message listener')
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Client Website</h1>
        <p>This is the main client application</p>
        <p>Click the chat icon in the bottom-right to test the chatbot!</p>
      </header>
      
      <main className="app-content">
        <section className="hero">
          <h2>Welcome to Our Website</h2>
          <p>This is where the chatbot will be embedded via iframe</p>
          <p>When chatbot is closed, you can interact with this content normally!</p>
        </section>
        
        <section className="content">
          <h3>About Us</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <button 
            className="interactive-button"
            onClick={() => console.log('🎉 Background button clicked! Client app is interactive!')}
          >
            Click me! (This should work when chatbot is closed)
          </button>
        </section>
      </main>
      
      {/* Chatbot iframe - always rendered and interactive */}
      <div id="chatbot-container">
        <iframe
          src="http://localhost:55038"
          width="100%"
          height="100%"
          frameBorder="0"
          title="Chatbot Widget"
          style={{
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>
    </div>
  )
}

export default App