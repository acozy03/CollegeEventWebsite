import { useState } from 'react'
import UserManagement from './components/UserManagement'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>you did it. you logged in. now turn off the fucking computer and stop working.</h1>
      </header>
      <main>
        <UserManagement />
      </main>
    </div>
  )
}

export default App
