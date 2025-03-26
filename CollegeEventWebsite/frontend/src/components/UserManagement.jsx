"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../dashboard.css"

// Import icons
import { User, Lock, Mail, UserPlus, LogIn, AlertTriangle, Info, Book } from "react-feather"

// Update the API_BASE_URL to point to the Express.js server
const API_BASE_URL = "http://localhost:5050/api" // Replace with your Express.js server URL

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("login")
  const [newUser, setNewUser] = useState({
    FirstName: "",
    LastName: "",
    Username: "",
    Email: "",
    Password: "",
  })
  const [loginData, setLoginData] = useState({
    Username: "",
    Password: "",
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const navigate = useNavigate() // Hook for navigation

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Username: loginData.Username, Password: loginData.Password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Invalid username or password")
      }

      const data = await response.json()

      // Store the token and user role in local storage
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role) // Assuming the backend returns the user's role
      localStorage.setItem("username", loginData.Username) // Optional: Store the username

      if (data.role === "Super Admin") {
        navigate("/superadmin-dashboard")
      } else if (data.role === "Admin") {
        navigate("/admin-dashboard")
      } else {
        navigate("/dashboard")
      } // Redirect to the dashboard after successful login
    } catch (err) {
      setError(err.message || "Login failed")
    }
  }

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${API_BASE_URL}/users/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FirstName: newUser.FirstName,
          LastName: newUser.LastName,
          Username: newUser.Username,
          Email: newUser.Email,
          Password: newUser.Password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to register user")
      }

      setSuccess("Registration successful! You can now log in.")
      setNewUser({ FirstName: "", LastName: "", Username: "", Email: "", Password: "" })
      setActiveTab("login") // Switch to login tab after successful registration
    } catch (err) {
      setError(err.message || "Registration failed")
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              
              <h1>Campus Events</h1>
              
            </div>
            <p className="auth-subtitle">Connect with university events and organizations</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
            <button
              className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
              onClick={() => setActiveTab("register")}
            >
              <UserPlus size={18} />
              <span>Register</span>
            </button>
          </div>

          {error && (
            <div className="error-alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-alert">
              <Info size={18} />
              <span>{success}</span>
            </div>
          )}

          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="loginUsername">
                  <User size={16} />
                  <span>Username</span>
                </label>
                <input
                  id="loginUsername"
                  type="text"
                  placeholder="Enter your username"
                  value={loginData.Username}
                  onChange={(e) => setLoginData({ ...loginData, Username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="loginPassword">
                  <Lock size={16} />
                  <span>Password</span>
                </label>
                <input
                  id="loginPassword"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.Password}
                  onChange={(e) => setLoginData({ ...loginData, Password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="auth-button">
                <LogIn size={18} />
                <span>Login</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">
                    <User size={16} />
                    <span>First Name</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={newUser.FirstName}
                    onChange={(e) => setNewUser({ ...newUser, FirstName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">
                    <User size={16} />
                    <span>Last Name</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={newUser.LastName}
                    onChange={(e) => setNewUser({ ...newUser, LastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">
                  <User size={16} />
                  <span>Username</span>
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={newUser.Username}
                  onChange={(e) => setNewUser({ ...newUser, Username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} />
                  <span>Email</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your university email"
                  value={newUser.Email}
                  onChange={(e) => setNewUser({ ...newUser, Email: e.target.value })}
                  required
                />
                <p className="input-help">Must be a valid university email address</p>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <Lock size={16} />
                  <span>Password</span>
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={newUser.Password}
                  onChange={(e) => setNewUser({ ...newUser, Password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="auth-button">
                <UserPlus size={18} />
                <span>Register</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

