import { useState } from 'react'
import UserManagement from './components/UserManagement'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>College Event Website</h1>
      </header>
      <main>
        <UserManagement />
      </main>
    </div>
  )
}

export default App
